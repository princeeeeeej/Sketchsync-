"use client";
import { useEffect, useRef, useState } from "react";
import { Tool, Shapes } from "@/lib/types";
import { Circle, Eraser, Hand, MousePointer2, Pencil, Square, Type } from "lucide-react"
import { clearCanvas, getExistingShapes } from "@/draw";

export default function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<Tool>("pointer");
  const activeRef = useRef<Tool>("pointer")
  const existingShapes = useRef<Shapes[]>([])
  const startX = useRef(0)
  const startY = useRef(0)
  const isDrawing = useRef(false)

  const currentStroke = useRef<{x: number, y:number}[]>([])
  const eraseIdsRef = useRef<Set<string>>(new Set())
  const panX = useRef(0)
  const panY = useRef(0)
  const zoom = useRef(1)
  const lastRawX = useRef(0)  
  const lastRawY = useRef(0)

  const [textInput, setTextInput] = useState<{
  visible: boolean
  x: number
  y: number
  value: string
} | null>(null)

  const handleToolChange = (tool: Tool) => {
    setActive(tool);
    activeRef.current = tool;
  };

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * 0.005
      const zoomFactor = 1 - delta
      panX.current = e.offsetX - (e.offsetX - panX.current) * zoomFactor
      panY.current = e.offsetY - (e.offsetY - panY.current) * zoomFactor
      zoom.current = Math.min(Math.max(zoom.current * zoomFactor, 0.05), 20)
      clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", handleWheel)
  }, [])


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ctx = canvas.getContext("2d")!

    getExistingShapes(roomId).then(shapes => {
      existingShapes.current = shapes
      clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
    })

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === "draw") {
        existingShapes.current = message.elements
        clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
      }
      if (message.type === "snapshot") {
        existingShapes.current = message.data.elements ?? []
        clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
      }
      if (message.type === "erase") {
        existingShapes.current = existingShapes.current.filter(s => !message.ids.includes(s.id))
        clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
      }
    }
  }, [roomId, socket]) 

  const toCanvasCoords = (screenX:number, screenY:number) => ({
    x: (screenX - panX.current )/ zoom.current,
    y: (screenY - panY.current) / zoom.current
  })

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeRef.current === "hand"){
      lastRawX.current = e.nativeEvent.offsetX
      lastRawY.current = e.nativeEvent.offsetY
      isDrawing.current = true
      return
    }
    isDrawing.current = true
    if (activeRef.current === "eraser") return
    const {x: cx, y: cy} = toCanvasCoords(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    startX.current = cx
    startY.current = cy
    if (activeRef.current === "pen") {
      currentStroke.current = [{ x: cx, y: cy }] 
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const { x, y} = toCanvasCoords(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    const width = x - startX.current
    const height = y - startY.current
    const radius = Math.sqrt(width * width + height * height) / 2
    const centerX = startX.current + width / 2
    const centerY = startY.current + height / 2

    
    if (activeRef.current === "eraser") {
      const { x: ex, y: ey } = toCanvasCoords(e.nativeEvent.offsetX, e.nativeEvent.offsetY) 
      const shape = getShapeAtPoint(ex, ey)
      if (shape && !eraseIdsRef.current.has(shape.id)) {
        existingShapes.current = existingShapes.current.filter(s => s.id !== shape.id)
        eraseIdsRef.current.add(shape.id)
        clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
      }
      return
    }

    if (activeRef.current === "pen") {
      currentStroke.current = [{ x, y}]  
    }
    if(activeRef.current === "hand"){
      const rawX = e.nativeEvent.offsetX
      const rawY = e.nativeEvent.offsetY
      panX.current += rawX - lastRawX.current
      panY.current += rawY - lastRawY.current
      lastRawX.current = rawX
      lastRawY.current = rawY
      clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
      return
    }

    clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
    ctx.save()
    ctx.translate(panX.current, panY.current)
    ctx.scale(zoom.current, zoom.current)
    ctx.strokeStyle = "rgb(255,255,255)"

  
    if (activeRef.current === "rect") {
      ctx.strokeRect(startX.current, startY.current, width, height)
    }
    if (activeRef.current === "circle") {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.stroke()
    }
    if (activeRef.current === "line") {
      ctx.beginPath()
      ctx.moveTo(startX.current, startY.current)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    if(activeRef.current === "pen"){
      ctx.beginPath()
      ctx.moveTo(currentStroke.current[0].x, currentStroke.current[0].y)
      currentStroke.current.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }

    ctx.restore()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const { x:cx, y: cy} = toCanvasCoords(e.nativeEvent.offsetX, e.nativeEvent.offsetY)

    const width = cx - startX.current
    const height = cy - startY.current
    const radius = Math.sqrt(width * width + height * height) / 2
    const centerX = startX.current + width / 2
    const centerY = startY.current + height / 2

    if (activeRef.current === "rect") {
      existingShapes.current.push({ id: crypto.randomUUID(), type: "rect", x: startX.current, y: startY.current, width, height })
    }
    if (activeRef.current === "circle") {
      existingShapes.current.push({ id: crypto.randomUUID(), type: "circle", centerX, centerY, radius })
    }
    if (activeRef.current === "line") {
      existingShapes.current.push({ id: crypto.randomUUID(), type: "line", x1: startX.current, y1: startY.current, x2: cx, y2: cy })
    }
    if(activeRef.current === "text"){
        setTextInput({
            visible: true,
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
            value: ""
        })
    }
    if(activeRef.current === "pen"){
      currentStroke.current.push({
        x: cx,
        y: cy
      })
      existingShapes.current.push({id: crypto.randomUUID(), type: "pen", points: [...currentStroke.current]})
    }

    if (activeRef.current === "eraser") {
      if (socket.readyState !== WebSocket.OPEN) return
      if (eraseIdsRef.current.size > 0) {
        socket.send(JSON.stringify({ type: "erase", ids: [...eraseIdsRef.current], roomId }))
        socket.send(JSON.stringify({ type: "save", elements: existingShapes.current, roomId }))
        eraseIdsRef.current.clear()
      }
      return
    }

    if (socket.readyState !== WebSocket.OPEN) return

    socket.send(JSON.stringify({ type: "draw", elements: existingShapes.current, roomId }))
    socket.send(JSON.stringify({ type: "save", elements: existingShapes.current, roomId }))
    currentStroke.current.length = 0;
  }

  const commitText = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null)
      return
    }

    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!

    existingShapes.current.push({
      id: crypto.randomUUID(),
      type: "text",
      x: textInput.x,
      y: textInput.y,
      text: textInput.value,
      fontSize: 16
    })

    clearCanvas(existingShapes.current, canvas, ctx, panX.current, panY.current, zoom.current)
    setTextInput(null)

    socket.send(JSON.stringify({ type: "draw", elements: existingShapes.current, roomId }))
    socket.send(JSON.stringify({ type: "save", elements: existingShapes.current, roomId }))
  }

  const getShapeAtPoint = (x: number, y: number): Shapes | null => {
    for (let i = existingShapes.current.length - 1; i >= 0; i--) {
      const shape = existingShapes.current[i]

      if (shape.type === "rect") {
        if (x >= shape.x && x <= shape.x + shape.width &&
            y >= shape.y && y <= shape.y + shape.height) return shape
      }

      if (shape.type === "circle") {
        const dx = x - shape.centerX
        const dy = y - shape.centerY
        if (Math.sqrt(dx*dx + dy*dy) <= shape.radius) return shape
      }

      if (shape.type === "line") {
        const dx = shape.x2 - shape.x1
        const dy = shape.y2 - shape.y1
        const len = Math.sqrt(dx*dx + dy*dy)
        const dist = Math.abs((dy*x - dx*y + shape.x2*shape.y1 - shape.y2*shape.x1) / len)
        if (dist < 5) return shape 
      }

      if (shape.type === "text") {
        if (x >= shape.x && x <= shape.x + 100 &&
            y >= shape.y - 16 && y <= shape.y) return shape
      }

      if (shape.type === "pen") {
        const hit = shape.points.some(p =>
          Math.sqrt((x - p.x)**2 + (y - p.y)**2) < 8
        )
        if (hit) return shape
      }
    }
    return null
  }

  return (
    <div className="relative h-screen w-screen">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={
            active === "eraser"
              ? { cursor: "url('/eraser.svg') 5 5, auto", }
              : {}
        }
      />
      {textInput && (
        <textarea 
            autoFocus
            className="absolute bg-transparent border-none outline-none text-white resize-none overflow-hidden"
            style={{
                left: textInput.x,
                top: textInput.y,
                font: "16px",
                fontFamily: "monospace",
                minWidth: "4px",
                lineHeight: "1.2",
                caretColor: "white",
            }}
            value={textInput.value}
            onChange={(e) => setTextInput(prev => prev ? { ...prev, value: e.target.value } : null)}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTextInput(null) 
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  commitText()        
                }
            }}
            onBlur={commitText} 
        />
      )

      }
      <ToolBar active={active} setActive={handleToolChange} />
    </div>
  );
}

