import ChatRoom from "../../components/ChatRoom";
import { BACKEND_URL } from "../config"

const getRoomId = async(slug : string) => {
    const response = await fetch(`${BACKEND_URL}/room/${slug}`)
    const parsedResponse = await response.json().then(res => res.room.id)
    return parsedResponse;
}

export default async function Room({params}: {params: {slug : string}}){
    const slug = (await params).slug
    const roomId = await getRoomId(slug);
    return (
        <div>
            <ChatRoom id={roomId}/>
        </div>
    )
}