export type Shapes = Rectangle | Circle | Line | Text  

export type Rectangle = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Circle = {
  type: "circle";
  centerX: number;  
  centerY: number;
  radius: number;
}

export type Line = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type Text = {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize?: number;
}

export type Tool = "pointer" | "rect" | "circle" | "line" | "text" | "pen"