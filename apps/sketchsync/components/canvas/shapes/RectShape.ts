import { BoundingBox, ResizeHandle, ShapeData, ShapeStyles } from "../types";
import { Shape } from "./shape";

export class RectShape extends Shape{
    x: number
    y: number
    height: number
    width: number

    constructor(id: string, style: ShapeStyles, x: number, y: number, height: number, width: number){
        super(id, style)
        this.x = x
        this.y = y
        this.height = height
        this.width = width
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        this.apply(ctx)
        ctx.beginPath()
        ctx.rect(this.x, this.y, this.width, this.height)
        if(this.style.fillColor !== "transparent"){
            ctx.fill();
        }
        ctx.stroke()
        ctx.restore()
    }

    hitTest(x: number, y: number): boolean {
        const minX = Math.min(this.x , this.x + this.width)
        const maxX = Math.max(this.x , this.x + this.width)
        const minY = Math.min(this.y , this.y + this.height)
        const maxY = Math.max(this.y , this.y+ this.height)     
        
        return x >= minX && x <= maxX && y >= minY && y <= maxY
    }

    translate(dx: number, dy: number): void {
        this.x += dx
        this.y += dy
    }

    resize(handle: ResizeHandle, dx: number, dy: number): void {
        switch(handle){
            case "se": 
                this.width += dx;
                this.height += dy;
                break
            case "sw": 
                this.x += dx;
                this.width -= dx
                this.height += dy
                break
            case "ne":
                this.y += dy 
                this.width += dx
                this.height -= dy
                break
            case "nw": 
                this.x += dx
                this.y += dy
                this.width -= dx
                this.height -= dy
                break
            case "n": 
                this.y += dy
                this.height -= dy
                break
            case "s": 
                this.height += dy
                break
            case "e":
                this.width += dx
                break
            case "w":
                this.x += dx;
                this.width -= dx;
                break;
        }
    }

    getBoundingBox(): BoundingBox {
        return {
            x: Math.min(this.x, this.x + this.width),
            y: Math.min(this.y, this.y + this.height),
            width: Math.abs(this.width),
            height: Math.abs(this.height),
        };
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        const box = this.getBoundingBox()
        const padding = 4

        ctx.save()
        ctx.strokeStyle = "#6965db";
        ctx.lineWidth= 1
        ctx.setLineDash([])
        ctx.strokeRect(
            box.x - padding,
            box.y - padding,
            box.width + padding * 2,
            box.height + padding * 2
        )
        ctx.setLineDash([]);
        ctx.restore()
    }

    serialize(): ShapeData {
        return {
            id: this.id,
            type: "rect",
            style: this.style,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        }
    }
}