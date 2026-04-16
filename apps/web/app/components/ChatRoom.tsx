import { BACKEND_URL } from "../room/config"
import ChatRoomClient from "./ChatRoomClient";

const getChats = async (roomId : string) => {
    const response = await fetch(`${BACKEND_URL}/chats/${roomId}`)
    const parsedResponse = await response.json().then(res => res.messages)
    return parsedResponse;
}

const ChatRoom = async ({id}: {id:string}) => {
    const chats = await getChats(id);
    return (
        <div>
            <ChatRoomClient messages={chats} id={id}/>
        </div>
    )
}

export default ChatRoom