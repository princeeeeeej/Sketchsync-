"use client"
import { WS_BACKEND } from "@/app/config";
import { initDraw } from "@/draw";
import { Button } from "@repo/ui/Button";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId}: {roomId: string}){

    const [socket, setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
        const ws = new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZTg1ZGVmMS02OTE2LTQ5NmMtOTIyOC00NTU2YWNjMzZjMWEiLCJpYXQiOjE3NzY2NzcwMjV9.TWRgsJTBcYMgZnEQIy6MBuUub-sEW0MuIRz73ifsLow`)

        ws.onopen = () => {
            setSocket(ws)
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    }, [])

    if(!socket){
        return <div>Connecting to server...</div>
    }

    return (
    <div>
        <Canvas roomId={roomId} socket={socket}/>
        <div className="absolute top-0 left-0">
            <Button className="bg-white px-5 py-3 rounded-[8px] mt-2 cursor-pointer">Rectangle</Button>
            <Button className="bg-white px-5 py-3 rounded-[8px] mt-2 cursor-pointer">Circle</Button>
        </div>
    </div>
    )
}