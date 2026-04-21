"use client";
import { useEffect, useRef, useState } from "react";
import { Tool, Shapes } from "@/lib/types";
import { Circle, MousePointer2, Pencil, Square, Type } from "lucide-react"
import { Dispatch, SetStateAction } from "react"
import { clearCanvas, getExistingShapes } from "@/draw";

export default function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<Tool>("pointer");
  const activeRef = useRef<Tool>("pointer")
  const existingShapes = useRef<Shapes[]>([])
  const startX = useRef(0)
  const startY = useRef(0)
  const isDrawing = useRef(false)

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ctx = canvas.getContext("2d")!

    getExistingShapes(roomId).then(shapes => {
      existingShapes.current = shapes
      clearCanvas(existingShapes.current, canvas, ctx)
    })

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === "draw") {
        existingShapes.current = message.elements
        clearCanvas(existingShapes.current, canvas, ctx)
      }
      if (message.type === "snapshot") {
        existingShapes.current = message.data.elements ?? []
        clearCanvas(existingShapes.current, canvas, ctx)
      }
    }
  }, [roomId, socket]) 

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeRef.current === "pointer") return
    isDrawing.current = true
    startX.current = e.nativeEvent.offsetX
    startY.current = e.nativeEvent.offsetY
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const width = e.nativeEvent.offsetX - startX.current
    const height = e.nativeEvent.offsetY - startY.current
    const radius = Math.sqrt(width * width + height * height) / 2
    const centerX = startX.current + width / 2
    const centerY = startY.current + height / 2

    clearCanvas(existingShapes.current, canvas, ctx)
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
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      ctx.stroke()
    }
    if(activeRef.current === "text"){
        
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const width = e.nativeEvent.offsetX - startX.current
    const height = e.nativeEvent.offsetY - startY.current
    const radius = Math.sqrt(width * width + height * height) / 2
    const centerX = startX.current + width / 2
    const centerY = startY.current + height / 2

    if (activeRef.current === "rect") {
      existingShapes.current.push({ type: "rect", x: startX.current, y: startY.current, width, height })
    }
    if (activeRef.current === "circle") {
      existingShapes.current.push({ type: "circle", centerX, centerY, radius })
    }
    if (activeRef.current === "line") {
      existingShapes.current.push({ type: "line", x1: startX.current, y1: startY.current, x2: e.nativeEvent.offsetX, y2: e.nativeEvent.offsetY })
    }
    if(activeRef.current === "text"){
        setTextInput({
            visible: true,
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
            value: ""
  })
    }

    if (socket.readyState !== WebSocket.OPEN) return

    socket.send(JSON.stringify({ type: "draw", elements: existingShapes.current, roomId }))
    socket.send(JSON.stringify({ type: "save", elements: existingShapes.current, roomId }))
  }

  const commitText = () => {
  if (!textInput || !textInput.value.trim()) {
    setTextInput(null)
    return
  }

  const canvas = canvasRef.current!
  const ctx = canvas.getContext("2d")!

  existingShapes.current.push({
    type: "text",
    x: textInput.x,
    y: textInput.y,
    text: textInput.value,
    fontSize: 16
  })

  clearCanvas(existingShapes.current, canvas, ctx)
  setTextInput(null)

  socket.send(JSON.stringify({ type: "draw", elements: existingShapes.current, roomId }))
  socket.send(JSON.stringify({ type: "save", elements: existingShapes.current, roomId }))
}

  return (
    <div className="relative h-screen w-screen">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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
                  setTextInput(null)  // cancel
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  commitText()        // confirm
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
      {/* Pointer */}
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "pointer" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("pointer")}
      >
        <MousePointer2 color="#ffffff" size={15} fill={active === "pointer" ? "#ffffff" : "none"} />
      </button>

      {/* Rectangle */}
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "rect" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("rect")}
      >
        <Square color="#ffffff" size={15} fill={active === "rect" ? "#ffffff" : "none"} />
      </button>

      {/* Circle */}
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "circle" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("circle")}
      >
        <Circle color="#ffffff" size={15} fill={active === "circle" ? "#ffffff" : "none"} />
      </button>

      {/* Line (Image) */}
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

      {/* Pen */}
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "pen" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("pen")}
      >
        <Pencil color="#ffffff" size={15} fill={active === "pen" ? "#ffffff" : "none"} />
      </button>

      {/* Text */}
      <button 
        className={`p-2 rounded-[7px] cursor-pointer ${active == "text" ? "bg-[#9f9ce1]" : "hover:bg-[#4a4954]"}`} 
        onClick={() => setActive("text")}
      >
        <Type color="#ffffff" size={15} fill={active === "text" ? "#ffffff" : "none"} />
      </button>
    </div>
  )
}