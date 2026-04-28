import { ShapeFactory } from "./ShapeFactory";
import { CircleShape } from "./shapes/CircleShape";
import { LineShape } from "./shapes/LineShape";
import { PenShape } from "./shapes/PenShape";
import { RectShape } from "./shapes/RectShape";
import { Shape } from "./shapes/shape";
import { TextShape } from "./shapes/TextShape";
import { DEFAULT_STYLE, Point, ShapeData, ShapeStyles, Tool } from "./types";

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shapes: Map<string, Shape>;
  private selectedShape: Shape | null;
  private activeTool: Tool;
  private startX: number = 0;
  private startY: number = 0;
  private panX: number;
  private panY: number;
  private zoom: number;
  private currentStyle: ShapeStyles;

  private isDrawing: boolean;
  private currentShape: Shape | null;
  private currentStroke: Point[];

  private lastRawX: number;
  private lastRawY: number;

  private moveStartX: number;
  private moveStartY: number;
  private originalShapeData: ShapeData | null;

  private erasedIds: Set<string>;

  private onShapeChange: (shapes: ShapeData[]) => void;
  private onErase: (ids: string[]) => void;
  private onCursorMove: (x: number, y: number) => void;
  private onTextRequest: (
    canvasX: number,
    canvasY: number,
    screenX: number,
    screenY: number,
  ) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onShapeChange: (shapes: ShapeData[]) => void,
    onErase: (ids: string[]) => void,
    onCursorMove: (x: number, y: number) => void,
    onTextRequest: (
      canvasX: number,
      canvasY: number,
      screenX: number,
      screenY: number,
    ) => void,
  ) {
    this.canvas = canvas;
    this.currentStyle = DEFAULT_STYLE;
    this.ctx = canvas.getContext("2d")!;
    this.shapes = new Map();
    this.selectedShape = null;
    this.activeTool = "pointer";
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
    this.isDrawing = false;
    this.currentShape = null;
    this.currentStroke = [];
    this.lastRawX = 0;
    this.lastRawY = 0;
    this.moveStartX = 0;
    this.moveStartY = 0;
    this.originalShapeData = null;
    this.erasedIds = new Set();
    this.onShapeChange = onShapeChange;
    this.onErase = onErase;
    this.onCursorMove = onCursorMove;
    this.onTextRequest = onTextRequest;
  }

  toCanvasCoords(screenX: number, screenY: number) {
    return {
      x: (screenX - this.panX) / this.zoom,
      y: (screenY - this.panY) / this.zoom,
    };
  }

  getShape(x: number, y: number): Shape | null {
    const shapesArray = [...this.shapes.values()];
    for (let i = shapesArray.length - 1; i >= 0; i--) {
      if (shapesArray[i].hitTest(x, y)) return shapesArray[i];
    }
    return null;
  }

  setTool(tool: Tool) {
    this.activeTool = tool;
    this.selectedShape = null;
    this.render();
  }

  addShape(shape: Shape) {
    this.shapes.set(shape.id, shape);
  }

  setStyle(style: Partial<ShapeStyles>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgb(18, 18, 18)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    this.shapes.forEach((shape) => shape.draw(this.ctx));

    if (this.selectedShape) {
      this.selectedShape.drawSelection(this.ctx);
    }

    if (this.currentShape) {
      this.currentShape.draw(this.ctx);
    }

    this.ctx.restore();
  }

  onPointerDown(screenX: number, screenY: number) {
    const { x, y } = this.toCanvasCoords(screenX, screenY);

    switch (this.activeTool) {
      case "hand":
        this.lastRawX = screenX;
        this.lastRawY = screenY;
        this.isDrawing = true;
        break;
      case "pointer":
        const shape = this.getShape(x, y);
        this.selectedShape = shape;
        if (shape) {
          this.moveStartX = x;
          this.moveStartY = y;
          this.originalShapeData = shape.serialize();
        }
        this.isDrawing = true;
        this.render();
        break;
      case "eraser":
        this.isDrawing = true;
        this.erasedIds = new Set();
        break;
      case "pen":
        this.isDrawing = true;
        this.currentShape = ShapeFactory.create("pen", x, y, this.currentStyle);
        break;
      case "text":
        const screenXText = x * this.zoom + this.panX;
        const screenYText = y * this.zoom + this.panY;
        this.onTextRequest(x, y, screenXText, screenYText);
        break;
      default:
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
        this.currentShape = ShapeFactory.create(
          this.activeTool,
          x,
          y,
          this.currentStyle,
        );
        break;
    }
  }

  onPointerMove(screenX: number, screenY: number) {
    if (!this.isDrawing) return;
    const { x, y } = this.toCanvasCoords(screenX, screenY);

    switch (this.activeTool) {
      case "hand":
        this.panX += screenX - this.lastRawX;
        this.panY += screenY - this.lastRawY;
        this.lastRawX = screenX;
        this.lastRawY = screenY;
        this.render();
        break;
      case "pointer":
        if (!this.selectedShape || !this.originalShapeData) break;
        const dx = x - this.moveStartX;
        const dy = y - this.moveStartY;
        const fresh = ShapeFactory.deserialize(this.originalShapeData!);
        fresh.translate(dx, dy);
        this.shapes.set(fresh.id, fresh);
        this.selectedShape = fresh;
        this.render();
        break;
      case "pen":
        if (!this.currentShape) break;
        const pen = this.currentShape as PenShape;
        pen.points.push({ x, y });
        this.render();
        break;
      case "eraser":
        const shape = this.getShape(x, y);
        if (shape && !this.erasedIds.has(shape!.id)) {
          this.shapes.delete(shape.id);
          this.erasedIds.add(shape.id);
          this.render();
        }
        break;
      default:
        if (!this.currentShape) break;
        const width = x - this.startX;
        const height = y - this.startY;
        if (this.activeTool === "rect") {
          const rect = this.currentShape as RectShape;
          rect.width = width;
          rect.height = height;
        } else if (this.activeTool === "circle") {
          const circle = this.currentShape as CircleShape;
          circle.radius = Math.sqrt(width * width + height * height) / 2;
          circle.centerX = this.startX + width / 2;
          circle.centerY = this.startY + height / 2;
        } else if (this.activeTool === "line") {
          const line = this.currentShape as LineShape;
          line.x2 = x;
          line.y2 = y;
        }
        this.render();
        break;
    }
  }

  onPointerUp(screenX: number, screenY: number) {
    if (!this.isDrawing) return;
    const { x, y } = this.toCanvasCoords(screenX, screenY);
    switch (this.activeTool) {
      case "hand":
        this.isDrawing = false;
        break;
      case "pointer":
        this.isDrawing = false;
        this.originalShapeData = null;
        if (this.selectedShape) {
          this.onShapeChange(
            [...this.shapes.values()].map((s) => s.serialize()),
          );
        }
        break;
      case "pen":
        if (!this.currentShape) break;
        const pen = this.currentShape as PenShape;
        pen.points.push({ x, y });
        this.shapes.set(this.currentShape.id, this.currentShape);
        this.onShapeChange([...this.shapes.values()].map((s) => s.serialize()));
        this.currentShape = null;
        this.currentStroke = [];
        this.isDrawing = false;
        break;
      case "eraser":
        this.isDrawing = false;
        if (this.erasedIds.size > 0) {
          this.onErase([...this.erasedIds]);
          this.onShapeChange(
            [...this.shapes.values()].map((s) => s.serialize()),
          );
          this.erasedIds = new Set();
        }
        break;
      case "text":
        this.isDrawing = false;
        break;
      default:
        if (!this.currentShape) break;
        const width = x - this.startX;
        const height = y - this.startY;
        if (this.activeTool === "rect") {
          const rect = this.currentShape as RectShape;
          rect.width = width;
          rect.height = height;
        } else if (this.activeTool === "circle") {
          const circle = this.currentShape as CircleShape;
          circle.radius = Math.sqrt(width * width + height * height) / 2;
          circle.centerX = this.startX + width / 2;
          circle.centerY = this.startY + height / 2;
        } else if (this.activeTool === "line") {
          const line = this.currentShape as LineShape;
          line.x2 = x;
          line.y2 = y;
        }
        this.shapes.set(this.currentShape.id, this.currentShape);
        this.onShapeChange([...this.shapes.values()].map((s) => s.serialize()));
        this.currentShape = null;
        this.isDrawing = false;
        this.render();
        break;
    }
  }

  onRemoteDraw(elements: ShapeData[]): void {
    elements.forEach((data) => {
      const shape = ShapeFactory.deserialize(data);
      this.shapes.set(shape.id, shape);
    });
    this.render();
  }

  onRemoteErase(ids: string[]) {
    ids.forEach((id) => this.shapes.delete(id));
    this.render();
  }

  loadShapes(elements: ShapeData[]): void {
    this.shapes.clear();
    elements.forEach((data) => {
      const shape = ShapeFactory.deserialize(data);
      this.shapes.set(shape.id, shape);
    });
    this.render();
  }

  zoomAt(screenX: number, screenY: number, factor: number) {
    this.panX = screenX - (screenX - this.panX) * factor;
    this.panY = screenY - (screenY - this.panY) * factor;
    this.zoom = Math.min(Math.max(this.zoom * factor, 0.05), 20);
    this.render();
  }

  exportPNG(): void {
    const link = document.createElement("a");
    link.download = "sketch.png";
    link.href = this.canvas.toDataURL("image/png");
    link.click();
  }

  commitText(canvasX: number, canvasY: number, text: string): void {
    if (!text.trim()) return;
    const shape = ShapeFactory.create(
      "text",
      canvasX,
      canvasY,
      this.currentStyle,
    ) as TextShape;
    shape.text = text;
    shape.fontSize = this.currentStyle.fontSize ?? 16;
    this.shapes.set(shape.id, shape);
    this.onShapeChange([...this.shapes.values()].map((s) => s.serialize()));
    this.render();
  }
}
