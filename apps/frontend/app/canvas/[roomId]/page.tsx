import { RoomCanvas } from "@/components/RoomCanvas";
import { initDraw } from "@/draw";
import { isUserSignedIn } from "@/utils/UserSignin";
import { useEffect, useRef } from "react"

export default async function CanvasPage({ params }: {
    params: {
        roomId: string
    }
}) {
    
    const roomId = (await params).roomId;

    return <RoomCanvas roomId={roomId} />

}