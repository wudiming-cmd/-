import type { LucideIcon } from 'lucide-react';

export interface ModuleData {
  id: string;
  icon: LucideIcon | null;
  iconName: string;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
    borderRadius: number;
  };
  gridX: number;
  gridY: number;
  widthUnits: number;
  heightUnits: number;
  backgroundColor?: string;
  gradient?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  borderColor?: string;
  label?: string;
  customIcon?: string;
  customImage?: string;
  overlayImage?: string;
  percentage?: number;
  percentageColor?: string;
}
