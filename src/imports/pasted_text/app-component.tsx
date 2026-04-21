import { useState, useRef, useEffect } from 'react';
import type { ModuleData } from './types.ts';
import { BackgroundTab } from './components/BackgroundTab.tsx';
import { ModuleTab } from './components/ModuleTab.tsx';
import {
  Plane,
  Music,
  Flashlight,
  AlarmClock,
  Moon,
  Sun,
  Volume2,
  Calculator,
  Camera,
  RotateCw,
  Bell,
  Battery,
  Settings,
} from 'lucide-react';

type ModuleTemplate = Omit<ModuleData, 'id'> & { category: string };

type BackgroundLayer = {
  id: string;
  src: string;
  name: string;
  cutout: boolean;
  opacity: number;
};

export default function App() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('横着');
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [backgroundLayers, setBackgroundLayers] = useState<BackgroundLayer[]>([]);
  const [backgroundBlur, setBackgroundBlur] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<'background' | 'module'>('module');
  const gridCellWidth = 177;
  const gridCellHeight = 177;
  const gridGap = 33;
  const gridOriginLeft = 137;
  const gridOriginTop = 240;
  const gridColumns = 4;
  const gridRows = 6;
  const zoom = 0.45;
  const gridWidth = gridColumns * gridCellWidth + (gridColumns - 1) * gridGap;
  const gridHeight = gridRows * gridCellHeight + (gridRows - 1) * gridGap;

  const getModulePositionFromGrid = (module: ModuleData) => {
    const gridX = Math.min(Math.max(module.gridX, 1), gridColumns);
    const gridY = Math.min(Math.max(module.gridY, 1), gridRows);
    const widthUnits = Math.min(Math.max(module.widthUnits, 1), gridColumns);
    const heightUnits = Math.min(Math.max(module.heightUnits, 1), gridRows);
    const width = widthUnits * gridCellWidth + (widthUnits - 1) * gridGap;
    const height = heightUnits * gridCellHeight + (heightUnits - 1) * gridGap;
    const left = gridOriginLeft + (gridX - 1) * (gridCellWidth + gridGap);
    const top = gridOriginTop + (gridY - 1) * (gridCellHeight + gridGap);
    return { left, top, width, height };
  };

  const doModulesOverlap = (aX: number, aY: number, aW: number, aH: number, bX: number, bY: number, bW: number, bH: number) => {
    const aRight = aX + aW - 1;
    const aBottom = aY + aH - 1;
    const bRight = bX + bW - 1;
    const bBottom = bY + bH - 1;
    return !(aRight < bX || aX > bRight || aBottom < bY || aY > bBottom);
  };

  const isGridPositionAvailable = (
    currentId: string,
    gridX: number,
    gridY: number,
    widthUnits: number,
    heightUnits: number
  ) => {
    return modules.every((module) =>
      module.id === currentId
        ? true
        : !doModulesOverlap(
            gridX,
            gridY,
            widthUnits,
            heightUnits,
            module.gridX,
            module.gridY,
            module.widthUnits,
            module.heightUnits
          )
    );
  };

  const findAvailableGridPosition = (widthUnits: number, heightUnits: number): { gridX: number; gridY: number } | null => {
    for (let y = 1; y <= gridRows - heightUnits + 1; y += 1) {
      for (let x = 1; x <= gridColumns - widthUnits + 1; x += 1) {
        const occupied = modules.some((module) =>
          doModulesOverlap(
            x,
            y,
            widthUnits,
            heightUnits,
            module.gridX,
            module.gridY,
            module.widthUnits,
            module.heightUnits
          )
        );
        if (!occupied) {
          return { gridX: x, gridY: y };
        }
      }
    }
    return null;
  };

  const moduleTemplates: ModuleTemplate[] = [
    {
      icon: Flashlight,
      iconName: 'Flashlight',
      position: { left: 0, top: 0, width: gridCellWidth, height: gridCellHeight, borderRadius: 142 },
      gridX: 1,
      gridY: 1,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#FFFFFF',
      category: '小图标',
    },
    {
      icon: Music,
      iconName: 'Music',
      position: { left: 0, top: 0, width: gridCellWidth * 2 + gridGap, height: gridCellHeight * 2 + gridGap, borderRadius: 91 },
      gridX: 1,
      gridY: 1,
      widthUnits: 2,
      heightUnits: 2,
      backgroundColor: '#4A90E2',
      iconColor: '#FFFFFF',
      label: '音乐',
      category: '大图标',
    },
    {
      icon: Camera,
      iconName: 'Camera',
      position: { left: 0, top: 0, width: gridCellWidth, height: gridCellHeight * 2 + gridGap, borderRadius: 62 },
      gridX: 1,
      gridY: 1,
      widthUnits: 1,
      heightUnits: 2,
      backgroundColor: '#FF6B6B',
      iconColor: '#FFFFFF',
      label: '相机',
      category: '竖着',
    },
    {
      icon: Settings,
      iconName: 'Settings',
      position: { left: 0, top: 0, width: gridCellWidth * 2 + gridGap, height: gridCellHeight, borderRadius: 62 },
      gridX: 1,
      gridY: 1,
      widthUnits: 2,
      heightUnits: 1,
      backgroundColor: '#8E44AD',
      iconColor: '#FFFFFF',
      label: '设置',
      category: '横着',
    },
    {
      icon: Bell,
      iconName: 'Bell',
      position: { left: 0, top: 0, width: gridCellWidth, height: gridCellHeight, borderRadius: 142 },
      gridX: 1,
      gridY: 1,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#F5F5DC',
      iconColor: '#4A5FBE',
      label: '通知',
      category: '小图标',
    },
  ];

