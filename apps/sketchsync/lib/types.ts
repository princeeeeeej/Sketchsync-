export type Shapes = Rectangle | Circle | Line | Text  | Pen

type BaseShape = {
  id: string  
}

export type Rectangle = BaseShape & {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Circle = BaseShape & {
  type: "circle";
  centerX: number;  
  centerY: number;
  radius: number;
}

export type Line = BaseShape & {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type Text = BaseShape & {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize?: number;
}

export type Pen = BaseShape & {
  type: "pen",
  points: {x: number , y: number}[]
}

export type Tool = "pointer" | "rect" | "circle" | "line" | "text" | "pen" | "eraser"