import express from "express"
import "dotenv/config"; 
import { CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types"
import { db, users, eq, rooms, desc, canvasSnapshots} from "@repo/db/client"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import cors from "cors"

const app = express();
app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    console.log("Validation failed:", parsedData.error);
    return res.status(400).json({ message: "Incorrect inputs" });
  }

  try {
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
    
    const user = await db.insert(users).values({
      email: parsedData.data.email,
      password: hashedPassword,
      name: parsedData.data.username,
    }).returning({ id: users.id });

    //@ts-ignore
    res.json({ userId: user[0].id });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(411).json({ message: "User already exists with the email" });
  }
});

app.post("/signin", async(req, res) =>{
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ message: "Incorrect inputs" });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsedData.data.email)
  })

  if(!user){
    return res.status(403).json({
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

  try {
    const roomId = await db.insert(rooms).values({
      slug: parsedData.data.name,
      adminId: userId
    }).returning({ id: rooms.id })

    res.json({
      //@ts-ignore
      roomId: roomId[0].id
    })
  } catch (e) {
    console.error("Room creation error:", e);
    res.status(411).json({
      message: "Room already exists with this name"
    })
  }
})

app.get("/room/:roomId",middleware, async (req, res) => {
  const roomId = Number(req.params.roomId);
  const data = await db.query.canvasSnapshots.findMany({
    where: eq(canvasSnapshots.roomId, roomId),
    orderBy: desc(canvasSnapshots.id)
  })

  if(!data){
    return res.status(404).json({
      message: "No data found"
    })
  }

  res.json({
    data
  })

})
app.get("/canvas/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId)

  if (isNaN(roomId)) {
    return res.status(400).json({ message: "Invalid roomId" })
  }

  const snapshot = await db.query.canvasSnapshots.findFirst({
    where: eq(canvasSnapshots.roomId, roomId)
  })

  if (!snapshot) {
    return res.json({ elements: [] })  // new room — empty canvas, not 404
  }

  res.json({
    elements: (snapshot.data as any).elements ?? []
  })
})


app.listen(3001, () =>{
    console.log("server is running")
})