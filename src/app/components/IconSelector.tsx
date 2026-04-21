import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Plane,
  Wifi,
  Bluetooth,
  Radio,
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
  Lock,
  Star,
  Search,
  Home,
  Settings,
  Heart,
  Zap,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Video,
  Image,
  Folder,
  File,
  Download,
  Upload,
  Share2,
  Edit,
  Trash2,
  Check,
  X,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

interface IconSelectorProps {
  currentIcon: string;
  onSelect: (iconName: string, IconComponent: LucideIcon | null, customIconUrl?: string) => void;
}

type IconItem =
  | { name: string; type: 'lucide'; Icon: LucideIcon }
  | { name: string; type: 'local'; url: string; source: 'assets' | 'upload' };

const iconList: IconItem[] = [
  { name: 'Plane', type: 'lucide', Icon: Plane },
  { name: 'Wifi', type: 'lucide', Icon: Wifi },
  { name: 'Bluetooth', type: 'lucide', Icon: Bluetooth },
  { name: 'Radio', type: 'lucide', Icon: Radio },
  { name: 'Music', type: 'lucide', Icon: Music },
  { name: 'Flashlight', type: 'lucide', Icon: Flashlight },
  { name: 'AlarmClock', type: 'lucide', Icon: AlarmClock },
  { name: 'Moon', type: 'lucide', Icon: Moon },
  { name: 'Sun', type: 'lucide', Icon: Sun },
  { name: 'Volume2', type: 'lucide', Icon: Volume2 },
  { name: 'Calculator', type: 'lucide', Icon: Calculator },
  { name: 'Camera', type: 'lucide', Icon: Camera },
  { name: 'RotateCw', type: 'lucide', Icon: RotateCw },
  { name: 'Bell', type: 'lucide', Icon: Bell },
  { name: 'Battery', type: 'lucide', Icon: Battery },
  { name: 'Lock', type: 'lucide', Icon: Lock },
  { name: 'Star', type: 'lucide', Icon: Star },
  { name: 'Search', type: 'lucide', Icon: Search },
  { name: 'Home', type: 'lucide', Icon: Home },
  { name: 'Settings', type: 'lucide', Icon: Settings },
  { name: 'Heart', type: 'lucide', Icon: Heart },
  { name: 'Zap', type: 'lucide', Icon: Zap },
  { name: 'Clock', type: 'lucide', Icon: Clock },
  { name: 'MapPin', type: 'lucide', Icon: MapPin },
  { name: 'Phone', type: 'lucide', Icon: Phone },
  { name: 'Mail', type: 'lucide', Icon: Mail },
  { name: 'MessageCircle', type: 'lucide', Icon: MessageCircle },
  { name: 'Video', type: 'lucide', Icon: Video },
  { name: 'Image', type: 'lucide', Icon: Image },
  { name: 'Folder', type: 'lucide', Icon: Folder },
  { name: 'File', type: 'lucide', Icon: File },
  { name: 'Download', type: 'lucide', Icon: Download },
  { name: 'Upload', type: 'lucide', Icon: Upload },
  { name: 'Share2', type: 'lucide', Icon: Share2 },
  { name: 'Edit', type: 'lucide', Icon: Edit },
  { name: 'Trash2', type: 'lucide', Icon: Trash2 },
  { name: 'Check', type: 'lucide', Icon: Check },
  { name: 'X', type: 'lucide', Icon: X },
  { name: 'Plus', type: 'lucide', Icon: Plus },
  { name: 'Minus', type: 'lucide', Icon: Minus },
  { name: 'ChevronLeft', type: 'lucide', Icon: ChevronLeft },
  { name: 'ChevronRight', type: 'lucide', Icon: ChevronRight },
];

const localIconFiles = (import.meta as any).glob('../../assets/icons/*.{svg,png}', { eager: true, query: '?url' }) as Record<string, string | { default: string }>;
const normalizeIconUrl = (url: string | { default: string }): string => {
  if (typeof url === 'string') return url;
  return typeof url?.default === 'string' ? url.default : '';
};
const localIconList: IconItem[] = Object.entries(localIconFiles)
  .map(([path, url]) => {
    const fileName = path.split('/').pop() || path;
    const name = fileName.replace(/\.(svg|png)$/i, '');
    return { name, type: 'local', url: normalizeIconUrl(url), source: 'assets' };
  })
  .filter((item) => item.url);

export function IconSelector({ currentIcon, onSelect }: IconSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customIcons, setCustomIcons] = useState<IconItem[]>([]);

  const groupedIcons = [
    { label: '系统图标', icons: iconList },
    { label: '本地图标', icons: localIconList },
    ...(customIcons.length > 0 ? [{ label: '上传图标', icons: customIcons }] : []),
  ];

  const allIcons = [...iconList, ...localIconList, ...customIcons];
  const currentIconData = allIcons.find(({ name }) => name === currentIcon);

  const handleUploadLocalIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const name = file.name.replace(/\.(svg|png)$/i, '');
        setCustomIcons((prev) => [
          ...prev,
          { name, type: 'local', url: result, source: 'upload' },
        ]);
        onSelect(name, null, result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 折叠头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {currentIconData ? (
            <>
              <div className="w-10 h-10 rounded-lg bg-black border border-gray-800 flex items-center justify-center">
                {currentIconData.type === 'lucide' ? (
                  <currentIconData.Icon className="w-5 h-5 text-white" />
                ) : (
                  <img src={currentIconData.url} alt={currentIconData.name} className="w-5 h-5 object-contain" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {currentIconData.name}
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-black border border-gray-800 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">未选择图标</span>
            </>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* 可折叠内容 */}
      {isExpanded && (
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="text-sm font-medium text-gray-700">可选图标</div>
            <label className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
              上传本地图标
              <input
                type="file"
                accept="image/svg+xml,image/png"
                className="hidden"
                onChange={handleUploadLocalIcon}
              />
            </label>
          </div>

          <button
            onClick={() => onSelect('', null)}
            className={`mb-4 w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:scale-105 ${
              !currentIcon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-black'
            }`}
            title="无图标"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {groupedIcons.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{group.label}</span>
                <span className="text-xs text-gray-500">{group.icons.length} 个</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {group.icons.map((item) => (
                  <div key={`${item.type}-${item.name}`} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => {
                        if (item.type === 'lucide') {
                          onSelect(item.name, item.Icon);
                        } else {
                          onSelect(item.name, null, item.url);
                        }
                      }}
                      className={`aspect-square w-full flex items-center justify-center rounded-lg border-2 transition-all hover:scale-105 ${
                        currentIcon === item.name ? 'border-blue-500 bg-black' : 'border-gray-300 bg-black'
                      }`}
                      title={item.name}
                    >
                      {item.type === 'lucide' ? (
                        <item.Icon className="w-5 h-5 text-white" />
                      ) : (
                        <img src={item.url} alt={item.name} className="w-6 h-6 object-contain" />
                      )}
                    </button>
                    <div className="max-w-full text-[10px] text-gray-500 text-center truncate px-1">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
