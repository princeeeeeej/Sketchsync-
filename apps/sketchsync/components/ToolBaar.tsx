import { Circle, Eraser, Hand, MousePointer2, Pencil, Square, Type } from "lucide-react";
import { Tool } from "./canvas/types";

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