const categories = ['横着', '竖着', '大图标', '小图标'];
  const filteredTemplates = moduleTemplates.filter((template) => template.category === selectedCategory);

  const handleModuleDragStart = (event: React.PointerEvent<HTMLDivElement>, moduleId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedModuleId(moduleId);
    setDraggingModuleId(moduleId);
  };

  const handlePointerMove = (event: PointerEvent | React.PointerEvent<HTMLDivElement>) => {
    if (!draggingModuleId || !previewRef.current) {
      return;
    }

    const rect = previewRef.current.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;
    const pointerX = (clientX - rect.left) / zoom;
    const pointerY = (clientY - rect.top) / zoom;
    const rawGridX = Math.round((pointerX - gridOriginLeft) / (gridCellWidth + gridGap)) + 1;
    const rawGridY = Math.round((pointerY - gridOriginTop) / (gridCellHeight + gridGap)) + 1;

    const draggedModule = modules.find((module) => module.id === draggingModuleId);
    if (!draggedModule) {
      return;
    }

    const newGridX = Math.min(
      Math.max(rawGridX, 1),
      gridColumns - draggedModule.widthUnits + 1
    );
    const newGridY = Math.min(
      Math.max(rawGridY, 1),
      gridRows - draggedModule.heightUnits + 1
    );

    if (
      isGridPositionAvailable(
        draggingModuleId,
        newGridX,
        newGridY,
        draggedModule.widthUnits,
        draggedModule.heightUnits
      )
    ) {
      handleModuleUpdate(draggingModuleId, { gridX: newGridX, gridY: newGridY });
    }
  };

  const handlePreviewPointerUp = () => {
    setDraggingModuleId(null);
  };

  useEffect(() => {
    if (!draggingModuleId) {
      return;
    }

    const handleWindowUp = () => {
      setDraggingModuleId(null);
    };

    window.addEventListener('pointerup', handleWindowUp);
    window.addEventListener('pointercancel', handleWindowUp);
    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerup', handleWindowUp);
      window.removeEventListener('pointercancel', handleWindowUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [draggingModuleId, handlePointerMove]);

  const [modules, setModules] = useState<ModuleData[]>([
    // 左上角大块 (2x2)
    {
      id: 'top-left',
      icon: Plane,
      iconName: 'Plane',
      position: { left: 137, top: 240, width: 387, height: 387, borderRadius: 91 },
      gridX: 1,
      gridY: 1,
      widthUnits: 2,
      heightUnits: 2,
      backgroundColor: '#FFFFFF',
      iconColor: '#4A5FBE',
    },

    // 右上角大块 (2x2)
    {
      id: 'top-right',
      icon: Music,
      iconName: 'Music',
      label: 'Kenneth Walker',
      position: { left: 556, top: 240, width: 387, height: 387, borderRadius: 91 },
      gridX: 3,
      gridY: 1,
      widthUnits: 2,
      heightUnits: 2,
      backgroundColor: '#FFD93D',
      iconColor: '#4A5FBE',
    },

    // 手电筒 (圆形)
    {
      id: 'flashlight',
      icon: Flashlight,
      iconName: 'Flashlight',
      position: { left: 137, top: 870, width: 177, height: 177, borderRadius: 142 },
      gridX: 1,
      gridY: 4,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#FFFFFF',
    },

    // 闹钟 (圆形)
    {
      id: 'alarm',
      icon: AlarmClock,
      iconName: 'AlarmClock',
      position: { left: 347, top: 870, width: 177, height: 177, borderRadius: 142 },
      gridX: 2,
      gridY: 4,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#FFFFFF',
    },

    // 亮度 (竖长条)
    {
      id: 'brightness',
      icon: Sun,
      iconName: 'Sun',
      position: { left: 557, top: 870, width: 177, height: 386, borderRadius: 62 },
      gridX: 3,
      gridY: 4,
      widthUnits: 1,
      heightUnits: 2,
      gradient: 'linear-gradient(to bottom, #FFD93D 0%, #F5F5DC 100%)',
      iconColor: '#4A5FBE',
    },

    // 音量 (竖长条)
    {
      id: 'volume',
      icon: Volume2,
      iconName: 'Volume2',
      position: { left: 767, top: 870, width: 177, height: 386, borderRadius: 62 },
      gridX: 4,
      gridY: 4,
      widthUnits: 1,
      heightUnits: 2,
      backgroundColor: '#D3D3D3',
      iconColor: '#FFFFFF',
    },

    // 勿扰模式 (横长条)
    {
      id: 'mode-moon',
      icon: Moon,
      iconName: 'Moon',
      label: 'Kylian Mbappé',
      position: { left: 137, top: 1080, width: 387, height: 177, borderRadius: 62 },
      gridX: 1,
      gridY: 5,
      widthUnits: 2,
      heightUnits: 1,
      backgroundColor: '#F5F5DC',
      borderColor: '#8B8B7A',
      iconColor: '#4A5FBE',
    },

    // 计算器 (圆形)
    {
      id: 'calculator',
      icon: Calculator,
      iconName: 'Calculator',
      position: { left: 347, top: 1290, width: 177, height: 177, borderRadius: 142 },
      gridX: 2,
      gridY: 6,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#FFFFFF',
    },

    // 相机 (圆形)
    {
      id: 'camera',
      icon: Camera,
      iconName: 'Camera',
      position: { left: 557, top: 1290, width: 177, height: 177, borderRadius: 142 },
      gridX: 3,
      gridY: 6,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#FFFFFF',
    },

    // 旋转锁定 (圆形)
    {
      id: 'rotation-lock',
      icon: RotateCw,
      iconName: 'RotateCw',
      position: { left: 557, top: 900, width: 177, height: 177, borderRadius: 142 },
      gridX: 3,
      gridY: 3,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#F5F5DC',
      borderColor: '#8B8B7A',
      iconColor: '#4A5FBE',
    },

    // 铃铛 (圆形)
    {
      id: 'bell',
      icon: Bell,
      iconName: 'Bell',
      position: { left: 767, top: 900, width: 177, height: 177, borderRadius: 142 },
      gridX: 4,
      gridY: 3,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#F5F5DC',
      borderColor: '#8B8B7A',
      iconColor: '#4A5FBE',
    },

    // 电池 (圆形)
    {
      id: 'battery',
      icon: Battery,
      iconName: 'Battery',
      position: { left: 767, top: 1290, width: 177, height: 177, borderRadius: 142 },
      gridX: 4,
      gridY: 6,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#4A5FBE',
    }
  ]);

  const handleModuleUpdate = (moduleId: string, updates: Partial<ModuleData>) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        const updatedGridX = updates.gridX ?? module.gridX;
        const updatedGridY = updates.gridY ?? module.gridY;
        const updatedWidthUnits = updates.widthUnits ?? module.widthUnits;
        const updatedHeightUnits = updates.heightUnits ?? module.heightUnits;

        if (
          !isGridPositionAvailable(
            moduleId,
            updatedGridX,
            updatedGridY,
            updatedWidthUnits,
            updatedHeightUnits
          )
        ) {
          return module;
        }

        return { ...module, ...updates };
      })
    );
  };

  const handleAddModule = () => {
    const id = `module-${Date.now()}`;
    const position = findAvailableGridPosition(1, 1);
    if (!position) {
      return;
    }

    const newModule: ModuleData = {
      id,
      icon: Plane,
      iconName: 'Plane',
      position: { left: gridOriginLeft, top: gridOriginTop, width: gridCellWidth, height: gridCellHeight, borderRadius: 142 },
      gridX: position.gridX,
      gridY: position.gridY,
      widthUnits: 1,
      heightUnits: 1,
      backgroundColor: '#FFD93D',
      iconColor: '#FFFFFF',
    };
    setModules((prev) => [...prev, newModule]);
    setSelectedModuleId(id);
  };

  const addModuleFromTemplate = (template: ModuleTemplate) => {
    const id = `module-${Date.now()}`;
    const position = findAvailableGridPosition(template.widthUnits, template.heightUnits);
    if (!position) {
      return;
    }

    const newModule: ModuleData = {
      ...template,
      id,
      gridX: position.gridX,
      gridY: position.gridY,
      position: {
        left: gridOriginLeft,
        top: gridOriginTop,
        width: template.widthUnits * gridCellWidth + (template.widthUnits - 1) * gridGap,
        height: template.heightUnits * gridCellHeight + (template.heightUnits - 1) * gridGap,
        borderRadius: template.position.borderRadius,
      },
    };
    setModules((prev) => [...prev, newModule]);
    setSelectedModuleId(id);
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId));
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
    }
  };

  const addBackgroundLayer = (src: string, name: string) => {
    const id = `bg-${Date.now()}`;
    setBackgroundLayers((prev) => [...prev, { id, src, name, cutout: false, opacity: 1 }]);
  };

  const handlePresetSelect = (preset: 'cat' | 'mouse') => {
    addBackgroundLayer(`/${preset}.jpg`, preset === 'cat' ? '猫' : '老鼠');
  };

  const updateBackgroundLayer = (layerId: string, updates: Partial<BackgroundLayer>) => {
    setBackgroundLayers((prev) => prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)));
  };

  const removeBackgroundLayer = (layerId: string) => {
    setBackgroundLayers((prev) => prev.filter((layer) => layer.id !== layerId));
  };

  const moveBackgroundLayer = (layerId: string, direction: 'up' | 'down') => {
    setBackgroundLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === layerId);
      if (index === -1) return prev;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  };

  const clearBackgroundLayers = () => {
    setBackgroundLayers([]);
    setBackgroundBlur(0);
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

 return (
  <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#000', color: '#fff' }}>

    {/* 左侧：模块库 */}
    <div style={{ width: '280px', background: '#101010', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 20px 12px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>模块库</div>
        <div style={{ fontSize: '12px', color: '#8f8f8f', marginBottom: '16px' }}>按形状分类筛选，点击即可添加到画布。</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 12px',
                borderRadius: '14px',
                border: selectedCategory === category ? '1px solid #4a90e2' : '1px solid rgba(255,255,255,0.08)',
                background: selectedCategory === category ? '#1c6edf' : '#141414',
                color: selectedCategory === category ? '#fff' : '#b0b0b0',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredTemplates.length === 0 ? (
            <div style={{ color: '#8f8f8f', fontSize: '14px', padding: '14px', background: '#141414', borderRadius: '18px' }}>
              未找到匹配模块，请调整搜索或分类。
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <button
                key={template.iconName}
                onClick={() => addModuleFromTemplate(template)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px',
                  padding: '14px',
                  background: '#141414',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#4A90E2', display: 'grid', placeItems: 'center' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{template.label || template.iconName}</div>
                  <div style={{ fontSize: '12px', color: '#8f8f8f' }}>默认 {template.widthUnits}x{template.heightUnits} 网格</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>

    {/* 中间：手机预览画板 */}
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div
        ref={previewRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePreviewPointerUp}
        style={{
          width: '1080px',
          height: '1920px',
          position: 'relative',
          zoom,
          borderRadius: '120px',
          border: '10px solid #333',
          overflow: 'hidden',
          background: '#111',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {backgroundLayers.map((layer) => (
            <div
              key={layer.id}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${layer.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: layer.opacity,
                filter: `${layer.cutout ? 'contrast(140%) saturate(1.2)' : ''} blur(${backgroundBlur}px)`,
                mixBlendMode: layer.cutout ? 'screen' : 'normal',
                transform: 'scale(1.04)',
              }}
            />
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.18)' }} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: gridOriginLeft,
            top: gridOriginTop,
            width: gridWidth,
            height: gridHeight,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: gridColumns + 1 }).map((_, index) => (
            <div
              key={`v-${index}`}
              style={{
                position: 'absolute',
                top: 0,
                left: index * (gridCellWidth + gridGap),
                width: 1,
                height: gridHeight,
                background: 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
          {Array.from({ length: gridRows + 1 }).map((_, index) => (
            <div
              key={`h-${index}`}
              style={{
                position: 'absolute',
                left: 0,
                top: index * (gridCellHeight + gridGap),
                width: gridWidth,
                height: 1,
                background: 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>

        {modules.map((m) => {
          const IconTag = m.icon;
          const modulePosition = getModulePositionFromGrid(m);
          return (
            <div
              key={m.id}
              onPointerDown={(event) => handleModuleDragStart(event, m.id)}
              onClick={() => setSelectedModuleId(m.id)}
              style={{
                position: 'absolute',
                left: modulePosition.left,
                top: modulePosition.top,
                width: modulePosition.width,
                height: modulePosition.height,
                borderRadius: m.position.borderRadius,
                backgroundColor: m.customImage ? undefined : m.backgroundColor,
                backgroundImage: m.customImage ? `url(${m.customImage})` : m.gradient ? m.gradient : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: selectedModuleId === m.id ? '6px solid #FF69B4' : m.borderColor ? `2px solid ${m.borderColor}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: draggingModuleId === m.id ? 'grabbing' : 'grab',
                boxSizing: 'border-box',
                overflow: 'hidden',
                userSelect: 'none',
              }}
            >
              {m.customIcon ? (
                <img
                  src={m.customIcon}
                  alt={m.iconName}
                  style={{ width: '70%', height: '70%', objectFit: 'contain', borderRadius: '18px' }}
                />
              ) : (
                IconTag && <IconTag size={80} color={m.iconColor} />
              )}
              {m.label && <span style={{ fontSize: '24px', color: m.iconColor, marginTop: '10px' }}>{m.label}</span>}
            </div>
          );
        })}
      </div>
    </div>

    {/* 右侧：编辑面板 */}
    <div style={{ width: '420px', background: '#141414', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>控制中心定制</div>
            <div style={{ fontSize: '12px', color: '#8f8f8f' }}>点击左侧模块进行编辑，可新增、删除模块</div>
          </div>
          <button
            onClick={handleAddModule}
            style={{
              padding: '10px 16px',
              background: '#4a90e2',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            新增模块
          </button>
        </div>
      </div>

      {/* 选项卡 */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setSelectedTab('module')}
          style={{
            flex: 1,
            padding: '14px 0',
            background: selectedTab === 'module' ? '#1d1d1d' : 'transparent',
            color: selectedTab === 'module' ? '#fff' : '#9a9a9a',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          模块设置
        </button>
        <button
          onClick={() => setSelectedTab('background')}
          style={{
            flex: 1,
            padding: '14px 0',
            background: selectedTab === 'background' ? '#1d1d1d' : 'transparent',
            color: selectedTab === 'background' ? '#fff' : '#9a9a9a',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          背景设置
        </button>
      </div>

      {/* 选项卡内容 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {selectedTab === 'background' && (
          <BackgroundTab
            backgroundLayers={backgroundLayers}
            backgroundBlur={backgroundBlur}
            onAddBackground={addBackgroundLayer}
            onPresetSelect={handlePresetSelect}
            onRemoveLayer={removeBackgroundLayer}
            onUpdateLayer={updateBackgroundLayer}
            onMoveLayer={moveBackgroundLayer}
            onClearLayers={clearBackgroundLayers}
            onBlurChange={setBackgroundBlur}
          />
        )}
        {selectedTab === 'module' && (
          <ModuleTab
            selectedModule={selectedModule}
            onModuleUpdate={handleModuleUpdate}
            onDeselect={() => setSelectedModuleId(null)}
            onDeleteModule={handleDeleteModule}
          />
        )}
      </div>
    </div>
  </div>
);}