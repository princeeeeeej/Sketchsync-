import { BACKEND_URL } from "@/app/config";
import { Shapes } from "@/lib/types";

export function clearCanvas(
  existingShapes: Shapes[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  panX: number,
  panY: number,
  zoom: number
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(18, 18, 18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)
  existingShapes.forEach((shape) => {
    ctx.strokeStyle = "rgb(255, 255, 255)";
    if (shape.type === "rect") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shape.type === "line") {
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    }
    else if (shape.type === "text") {
      ctx.fillStyle = "rgb(255,255,255)"
      ctx.font = `${shape.fontSize ?? 16}px monospace`
      shape.text.split("\n").forEach((line, i) => {
          ctx.fillText(line, shape.x, shape.y + i * (shape.fontSize ?? 16) * 1.2)
      })
    }
    else if (shape.type === "pen") {
      if (shape.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(shape.points[0].x, shape.points[0].y)
      shape.points.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }
  });
  ctx.restore()
}

export async function getExistingShapes(roomId: string): Promise<Shapes[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/canvas/${roomId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.elements ?? [];
  } catch {
    return [];
  }
}
