// Basics

export type PointType = {
  x: number;
  y: number;
};

export type SizeType = {
  width: number;
  height: number;
};

export type RectType = PointType & SizeType;

// Toast

export type ToastType = "info" | "success" | "warning" | "error" | "loading";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  persistent?: boolean;
};


