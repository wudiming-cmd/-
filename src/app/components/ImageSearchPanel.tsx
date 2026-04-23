import React, { useState, useRef } from 'react';
import { Search, X, ImageIcon } from 'lucide-react';

const SERPAPI_KEY = '6623843769a6e0836519e7e6b67f5d3b1cae972ccfd1af64774a225cdd81b7d3';

interface ImageResult {
  title: string;
  thumbnail: string;
  original?: string;
  source?: string;
}

interface ImageSearchPanelProps {
  onUseImage: (dataUrl: string, name: string) => void;
}

const QUICK_TAGS = ['极简风格', '赛博朋克', '自然风景', '深色主题', '霓虹灯', '建筑'];

async function searchViaSerpAPI(q: string, signal: AbortSignal): Promise<ImageResult[]> {
  const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return (json.images_results || []).slice(0, 12).map((img: any) => ({
    title: img.title || q,
    thumbnail: img.thumbnail || img.original,
    original: img.original,
    source: img.source,
  })).filter((i: ImageResult) => i.thumbnail);
}

async function searchViaUnsplash(q: string, signal: AbortSignal): Promise<ImageResult[]> {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=12&xp=editorial-unlock:control`;
  const res = await fetch(url, { signal, headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
  const json = await res.json();
  return (json.results || []).slice(0, 12).map((img: any) => ({
    title: img.alt_description || img.description || q,
    thumbnail: img.urls?.small || img.urls?.thumb,
    original: img.urls?.regular,
    source: 'Unsplash',
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
      try {
        items = await searchViaSerpAPI(q, abortRef.current.signal);
        if (items.length > 0) setSource('Google Images');
      } catch (serpErr: any) {
        if (serpErr.name === 'AbortError') throw serpErr;
        // Fallback to Unsplash
        try {
          items = await searchViaUnsplash(q, abortRef.current.signal);
          if (items.length > 0) setSource('Unsplash');
        } catch (unsplashErr: any) {
          if (unsplashErr.name === 'AbortError') throw unsplashErr;
          throw new Error('两个图片源均不可用');
        }
      }
      setResults(items);
      if (items.length === 0) setError('未找到相关图片');
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(`搜索失败：${err.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async (img: ImageResult) => {
    setConverting(img.thumbnail);
    try {
      // Fetch via proxy or direct if CORS allows; fall back to thumbnail
      const src = img.original || img.thumbnail;
      const response = await fetch(src, { mode: 'cors' });
      const blob = await response.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      onUseImage(dataUrl, img.title);
    } catch {
      // If CORS fails, pass thumbnail URL directly as-is with a placeholder signal
      try {
        const c = document.createElement('canvas');
        c.width = 200; c.height = 200;
        const ctx = c.getContext('2d');
        if (ctx) {
          const imgEl = new Image();
          imgEl.crossOrigin = 'anonymous';
          imgEl.src = img.thumbnail;
          await new Promise<void>((res) => { imgEl.onload = () => res(); imgEl.onerror = () => res(); });
          ctx.drawImage(imgEl, 0, 0, 200, 200);
          onUseImage(c.toDataURL('image/png'), img.title);
        }
      } catch {
        onUseImage(img.thumbnail, img.title);
      }
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
              placeholder="搜索图片资源..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 12, padding: '7px 8px' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center' }}>
                <X size={11} />
              </button>
            )}
          </div>
          <button
            onClick={() => search(query)}
            disabled={loading || !query.trim()}
            style={{ padding: '7px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', opacity: loading || !query.trim() ? 0.6 : 1, flexShrink: 0 }}
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
              style={{ padding: '3px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.55)', fontSize: 10, cursor: 'pointer', fontWeight: 500 }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 12px 12px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          </div>
        )}

        {!loading && source && results.length > 0 && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginBottom: 4 }}>来源: {source}</div>
        )}

        {!loading && error && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(239,68,68,0.7)', marginBottom: 4 }}>{error}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>请检查网络连接或更换关键词</div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <ImageIcon size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>搜索图片后可点击添加到上传库</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {results.map((img, i) => (
              <div
                key={i}
                title={img.title}
                onClick={() => handleUse(img)}
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
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
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s', display: 'flex', alignItems: 'flex-end' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.35)'; }}
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
