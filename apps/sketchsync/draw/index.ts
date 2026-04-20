import { HTTP_BACKEND } from "@/app/config";

type Shapes = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number
} | {
    type: "circle",
    x: number,
    y: number,
    radius: number
}

export async function initDraw( canvas: HTMLCanvasElement, roomId: string, socket: WebSocket){
    const ctx = canvas.getContext("2d");

    let existingShapes: Shapes[] = await getExistingShapes(roomId)

    if(!ctx){
        return 
    }

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if(message.type === "chat"){
            const parsedShape = JSON.parse(message.message);
            existingShapes.push(parsedShape.shape)
            clearCanvas(existingShapes, canvas, ctx)
        }
    }

    let clicked = true;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.offsetX;
        startY = e.offsetY;
    })

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        const width = e.offsetX - startX;
        const height = e.offsetY - startY;
        existingShapes.push({
            type: "rect",
            x: startX,
            y: startY,
            width,
            height
        });

        socket.send(JSON.stringify({
            roomId,
            type: "chat",
            message: JSON.stringify({
                shape: {
                type: "rect",
                x: startX,
                y: startY,
                width,
                height
                }
            })
        }))

    })

    canvas.addEventListener("mousemove", (e) => {
        if(clicked){
            const width = e.offsetX - startX;
            const height = e.offsetY - startY;
            clearCanvas(existingShapes, canvas, ctx)
            ctx.strokeStyle = "rgb(255, 255, 255)"
            ctx.strokeRect(startX, startY, width, height)
        }
    })
}

function clearCanvas(existingShapes: Shapes[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "rgb(0, 0, 0)",
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    existingShapes.map((shape) =>{
        if(shape.type === "rect"){
            ctx.strokeStyle = "rgb(255, 255, 255)"
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
        }
    })
}

async function getExistingShapes(roomId: string){
    const res = await fetch(`${HTTP_BACKEND}/chats/${roomId}`)
    const data = await res.json().then((res) => res.messages)

    const shapes = data.map((x: {message:string}) => {
        const messageData = JSON.parse(x.message)
        return messageData.shape
    })

    return shapes
}