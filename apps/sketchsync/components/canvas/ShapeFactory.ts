import { CircleShape } from "./shapes/CircleShape";
import { LineShape } from "./shapes/LineShape";
import { PenShape } from "./shapes/PenShape";
import { RectShape } from "./shapes/RectShape";
import { Shape } from "./shapes/shape";
import { TextShape } from "./shapes/TextShape";
import { DEFAULT_STYLE, ShapeData, ShapeStyles, Tool } from "./types";

export class ShapeFactory{
    static create(tool: Tool, x:number, y: number, style: ShapeStyles = DEFAULT_STYLE): Shape{
        const id = crypto.randomUUID()

        switch(tool){
            case "rect":
                return new RectShape(id, style, x, y, 0, 0)
            case "circle":
                return new CircleShape(id, style, x, y, 0)
            case "line":
                return new LineShape(id, style, x, y, 0, 0)
            case "text":
                return new TextShape(id, style, x, y, "", style.fontSize ?? 16)
            case "pen":
                return new PenShape(id, style, [{x, y}])  
            default:
                throw new Error(`ShapeFactory.create: unknown tool "${tool}"`);
            }
    }

    static deserialize(data: ShapeData): Shape{
        const style = data.style ?? DEFAULT_STYLE;

        switch(data.type){
            case "rect":
                return new RectShape(data.id, style, data.x, data.y, data.width, data.height)
            case "circle":
                return new CircleShape(data.id, style, data.centerX, data.centerY, data.radius)
            case "line":
                return new LineShape(data.id, style, data.x1, data.y1, data.x2, data.y2)
            case "pen":
                return new PenShape(data.id, style, data.points)
            case "text":
                return new TextShape(data.id, style, data.x, data.y, data.text, data.fontSize)
            default:
                throw new Error(`ShapeFactory.deserialize: unknown type`)
        }
    }
}