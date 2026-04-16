import { WebSocketServer, WebSocket } from 'ws';
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken"
import { chats, db } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User{
  ws: WebSocket,
  rooms: string[],
  userId: string
}


const users: User[] = []

const checkUser = (token: string): string | null =>{
  try{
    const decodedToken = jwt.verify(token, JWT_SECRET)
  if( typeof decodedToken == "string"){
    return null;
  }

  if(!decodedToken || !decodedToken.userId){
    return null;
  }

  return decodedToken.userId;
  }catch(e){
    return null;
  }

}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if(!url){
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get("token");
  const userId = checkUser(token!);

  if(!userId){
    ws.close();
    return;
  }  

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on("message", async (data) =>{
    const parsedData = JSON.parse(data as unknown as string)

    if(parsedData.type === "join_room"){
      const user = users.find(x => x.ws === ws);
      if(!user){
        return;
      }
      user.rooms.push(parsedData.roomId)
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x => x.ws === ws);
      if(!user){
        return;
      }
      user.rooms = user.rooms.filter(x => x !== parsedData.roomId)

    }

    if(parsedData.type === "chat"){
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await db.insert(chats).values({
        roomId,
        message,
        userId
      })

      users.forEach(user => {
        if(user.rooms.includes(roomId)){
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId
          }))
        }
      })
    }
  })
});