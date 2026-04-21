import { WebSocketServer, WebSocket } from 'ws';
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken"
import { canvasSnapshots, db, eq } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  userId: string
  rooms: Set<number>  // Set = O(1) add/delete/has
}

// ws → user data
const wsToUser = new Map<WebSocket, User>()

// roomId → connected websockets
const roomToClients = new Map<number, Set<WebSocket>>()

// ─── AUTH ─────────────────────────────────────────────

const checkUser = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === "string" || !decoded?.userId) return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

// ─── HELPERS ──────────────────────────────────────────

const joinRoom = (ws: WebSocket, roomId: number) => {
  const user = wsToUser.get(ws)
  if (!user) return;

  user.rooms.add(roomId)

  if (!roomToClients.has(roomId)) {
    roomToClients.set(roomId, new Set())
  }
  roomToClients.get(roomId)!.add(ws)
}

const leaveRoom = (ws: WebSocket, roomId: number) => {
  const user = wsToUser.get(ws)
  if (!user) return;

  user.rooms.delete(roomId)
  roomToClients.get(roomId)?.delete(ws)

  // cleanup empty room from map
  if (roomToClients.get(roomId)?.size === 0) {
    roomToClients.delete(roomId)
  }
}

const broadcast = (roomId: number, data: object, exclude?: WebSocket) => {
  const clients = roomToClients.get(roomId)
  if (!clients) return;

  const payload = JSON.stringify(data)
  clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

const isRoomEmpty = (roomId: number): boolean => {
  const clients = roomToClients.get(roomId)
  return !clients || clients.size === 0
}

const saveSnapshot = async (roomId: number, elements: any) => {
  await db.insert(canvasSnapshots)
    .values({
      roomId,
      data: { elements, appState: {} },
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: canvasSnapshots.roomId,
      set: {
        data: { elements, appState: {} },
        updatedAt: new Date()
      }
    })
}

// ─── CONNECTION ───────────────────────────────────────

wss.on('connection', (ws, request) => {
  const url = request.url
  if (!url) return ws.close()

  const token = new URLSearchParams(url.split('?')[1]).get("token")
  const userId = checkUser(token ?? "")

  if (!userId) return ws.close(4001, "Unauthorized")

  wsToUser.set(ws, { userId, rooms: new Set() })

  // ─── MESSAGES ───────────────────────────────────────

  ws.on("message", async (raw) => {
    let parsedData: any;
    try {
      parsedData = JSON.parse(raw as unknown as string)
    } catch {
      return
    }

    const user = wsToUser.get(ws)
    if (!user) return;

    switch (parsedData.type) {

      case "join_room": {
        const roomId = parseInt(parsedData.roomId)
        if (isNaN(roomId)) return;

        joinRoom(ws, roomId)

        // send existing snapshot to joiner
        const snapshot = await db.query.canvasSnapshots.findFirst({
          where: eq(canvasSnapshots.roomId, roomId)
        })

        ws.send(JSON.stringify({
          type: "snapshot",
          roomId,
          data: snapshot?.data ?? { elements: [], appState: {} }
        }))

        // tell others someone joined
        broadcast(roomId, {
          type: "user_joined",
          userId: user.userId,
          roomId
        }, ws)

        break;
      }

      case "leave_room": {
        const roomId = parseInt(parsedData.roomId)
        if (isNaN(roomId)) return;

        leaveRoom(ws, roomId)

        if (isRoomEmpty(roomId) && parsedData.elements) {
          await saveSnapshot(roomId, parsedData.elements)
        }

        broadcast(roomId, {
          type: "user_left",
          userId: user.userId,
          roomId
        })

        break;
      }

      case "draw": {
        const roomId = parseInt(parsedData.roomId)
        if (isNaN(roomId)) return;

        // broadcast only — no DB write
        broadcast(roomId, {
          type: "draw",
          elements: parsedData.elements,
          userId: user.userId,
          roomId
        }, ws)  // exclude sender

        break;
      }

      case "save": {
        const roomId = parseInt(parsedData.roomId)
        if (isNaN(roomId)) return;
        await saveSnapshot(roomId, parsedData.elements)
        break;
      }
    }
  })

  // ─── DISCONNECT ─────────────────────────────────────

  ws.on("close", () => {
    const user = wsToUser.get(ws)
    if (!user) return;

    // leave all rooms cleanly
    user.rooms.forEach(roomId => {
      leaveRoom(ws, roomId)
      broadcast(roomId, {
        type: "user_left",
        userId: user.userId,
        roomId
      })
    })

    wsToUser.delete(ws)
  })
})

// ─── AUTO SNAPSHOT every 30s ─────────────────────────

setInterval(() => {
  roomToClients.forEach((clients, roomId) => {
    const firstClient = clients.values().next().value
    if (!firstClient) return;
    firstClient.send(JSON.stringify({
      type: "request_snapshot",
      roomId
    }))
  })
}, 30_000)