export function ToolBar({ active, setActive }: { active: Tool, setActive: (tool: Tool) => void  }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex bg-[#363541] gap-2 p-1 rounded-[10px] z-50">
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "hand" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("hand")}
      >
        <Hand color="#ffffff" size={15} />
      </button>
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "pointer" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("pointer")}
      >
        <MousePointer2 color="#ffffff" size={15} fill={active === "pointer" ? "#ffffff" : "none"} />
      </button>
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "rect" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("rect")}
      >
        <Square color="#ffffff" size={15} fill={active === "rect" ? "#ffffff" : "none"} />
      </button>
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "circle" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("circle")}
      >
        <Circle color="#ffffff" size={15} fill={active === "circle" ? "#ffffff" : "none"} />
      </button>
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "line" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("line")}
      >
        <img 
          src="/line.png" 
          className={`w-4 h-4 object-contain ${active === "line" ? "brightness-200" : ""}`} 
          alt="line"
        />
      </button>
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "pen" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("pen")}
      >
        <Pencil color="#ffffff" size={15} />
      </button>
      <button 
        className={`p-2 rounded-[7px] ${active == "eraser" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`}
        style={
          active === "eraser"
            ? { cursor: "url('/eraser.svg')" }
            : {}
        }
        onClick={() => setActive("eraser")}
      >
        <Eraser color="#ffffff" size={15}/>
      </button>
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "text" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("text")}
      >
        <Type color="#ffffff" size={15}  />
      </button>
    </div>
  )
}