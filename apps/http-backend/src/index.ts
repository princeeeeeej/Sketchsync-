import express from "express"
import "dotenv/config"; 
import { CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types"
import { db, users, eq, rooms, chats, desc} from "@repo/db/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({ message: "Incorrect inputs" });
  }

  try {
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
    
    const user = await db.insert(users).values({
      email: parsedData.data.username,
      password: hashedPassword,
      name: parsedData.data.name,
    }).returning({ id: users.id });

    //@ts-ignore
    res.json({ userId: user[0].id });
  } catch (e) {
    res.status(411).json({ message: "User already exists with the username" });
  }
});

app.post("/signin", async(req, res) =>{
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({ message: "Incorrect inputs" });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsedData.data.username)
  })

  if(!user){
    return res.status(411).json({
      message: "User not found"
    })
  }

  const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);
  const jwtToken = jwt.sign({
    userId: user.id
  }, JWT_SECRET);

  if(!isPasswordValid){
    res.status(403).json({
      message: "Invalid password"
    })
  }

  res.json({
    token: jwtToken,
  })
})

app.post("/room",middleware, async(req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if(!parsedData.success){
    return res.json({
      message: "Incorrect inputs"
    })
  }
  //@ts-ignore
  const userId = req.userId;

  const roomId = await db.insert(rooms).values({
    slug: parsedData.data.name,
    adminId: userId
  }).returning({ id: rooms.id })

  
  res.json({
    //@ts-ignore
    roomId: roomId[0].id
  })

})

app.get("/chats/:roomId", async(req, res) =>{
  const roomId = Number(req.params.roomId);

  const messages = await db.query.chats.findMany({
    where: eq(chats.roomId, roomId),
    limit: 50,
    orderBy: desc(chats.id)
  })

  res.json({
    messages
  })
})


app.get("/room/:slug", async(req, res) =>{
  const slug = req.params.slug as string;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.slug, slug)
  })

  if(!room){
    return res.status(411).json({
      message: "Room not found"
    })
  }

  res.json({
    room
  })
})

app.listen(3001, () =>{
    console.log("server is running")
})