export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  height: number;
  width: number;
}

export type Tool =
  | "pointer"
  | "pen"
  | "hand"
  | "rect"
  | "circle"
  | "eraser"
  | "line"
  | "text";

export interface ShapeStyles {
  strokeColor: string;
  fillColor: string;
  opacity: number;
  strokeWidth: number;
  strokeSize: "solid" | "dashed" | "dotted";
  fontSize?: number;
  fontFamily?: string;
}

export const DEFAULT_STYLE: ShapeStyles = {
  strokeColor: "#ffffff",
  fillColor: "transparent",
  opacity: 1,
  strokeWidth: 2,
  strokeSize: "solid",
  fontSize: 16,
  fontFamily: "sans-serif",
};

export interface BaseShape {
  id: string;
  style: ShapeStyles;
}

export interface RectData extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface CircleData extends BaseShape {
  type: "circle";
  radius: number;
  centerX: number;
  centerY: number;
}

export interface LineData extends BaseShape {
  type: "line";
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface TextData extends BaseShape {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export interface PenData extends BaseShape {
  type: "pen";
  points: Point[];
}

export type ShapeData = RectData | CircleData | LineData | TextData | PenData;

export type ShapeType = ShapeData["type"];

export interface DrawPayload {
  type: "draw";
  roomId: number;
  elements: ShapeData[];
}

export interface EraseData {
  type: "erase";
  roomId: number;
  ids: string[];
}

export interface SavePayload {
  type: "save";
  roomId: number;
  elements: ShapeData[];
}

export interface CursorPayload {
  type: "cursor";
  roomId: number;
  x: number;
  y: number;
}

export type WSMessage =
  | DrawPayload
  | EraseData
  | SavePayload
  | CursorPayload
  | { type: "join_room"; roomId: number }
  | { type: "leave_room"; roomId: number; elements: ShapeData[] }
  | { type: "snapshot"; roomId: number; data: { elements: ShapeData[] } }
  | { type: "user_joined"; roomId: number; userId: string }
  | { type: "user_left"; roomId: number; userId: string }
  | { type: "request_snapshot"; roomId: number }

export interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
  lastSeen: number;
  color: string;
}

export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "e"
  | "se" | "s" | "sw"
  | "w";
