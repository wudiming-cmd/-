import React, { useState, useRef } from 'react';
import { Search, X, ImageIcon } from 'lucide-react';

const SERPAPI_KEY = '6623843769a6e0836519e7e6b67f5d3b1cae972ccfd1af64774a225cdd81b7d3';
// 免费申请：https://pixabay.com/api/docs/  注册后粘贴到这里
const PIXABAY_KEY = '48031064-68e3b6e7fb1f4b4e3a5a0c7b4';

interface ImageResult {
  title: string;
  thumbnail: string;
  original?: string;
  source?: string;
}

interface ImageSearchPanelProps {
  onUseImage: (dataUrl: string, name: string) => void;
}

const QUICK_TAGS = ['极简美学', 'iOS界面', '玻璃质感', '渐变配色', '暗黑风格', '赛博朋克', '3D图标', '霓虹发光'];

// ─── Pinterest via SerpAPI proxy ────────────────────────────────────────────
async function searchViaPinterest(q: string, signal: AbortSignal): Promise<ImageResult[]> {
  const url = `/api/serpapi/search.json?engine=pinterest&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return (json.pins || []).slice(0, 24).map((pin: any) => ({
    title: pin.title || pin.description || q,
    thumbnail: pin.images?.['236x']?.url || pin.image_src || '',
    original: pin.images?.['736x']?.url || pin.images?.orig?.url || pin.image_src || '',
    source: 'Pinterest',
  })).filter((i: ImageResult) => i.thumbnail);
}

// ─── Pixabay（CORS 原生支持，无需代理）──────────────────────────────────────
async function searchViaPixabay(q: string, signal: AbortSignal): Promise<ImageResult[]> {
  if (!PIXABAY_KEY || PIXABAY_KEY.startsWith('YOUR_')) throw new Error('Pixabay key not configured');
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=24&safesearch=true&lang=zh`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`);
  const json = await res.json();
  return (json.hits || []).slice(0, 24).map((img: any) => ({
    title: img.tags || q,
    thumbnail: img.previewURL || img.webformatURL,
    original: img.webformatURL || img.largeImageURL,
    source: 'Pixabay',
  })).filter((i: ImageResult) => i.thumbnail);
}

const ImageSearchPanel: React.FC<ImageSearchPanelProps> = ({ onUseImage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const search = async (q: string) => {
    if (!q.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError('');
    setSource('');
    setResults([]);
    try {
      let items: ImageResult[] = [];
      // Primary: Pinterest
      try {
        items = await searchViaPinterest(q, abortRef.current.signal);
        if (items.length > 0) setSource('Pinterest');
      } catch (e1: any) {
        if (e1.name === 'AbortError') throw e1;
        // Fallback: Pixabay
        try {
          items = await searchViaPixabay(q, abortRef.current.signal);
          if (items.length > 0) setSource('Pixabay');
        } catch (e2: any) {
          if (e2.name === 'AbortError') throw e2;
          throw new Error('两个图片源均不可用，请检查网络或稍后重试');
        }
      }
      setResults(items);
      if (items.length === 0) setError('未找到相关图片，换个关键词试试');
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async (img: ImageResult) => {
    setConverting(img.thumbnail);
    try {
      const src = img.original || img.thumbnail;
      // Try CORS fetch first
      try {
        const response = await fetch(src, { mode: 'cors' });
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        onUseImage(dataUrl, img.title);
        return;
      } catch { /* fall through */ }
      // Try canvas drawImage
      try {
        const c = document.createElement('canvas');
        c.width = 400; c.height = 400;
        const ctx = c.getContext('2d')!;
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.src = src;
        await new Promise<void>((res) => { imgEl.onload = () => res(); imgEl.onerror = () => res(); });
        ctx.drawImage(imgEl, 0, 0, 400, 400);
        onUseImage(c.toDataURL('image/jpeg', 0.9), img.title);
        return;
      } catch { /* fall through */ }
      // Last resort: use URL directly (display works, export may not)
      onUseImage(src, img.title);
    } finally {
      setConverting(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search bar */}
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Search size={13} color="rgba(255,255,255,0.3)" style={{ marginLeft: 8, flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') search(query); }}
              placeholder="搜索 Pinterest 图片资源..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 12, padding: '7px 8px' }}
            />
            {query ? (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center' }}>
                <X size={11} />
              </button>
            ) : null}
          </div>
          <button
            onClick={() => search(query)}
            disabled={loading || !query.trim()}
            style={{ padding: '7px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#e60023,#ad081b)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', opacity: loading || !query.trim() ? 0.6 : 1, flexShrink: 0 }}
          >
            搜索
          </button>
        </div>

        {/* Quick tags */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => { setQuery(tag); search(tag); }}
              style={{ padding: '3px 8px', borderRadius: 12, border: '1px solid rgba(230,0,35,0.25)', background: 'rgba(230,0,35,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 10, cursor: 'pointer', fontWeight: 500 }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Source badge */}
        {source ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: source === 'Pinterest' ? 'rgba(230,0,35,0.15)' : 'rgba(32,173,228,0.15)', color: source === 'Pinterest' ? '#e60023' : '#20ade4', fontWeight: 700 }}>
              {source === 'Pinterest' ? '📌 Pinterest' : '🖼 Pixabay'}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{results.length} 张结果</span>
          </div>
        ) : null}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 12px 12px' }}>
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, paddingTop: 4 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ aspectRatio: '3/4', borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(239,68,68,0.7)', marginBottom: 6 }}>{error}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>提示：确保已连接网络，或尝试英文关键词</div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📌</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>搜索后点击图片即可添加到上传库</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>来源：Pinterest · Pixabay</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {results.map((img, i) => (
              <div
                key={i}
                title={img.title}
                onClick={() => handleUse(img)}
                style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <img
                  src={img.thumbnail}
                  alt={img.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                {converting === img.thumbnail && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'; }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSearchPanel;
