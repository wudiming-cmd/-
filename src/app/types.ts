import { LucideIcon } from 'lucide-react';

export interface ModulePosition {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface ModuleData {
  id: string;
  icon: LucideIcon | null;
  iconName: string;
  label?: string;
  position: ModulePosition;
  gridX: number;
  gridY: number;
  widthUnits: number;
  heightUnits: number;
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  gradient?: string;
  image?: string;
  customImage?: string;
  customIcon?: string;
  textColor?: string;
  percentage?: number;
  percentageColor?: string;
}
