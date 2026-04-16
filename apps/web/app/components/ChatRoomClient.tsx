"use client"

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket"

interface Message {
    id: number;
    roomId: number;
    message: string;
    userId: string;
}

const ChatRoomClient = ({ messages, id }: { messages: Message[], id: string }) => {
    const [chatMessages, setChatMessages] = useState<Message[]>(messages ?? [])
    const { socket, loading } = useSocket();
    const [currentMessage, setCurrentMessage] = useState("")

    useEffect(() => {
        if (socket && !loading && socket.readyState === WebSocket.OPEN) {

            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }))

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data)
                if (parsedData.type === "chat") {
                    setChatMessages(prev => [...prev, {
                        id: Date.now(),
                        roomId: Number(id),
                        message: parsedData.message,
                        userId: ""
                    }])
                }
            }
        }
    }, [socket, loading, id])

    return (
        <div>
            {chatMessages.map((message, index) => (
                <div key={index}>{message.message}</div>
            ))}
            <input value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} />
            <button onClick={() => {
                if (socket?.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: "chat",
                        roomId: id,
                        message: currentMessage
                    }))
                }

                setCurrentMessage("")
            }}>Send message</button>
        </div>
    )
}

export default ChatRoomClient