import { useEffect, useState } from "react"
import { WS_URL } from "../room/config";

export const useSocket = () => {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMzExZGIwYS0yNThiLTQ0ZGItOWUwNi1kZDY5NjQ3ZWM0MDgiLCJpYXQiOjE3NzYyNzQ4MTN9.9WHafcqUN08AtZlRU3GmPgP2XE3JyK0486pWx3lpAfE`)
        ws.onopen = () => {
            setLoading(false)
            setSocket(ws)
        }

        ws.onclose = () => {
            setLoading(true)
            setSocket(null)
        }

        return () => {
            ws.close()
        }
    }, [])

    return { loading, socket }
} 