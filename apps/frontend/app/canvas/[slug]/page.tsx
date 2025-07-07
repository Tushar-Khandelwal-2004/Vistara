import { RoomCanvas } from "@/components/RoomCanvas";
import { initDraw } from "@/draw";
import { isUserSignedIn } from "@/utils/UserSignin";
import axios from "axios";
import { useEffect, useRef } from "react"

async function getRoomId(slug: string) {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/room/${slug}`)
    if (response.data.room) {
        return response.data.room.id;
    }
    return null;
}

export default async function CanvasPage({ params }: {
    params: {
        slug: string
    }
}) {

    const slug = (await params).slug;
    const roomId = await getRoomId(slug);
    if(roomId!==null){
    return <RoomCanvas roomId={roomId} />

    }
    return (
        <div>
            Room does not exists!
        </div>
    )

}