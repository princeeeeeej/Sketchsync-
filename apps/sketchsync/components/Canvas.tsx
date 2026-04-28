"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasManager } from "../canvas/CanvasManager";
import { Tool } from "../canvas/types";
import { ToolBar } from "./ToolBaar";
import { BACKEND_URL } from "@/app/config";

export default function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const [active, setActive] = useState<Tool>("pointer");
  const [textInput, setTextInput] = useState<{
    canvasX: number;
    canvasY: number;
    screenX: number;
    screenY: number;
    value: string;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const manager = new CanvasManager(
      canvas,
      (shape) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: "draw", elements: shape, roomId }));
        socket.send(JSON.stringify({ type: "save", elements: shape, roomId }));
      },
      (ids) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: "erase", ids, roomId }));
      },
      (x, y) => {
        socket.send(JSON.stringify({ type: "cursor", x, y, roomId }));
      },
      (canvasX, canvasY, screenX, screenY) => {
        setTextInput({ canvasX, canvasY, screenX, screenY, value: "" });
      },
    );

    managerRef.current = manager;

    fetch(`${BACKEND_URL}/canvas/${roomId}`)
      .then((res) => res.json())
      .then((data) => manager.loadShapes(data.elements) ?? []);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!managerRef.current) return;

      if (message.type === "draw")
        managerRef.current.onRemoteDraw(message.elements);
      if (message.type === "erase")
        managerRef.current.onRemoteErase(message.ids);
      if (message.type === "snapshot")
        managerRef.current.onRemoteDraw(message.data.elements ?? []);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = 1 - e.deltaY * 0.005;
      managerRef.current?.zoomAt(e.offsetX, e.offsetY, factor);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  const handleToolChange = (tool: Tool) => {
    setActive(tool);
    managerRef.current?.setTool(tool);
  };

  const commitText = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    managerRef.current?.commitText(
      textInput.canvasX,
      textInput.canvasY,
      textInput.value,
    );
    setTextInput(null);
  };

  return (
    <div className="relative w-screen h-screen">
      <canvas
        ref={canvasRef}
        style={
          active === "eraser" ? { cursor: "url('/eraser.svg') 5 5, auto" } : {}
        }
        onPointerDown={(e) =>
          managerRef.current?.onPointerDown(
            e.nativeEvent.offsetX,
            e.nativeEvent.offsetY,
          )
        }
        onPointerMove={(e) =>
          managerRef.current?.onPointerMove(
            e.nativeEvent.offsetX,
            e.nativeEvent.offsetY,
          )
        }
        onPointerUp={(e) =>
          managerRef.current?.onPointerUp(
            e.nativeEvent.offsetX,
            e.nativeEvent.offsetY,
          )
        }
      />
      {textInput && (
        <textarea
          autoFocus
          className="absolute bg-transparent border-none outline-none text-white resize-none overflow-hidden"
          style={{
            left: textInput.screenX,
            top: textInput.screenY,
            fontSize: "16px",
            fontFamily: "monospace",
            minWidth: "100px", 
            minHeight: "30px", 
            lineHeight: "1.2",
            caretColor: "white",
            border: "1px solid red", 
            zIndex: 1000, 
          }}
          value={textInput.value}
          onChange={(e) =>
            setTextInput((prev) =>
              prev ? { ...prev, value: e.target.value } : null,
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Escape") setTextInput(null);
            if (e.key === "Enter" && !e.shiftKey) commitText();
          }}
        />
      )}
      <ToolBar active={active} setActive={handleToolChange} />
    </div>
  );
}
