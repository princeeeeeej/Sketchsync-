import { BoundingBox, ResizeHandle, ShapeData, ShapeStyles } from "../types"
import { Shape } from "./shape"

export class LineShape extends Shape{
    x1: number
    y1: number
    x2: number
    y2: number

    constructor(id: string, style: ShapeStyles, x1: number, y1: number, x2: number, y2: number){
        super(id, style)
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        this.apply(ctx)
        ctx.beginPath()
        ctx.moveTo(this.x1, this.y1)
        ctx.lineTo(this.x2, this.y2)
        ctx.stroke()
        ctx.restore()
    }

    hitTest(x: number, y: number): boolean {
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return false;
        const dist = Math.abs(dy * x - dx * y + this.x2 * this.y1 - this.y2 * this.x1) / len;

        return dist < 5;
    }

    translate(dx: number, dy: number): void {
        this.x1 += dx
        this.y1 += dy
        this.x2 += dx
        this.y2 += dy
    }

    resize(handle: ResizeHandle, dx: number, dy: number): void {
        if (handle === "nw") {
            this.x1 += dx;
            this.y1 += dy;
        } 
        else if (handle === "se") {
            this.x2 += dx;
            this.y2 += dy;
        }
    }

    getBoundingBox(): BoundingBox {
        return {
            x: Math.min(this.x1, this.x2),
            y: Math.min(this.y1, this.y2),
            width: Math.abs(this.x2 - this.x1),
            height: Math.abs(this.y2 - this.y1),
        }
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        const box = this.getBoundingBox();
        const padding = 4;

        ctx.save();
        ctx.strokeStyle = "#6965db";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(
            box.x - padding,
            box.y - padding,
            box.width + padding * 2,
            box.height + padding * 2
        );
        ctx.restore();
    }

    serialize(): ShapeData {
        return {
            id: this.id,
            type: "line",
            style: this.style,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
        };
  }
}