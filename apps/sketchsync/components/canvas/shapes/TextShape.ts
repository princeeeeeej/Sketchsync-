import { BoundingBox, ResizeHandle, ShapeData, ShapeStyles } from "../types";
import { Shape } from "./shape";

export class TextShape extends Shape{
    text: string
    x: number
    y: number
    fontSize: number

    constructor(id: string, style: ShapeStyles, x: number , y: number, text: string, fontSize: number){
        super(id, style)
        this.x = x
        this.y = y
        this.text = text
        this.fontSize = fontSize
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        this.apply(ctx)
        ctx.font = `${this.fontSize}px ${this.style.fontFamily}`
        ctx.fillStyle = this.style.strokeColor

        this.text.split("\n").forEach((line, i) => {
            ctx.fillText(line, this.x, this.y + i * this.fontSize * 1.2)
        })
        ctx.restore()
    }

    hitTest(x: number, y: number): boolean {
        const approxWidth = this.text.length * this.fontSize * 0.6
        const height = this.text.split("\n").length * this.fontSize * 1.2

        return x >= this.x && x <= this.x + approxWidth && y >= this.y - this.fontSize && y <= this.y + height
    }

    translate(dx: number, dy: number): void {
        this.x += dx
        this.y += dy
    }

    resize(handle: ResizeHandle, dx: number, dy: number): void {
        const delta = Math.max(dx, dy)
        this.fontSize = Math.max(8, this.fontSize + delta * 0.5)
    }

    getBoundingBox(): BoundingBox {
        const lines = this.text.split("\n")
        const approxWidth = Math.max(...lines.map(l => l.length)) * this.fontSize * 0.6
        const height = lines.length * this.fontSize * 1.2
        return {
            x: this.x,
            y: this.y - this.fontSize, 
            width: approxWidth,
            height
        }
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        const box = this.getBoundingBox()
        ctx.save()
        ctx.strokeStyle = "#6965db";
        ctx.lineWidth = 1
        ctx.setLineDash([])
        ctx.strokeRect(box.x, box.y, box.width, box.height)
        ctx.restore()
    }

    serialize(): ShapeData {
        return {
            id: this.id,
            style: this.style,
            type: "text",
            text: this.text,
            x: this.x,
            y: this.y,
            fontSize: this.fontSize
        }
    }
}