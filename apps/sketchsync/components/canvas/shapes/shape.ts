import { BoundingBox, ResizeHandle, ShapeData, ShapeStyles } from "../types"

export abstract class Shape {
    id: string
    style: ShapeStyles

    constructor(id: string, style: ShapeStyles){
        this.id = id
        this.style = style
    }

    apply(ctx: CanvasRenderingContext2D){
        ctx.strokeStyle = this.style.strokeColor
        ctx.fillStyle = this.style.fillColor
        ctx.globalAlpha = this.style.opacity,
        ctx.lineWidth = this.style.strokeWidth
        if (this.style.strokeSize === "dashed") ctx.setLineDash([5,3])
        else if (this.style.strokeSize === "dotted") ctx.setLineDash([2,2])
        else ctx.setLineDash([])
    }

    abstract draw(ctx: CanvasRenderingContext2D): void

    abstract hitTest(x: number, y: number): boolean

    abstract translate(dx: number, dy: number): void

    abstract resize(handle: ResizeHandle, dx: number, dy: number): void

    abstract getBoundingBox(): BoundingBox

    abstract drawSelection(ctx: CanvasRenderingContext2D): void

    abstract serialize(): ShapeData
}