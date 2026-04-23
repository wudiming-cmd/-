import { Trash2, Upload, Image as ImageIcon, Sparkles, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ModuleData } from '../types';
import { IconSelector } from './IconSelector';
import { removeBackground } from '../utils/removeBg';
import { analyzeImageWithAI } from '../utils/aiAnalyze';
import { generateImage, fetchAsDataUrl } from '../utils/jimengService';

interface ModuleTabProps {
  selectedModule: ModuleData | undefined;
  selectedModules?: ModuleData[];
  onModuleUpdate: (moduleId: string, updates: Partial<ModuleData>) => void;
  onBatchModuleUpdate?: (moduleIds: string[], updates: Partial<ModuleData>) => void;
  onDeselect: () => void;
  onDeleteModule: (moduleId: string) => void;
  onBatchGenerate?: (prompt: string) => void;
  batchPrompt?: string;
  setBatchPrompt?: (prompt: string) => void;
  isBatchGenerating?: boolean;
}

const extractColorsFromGradient = (gradient: string | undefined): { start: string; end: string } => {
  if (!gradient) return { start: '#667eea', end: '#764ba2' };
  const colorMatches = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (colorMatches && colorMatches.length >= 2) {
    return { start: colorMatches[0], end: colorMatches[1] };
  }
  return { start: '#667eea', end: '#764ba2' };
};

