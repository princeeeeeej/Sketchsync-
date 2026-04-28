import { BoundingBox, ResizeHandle, ShapeData, ShapeStyles } from "../types"
import { Shape } from "./shape"

export class CircleShape extends Shape{
    radius : number
    centerX : number
    centerY: number

    constructor(id: string, style: ShapeStyles, centerX: number, centerY: number, radius: number){
        super(id, style)
        this.radius = radius
        this.centerX = centerX
        this.centerY = centerY
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        this.apply(ctx)
        ctx.beginPath()
        ctx.arc(this.centerX, this.centerY, Math.abs(this.radius), 0, 2 * Math.PI)
        ctx.stroke();
        if (this.style.fillColor !== "transparent") {
        ctx.fill();
        }
        ctx.restore();
    }

    hitTest(x: number, y: number): boolean {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= Math.abs(this.radius);
    }

    translate(dx: number, dy: number): void {
        this.centerX += dx;
        this.centerY += dy; 
    }

    resize(handle: ResizeHandle, dx: number, dy: number): void {
    let handleX = this.centerX;
    let handleY = this.centerY;
    switch (handle) {
        case "e":
        handleX += this.radius + dx;
        break;
        case "w":
        handleX -= this.radius - dx;
        break;
        case "s":
        handleY += this.radius + dy;
        break;
        case "n":
        handleY -= this.radius - dy;
        break;
        case "se":
        handleX += this.radius + dx;
        handleY += this.radius + dy;
        break;
        case "sw":
        handleX -= this.radius - dx;
        handleY += this.radius + dy;
        break;
        case "ne":
        handleX += this.radius + dx;
        handleY -= this.radius - dy;
        break;
        case "nw":
        handleX -= this.radius - dx;
        handleY -= this.radius - dy;
        break;
    }
    const dxNew = handleX - this.centerX;
    const dyNew = handleY - this.centerY;

    const newRadius = Math.sqrt(dxNew * dxNew + dyNew * dyNew);

    this.radius = Math.max(1, newRadius);
    }

    getBoundingBox(): BoundingBox {
        const r = Math.abs(this.radius)
        return {
            x: this.centerX - r,
            y: this.centerY - r,
            width: r * 2,
            height: r * 2,
        }
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        const box = this.getBoundingBox()
        const padding = 4

        ctx.save()
        ctx.strokeStyle = "#6965db";
        ctx.lineWidth = 1;
        ctx.setLineDash([])
        ctx.beginPath()
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
            type:"circle",
            style: this.style,
            centerX: this.centerX,
            centerY: this.centerY,
            radius: this.radius
        }
    }
}