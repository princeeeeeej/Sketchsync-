"use client"

import { WS_URL } from "@/app/config";
import { useEffect, useState } from "react"
import Canvas from "./Canvas";

export default function RoomCanvas({ roomId }: { roomId: string }) {
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);


    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return
        }

        const ws = new WebSocket(`${WS_URL}?token=${token}`)

        ws.onopen = () => {
            setWebSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    }, [])

    if (!webSocket) {
        return <div>Connecting to server...</div>
    }

    return (
        <div>
            <Canvas roomId={roomId} socket={webSocket}/>

        </div>
    )
}