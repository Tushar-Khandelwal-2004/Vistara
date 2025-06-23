"use client"

import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: {
    roomId: string
}) {

    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        console.log(process.env.NEXT_PUBLIC_WS_URL);
        const token=localStorage.getItem("token");
        console.log(`${process.env.NEXT_PUBLIC_WS_URL!}?token=${token}`);
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL!}?token=${token}`);

        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type:"join_room",
                roomId:roomId
            }))
        }


    }, []);



    if (!socket) {
        return (
            <div>
                connecting to ws server...
            </div>
        )
    }
    return (
        <div>
            <Canvas roomId={roomId} socket={socket}/>

        </div>
    )
}