export function ModuleTab({
  selectedModule,
  selectedModules = [],
  onModuleUpdate,
  onBatchModuleUpdate,
  onDeselect,
  onDeleteModule,
  onBatchGenerate,
  batchPrompt,
  setBatchPrompt,
  isBatchGenerating,
}: ModuleTabProps) {
  const [gradientColors, setGradientColors] = useState<{ start: string; end: string }>({
    start: '#667eea',
    end: '#764ba2'
  });

  useEffect(() => {
    if (selectedModule?.gradient) {
      setGradientColors(extractColorsFromGradient(selectedModule.gradient));
    }
  }, [selectedModule?.id]);

  // 多选模式
  const isBatchMode = selectedModules.length > 0;

  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  
  // 文生图相关状态
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [textGenStatus, setTextGenStatus] = useState('');

  // AI智能填充 - 即梦快速生成
  const [jimengPrompt, setJimengPrompt] = useState('');
  const [isJimengGenerating, setIsJimengGenerating] = useState(false);
  const [jimengStatus, setJimengStatus] = useState('');

  // 文生图 — 即梦 AI
  const handleTextToImage = async () => {
    if (!selectedModule || !textPrompt.trim()) return;
    setIsGeneratingImage(true);
    setTextGenStatus('');
    try {
      const result = await generateImage(
        { prompt: textPrompt.trim(), ratio: '1:1', style: 'general' },
        (msg) => setTextGenStatus(msg)
      );
      const dataUrl = await fetchAsDataUrl(result.imageUrls[0]).catch(() => result.imageUrls[0]);
      onModuleUpdate(selectedModule.id, { customIcon: dataUrl });
      setTextPrompt('');
      setTextGenStatus('✅ 已填充到模块');
      setTimeout(() => setTextGenStatus(''), 2500);
    } catch (err: any) {
      setTextGenStatus(`❌ ${err.message || '生成失败'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // AI智能填充 — 即梦快速生成
  const handleJimengFill = async () => {
    if (!selectedModule || !jimengPrompt.trim()) return;
    setIsJimengGenerating(true);
    setJimengStatus('');
    try {
      const result = await generateImage(
        { prompt: jimengPrompt.trim(), ratio: '1:1', style: 'general' },
        (msg) => setJimengStatus(msg)
      );
      const dataUrl = await fetchAsDataUrl(result.imageUrls[0]).catch(() => result.imageUrls[0]);
      onModuleUpdate(selectedModule.id, { customIcon: dataUrl });
      setJimengPrompt('');
      setJimengStatus('✅ 已填充到模块');
      setTimeout(() => setJimengStatus(''), 2500);
    } catch (err: any) {
      setJimengStatus(`❌ ${err.message || '生成失败'}`);
    } finally {
      setIsJimengGenerating(false);
    }
  };

  const handleAIFillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedModule) return;
    const file = e.target.files?.[0];
    if (file) {
      setIsAIAnalyzing(true);
      try {
        // 读取图片为data URL
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const dataURL = event.target.result as string;

            try {
              // 使用AI分析图片
              const analysis = await analyzeImageWithAI(dataURL);

              // 应用AI分析结果
              const updates: Partial<ModuleData> = {
                customImage: dataURL,
                label: analysis.label,
                iconColor: analysis.iconColor,
              };

              if (analysis.gradient && analysis.gradient !== 'null') {
                updates.gradient = analysis.gradient;
                updates.backgroundColor = undefined;
              } else {
                updates.backgroundColor = analysis.backgroundColor;
                updates.gradient = undefined;
              }

              onModuleUpdate(selectedModule.id, updates);

              // 显示分析结果
              alert(`✨ AI分析完成！\n\n📝 ${analysis.description}\n\n🎨 已自动填充：\n- 背景: ${analysis.gradient || analysis.backgroundColor}\n- 图标颜色: ${analysis.iconColor}\n- 标签: ${analysis.label}`);
            } catch (error) {
              console.error('AI分析失败:', error);
              const errorMsg = error instanceof Error ? error.message : '未知错误';

              // 提供更友好的错误提示
              alert(`⚠️ AI分析遇到问题\n\n错误详情: ${errorMsg}\n\n💡 建议：\n1. 检查网络连接\n2. 确认API密钥有效\n3. 查看控制台了解详细错误\n\n图片已上传，您可以手动配色。`);

              // 即使AI失败，也上传图片并设置默认配色
              onModuleUpdate(selectedModule.id, {
                customImage: dataURL,
                backgroundColor: '#667eea',
                iconColor: '#FFFFFF',
                label: '图片'
              });
            }

            setIsAIAnalyzing(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to read file:', error);
        setIsAIAnalyzing(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedModule) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onModuleUpdate(selectedModule.id, { customImage: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedModule) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onModuleUpdate(selectedModule.id, { customIcon: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackgroundFromImage = async () => {
    if (!selectedModule?.customImage) return;
    setIsRemovingBg(true);
    try {
      const response = await fetch(selectedModule.customImage);
      const blob = await response.blob();
      const resultBlob = await removeBackground(blob);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onModuleUpdate(selectedModule.id, { customImage: event.target.result as string });
        }
        setIsRemovingBg(false);
      };
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error('Failed to remove background:', error);
      alert(`抠图失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsRemovingBg(false);
    }
  };

  // 批量编辑模式
  if (isBatchMode && onBatchModuleUpdate) {
    const moduleIds = selectedModules.map(m => m.id);
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 批量编辑头部 */}
        <div
          style={{
            padding: '16px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                批量编辑 ({selectedModules.length} 个模块)
              </div>
              <div style={{ fontSize: '12px', color: '#8f8f8f' }}>
                按住 Ctrl/Cmd 点击模块进行多选
              </div>
            </div>
            <button
              onClick={onDeselect}
              style={{
                padding: '8px 16px',
                background: '#4a90e2',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              完成
            </button>
          </div>
        </div>

        {/* 批量修改背景颜色 */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            批量修改背景颜色
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="color"
              onChange={(e) =>
                onBatchModuleUpdate(moduleIds, {
                  backgroundColor: e.target.value,
                  gradient: undefined,
                })
              }
              style={{
                width: '50px',
                height: '50px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            />
            <input
              type="text"
              onChange={(e) =>
                onBatchModuleUpdate(moduleIds, {
                  backgroundColor: e.target.value,
                  gradient: undefined,
                })
              }
              placeholder="#FFD93D"
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* 批量修改图标颜色 */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            批量修改图标颜色
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="color"
              onChange={(e) => onBatchModuleUpdate(moduleIds, { iconColor: e.target.value })}
              style={{
                width: '50px',
                height: '50px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            />
            <input
              type="text"
              onChange={(e) => onBatchModuleUpdate(moduleIds, { iconColor: e.target.value })}
              placeholder="#FFFFFF"
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* 批量应用渐变预设 */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            批量应用渐变
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { name: '紫蓝', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { name: '黄米', value: 'linear-gradient(to bottom, #FFD93D 0%, #F5F5DC 100%)' },
              { name: '粉红', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
              { name: '蓝青', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  onBatchModuleUpdate(moduleIds, {
                    gradient: preset.value,
                    backgroundColor: undefined,
                  })
                }
                style={{
                  height: '50px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  background: preset.value,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 批量生成图标 */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={16} color="#667eea" />
            文生图 - 智能生成图标
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={batchPrompt || ''}
              onChange={(e) => setBatchPrompt?.(e.target.value)}
              placeholder="输入图标描述"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onBatchGenerate?.(batchPrompt || '')}
                disabled={isBatchGenerating}
                style={{
                  padding: '8px 16px',
                  background: isBatchGenerating ? '#555' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: isBatchGenerating ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: isBatchGenerating ? 0.6 : 1,
                }}
              >
                {isBatchGenerating ? '生成中...' : '生成图标'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedModule) {
    return (
      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          color: '#8f8f8f',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          未选择模块
        </div>
        <div style={{ fontSize: '13px' }}>点击画布中的任意模块开始编辑</div>
        <div style={{ fontSize: '13px', marginTop: '8px', color: '#667eea' }}>
          按住 Ctrl/Cmd 点击可多选模块
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* AI智能填充 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#667eea" />
          AI智能填充
        </div>

        {/* 上传图片分析 */}
        <input type="file" accept="image/*" onChange={handleAIFillUpload} style={{ display: 'none' }} id="ai-fill-upload" disabled={isAIAnalyzing} />
        <label
          htmlFor="ai-fill-upload"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '16px', border: '2px dashed rgba(102,126,234,0.3)', borderRadius: '12px',
            cursor: isAIAnalyzing ? 'not-allowed' : 'pointer',
            background: isAIAnalyzing ? '#0f0f0f' : 'linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.08))',
            transition: 'all 0.2s', opacity: isAIAnalyzing ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!isAIAnalyzing) { e.currentTarget.style.borderColor = 'rgba(102,126,234,0.6)'; } }}
          onMouseLeave={(e) => { if (!isAIAnalyzing) { e.currentTarget.style.borderColor = 'rgba(102,126,234,0.3)'; } }}
        >
          <Sparkles size={24} color={isAIAnalyzing ? '#8f8f8f' : '#667eea'} />
          <div style={{ marginTop: '8px', fontSize: '13px', color: isAIAnalyzing ? '#8f8f8f' : '#667eea', fontWeight: 600 }}>
            {isAIAnalyzing ? 'AI分析中…' : '上传图片，AI自动配色'}
          </div>
          <div style={{ marginTop: '3px', fontSize: '11px', color: '#666', textAlign: 'center' }}>
            分析风格并自动填充背景、图标颜色
          </div>
        </label>

        {/* 分隔线 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>或用即梦 AI 生成</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* 即梦快速生成 */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={jimengPrompt}
            onChange={(e) => setJimengPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJimengFill(); }}
            placeholder="描述图标内容，即梦AI生成…"
            disabled={isJimengGenerating}
            style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none' }}
          />
          <button
            onClick={handleJimengFill}
            disabled={isJimengGenerating || !jimengPrompt.trim()}
            style={{ padding: '8px 12px', borderRadius: 8, background: isJimengGenerating ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg,#667eea,#a855f7)', border: 'none', color: '#fff', cursor: isJimengGenerating || !jimengPrompt.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
          >
            {isJimengGenerating ? '…' : '生成'}
          </button>
        </div>
        {jimengStatus ? (
          <div style={{ marginTop: 6, fontSize: 11, color: jimengStatus.startsWith('✅') ? '#34d399' : jimengStatus.startsWith('❌') ? '#f87171' : '#a5b4fc', padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}>
            {jimengStatus}
          </div>
        ) : null}
      </div>

      {/* 文生图 — 即梦 AI */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wand2 size={16} color="#a855f7" />
          文生图 · 即梦 AI 生成图标
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextToImage(); }}
            placeholder="描述图标内容，如：金色月亮图标"
            disabled={isGeneratingImage}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
          <button
            onClick={handleTextToImage}
            disabled={isGeneratingImage || !textPrompt.trim()}
            style={{ padding: '10px', background: isGeneratingImage || !textPrompt.trim() ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg,#667eea,#a855f7)', border: 'none', borderRadius: '10px', color: '#fff', cursor: isGeneratingImage || !textPrompt.trim() ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {isGeneratingImage ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                {textGenStatus || '生成中…'}
              </span>
            ) : (
              <span>✨ 生成图标</span>
            )}
          </button>
          {textGenStatus && !isGeneratingImage ? (
            <div style={{ fontSize: 11, color: textGenStatus.startsWith('✅') ? '#34d399' : '#f87171', padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}>
              {textGenStatus}
            </div>
          ) : null}
        </div>
      </div>

      {/* 模块信息头部 */}
      <div
        style={{
          padding: '16px',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              {selectedModule.label || selectedModule.iconName}
            </div>
            <div style={{ fontSize: '12px', color: '#8f8f8f' }}>
              位置: ({selectedModule.gridX}, {selectedModule.gridY}) · 大小: {selectedModule.widthUnits}x
              {selectedModule.heightUnits}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (confirm('确定删除此模块吗？')) {
                  onDeleteModule(selectedModule.id);
                }
              }}
              style={{
                padding: '8px',
                background: '#dc3545',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={18} color="#fff" />
            </button>
            <button
              onClick={onDeselect}
              style={{
                padding: '8px 16px',
                background: '#4a90e2',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              完成
            </button>
          </div>
        </div>
      </div>

      {/* 标签文字 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          标签文字
        </div>
        <input
          type="text"
          value={selectedModule.label || ''}
          onChange={(e) => onModuleUpdate(selectedModule.id, { label: e.target.value })}
          placeholder="输入标签文字（可选）"
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* 图标选择 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          选择图标
        </div>
        <IconSelector
          currentIcon={selectedModule.iconName}
          onSelect={(iconName, IconComponent, customIconUrl) => {
            onModuleUpdate(selectedModule.id, {
              iconName,
              icon: IconComponent,
              customIcon: customIconUrl,
            });
          }}
        />
      </div>

      {/* 上传自定义图标 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          自定义图标
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleIconUpload}
          style={{ display: 'none' }}
          id="icon-upload"
        />
        <label
          htmlFor="icon-upload"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            background: '#1a1a1a',
            gap: '8px',
          }}
        >
          <ImageIcon size={18} color="#8f8f8f" />
          <span style={{ fontSize: '13px', color: '#8f8f8f' }}>上传图标图片</span>
        </label>
        {selectedModule.customIcon && (
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <img
              src={selectedModule.customIcon}
              alt="Custom icon"
              style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px' }}
            />
            <button
              onClick={() => onModuleUpdate(selectedModule.id, { customIcon: undefined })}
              style={{
                marginTop: '6px',
                padding: '4px 12px',
                background: '#dc3545',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              移除
            </button>
          </div>
        )}
      </div>

      {/* 背景颜色 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          背景颜色
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="color"
            value={selectedModule.backgroundColor || '#000000'}
            onChange={(e) =>
              onModuleUpdate(selectedModule.id, {
                backgroundColor: e.target.value,
                gradient: undefined,
              })
            }
            style={{
              width: '50px',
              height: '50px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={selectedModule.backgroundColor || ''}
            onChange={(e) =>
              onModuleUpdate(selectedModule.id, {
                backgroundColor: e.target.value,
                gradient: undefined,
              })
            }
            placeholder="#FFD93D"
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 图标颜色 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          图标颜色
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="color"
            value={selectedModule.iconColor || '#FFFFFF'}
            onChange={(e) => onModuleUpdate(selectedModule.id, { iconColor: e.target.value })}
            style={{
              width: '50px',
              height: '50px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={selectedModule.iconColor || ''}
            onChange={(e) => onModuleUpdate(selectedModule.id, { iconColor: e.target.value })}
            placeholder="#FFFFFF"
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          图标背景颜色
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="color"
            value={selectedModule.iconBackgroundColor || '#000000'}
            onChange={(e) => onModuleUpdate(selectedModule.id, { iconBackgroundColor: e.target.value })}
            style={{
              width: '50px',
              height: '50px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={selectedModule.iconBackgroundColor || ''}
            onChange={(e) => onModuleUpdate(selectedModule.id, { iconBackgroundColor: e.target.value })}
            placeholder="#000000"
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 渐变效果 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          自定义渐变
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#8f8f8f', marginBottom: '6px' }}>起始颜色</div>
            <input
              type="color"
              value={gradientColors.start}
              onChange={(e) => {
                const newStart = e.target.value;
                setGradientColors({ ...gradientColors, start: newStart });
                onModuleUpdate(selectedModule.id, {
                  gradient: `linear-gradient(135deg, ${newStart} 0%, ${gradientColors.end} 100%)`,
                  backgroundColor: undefined,
                });
              }}
              style={{
                width: '100%',
                height: '50px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#8f8f8f', marginBottom: '6px' }}>结束颜色</div>
            <input
              type="color"
              value={gradientColors.end}
              onChange={(e) => {
                const newEnd = e.target.value;
                setGradientColors({ ...gradientColors, end: newEnd });
                onModuleUpdate(selectedModule.id, {
                  gradient: `linear-gradient(135deg, ${gradientColors.start} 0%, ${newEnd} 100%)`,
                  backgroundColor: undefined,
                });
              }}
              style={{
                width: '100%',
                height: '50px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          渐变预设
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { name: '紫蓝', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { name: '黄米', value: 'linear-gradient(to bottom, #FFD93D 0%, #F5F5DC 100%)' },
            { name: '粉红', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { name: '蓝青', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                const colors = extractColorsFromGradient(preset.value);
                setGradientColors(colors);
                onModuleUpdate(selectedModule.id, {
                  gradient: preset.value,
                  backgroundColor: undefined,
                });
              }}
              style={{
                height: '50px',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.1)',
                background: preset.value,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
        {selectedModule.gradient && (
          <button
            onClick={() =>
              onModuleUpdate(selectedModule.id, {
                gradient: undefined,
              })
            }
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '8px',
              background: '#dc3545',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            清除渐变
          </button>
        )}
      </div>

      {/* 上传背景图片 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          模块背景图
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          id="module-image-upload"
        />
        <label
          htmlFor="module-image-upload"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            background: '#1a1a1a',
          }}
        >
          <Upload size={24} color="#8f8f8f" />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#8f8f8f' }}>
            上传背景图片
          </div>
        </label>
        {selectedModule.customImage && (
          <div style={{ marginTop: '12px' }}>
            <img
              src={selectedModule.customImage}
              alt="Module background"
              style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '10px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={handleRemoveBackgroundFromImage}
                disabled={isRemovingBg}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: isRemovingBg ? '#555' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: isRemovingBg ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  opacity: isRemovingBg ? 0.6 : 1,
                }}
              >
                {isRemovingBg ? '处理中...' : 'AI抠图'}
              </button>
              <button
                onClick={() => onModuleUpdate(selectedModule.id, { customImage: undefined })}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#dc3545',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                移除背景图
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 圆角大小 */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
          圆角大小: {selectedModule.position.borderRadius}px
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={selectedModule.position.borderRadius}
          onChange={(e) =>
            onModuleUpdate(selectedModule.id, {
              position: {
                ...selectedModule.position,
                borderRadius: Number(e.target.value),
              },
            })
          }
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: '#333',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
          {[
            { name: '直角', value: 0 },
            { name: '小圆角', value: 62 },
            { name: '圆形', value: 142 },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onModuleUpdate(selectedModule.id, {
                  position: {
                    ...selectedModule.position,
                    borderRadius: preset.value,
                  },
                })
              }
              style={{
                padding: '8px',
                background: selectedModule.position.borderRadius === preset.value ? '#4a90e2' : '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 百分比填充条 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
            百分比填充条
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedModule.percentage !== undefined}
              onChange={(e) => {
                if (e.target.checked) {
                  onModuleUpdate(selectedModule.id, {
                    percentage: 50,
                    percentageColor: 'rgba(255, 255, 255, 0.3)'
                  });
                } else {
                  onModuleUpdate(selectedModule.id, {
                    percentage: undefined,
                    percentageColor: undefined
                  });
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#8f8f8f' }}>启用</span>
          </label>
        </div>
        {selectedModule.percentage !== undefined && (
          <>
            <div style={{ fontSize: '12px', color: '#8f8f8f', marginBottom: '6px' }}>
              填充百分比: {selectedModule.percentage}%
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedModule.percentage}
              onChange={(e) =>
                onModuleUpdate(selectedModule.id, {
                  percentage: Number(e.target.value),
                })
              }
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#333',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#8f8f8f', marginBottom: '6px' }}>填充颜色</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={selectedModule.percentageColor || '#ffffff'}
                  onChange={(e) =>
                    onModuleUpdate(selectedModule.id, {
                      percentageColor: e.target.value,
                    })
                  }
                  style={{
                    width: '50px',
                    height: '50px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={selectedModule.percentageColor || ''}
                  onChange={(e) =>
                    onModuleUpdate(selectedModule.id, {
                      percentageColor: e.target.value,
                    })
                  }
                  placeholder="rgba(255, 255, 255, 0.3)"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}