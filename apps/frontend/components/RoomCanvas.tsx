"use client";

import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { isUserSignedIn } from "@/utils/UserSignin";
import { useRouter } from "next/navigation";

export function RoomCanvas({ roomId }: { roomId: string }) {
    const [signedIn, setSignedIn] = useState<null | boolean>(null);
    const [socket, setSocket] = useState<WebSocket>();
    const router = useRouter(); 
    useEffect(() => {
        (async () => {
            const result = await isUserSignedIn();
            console.log("User signed in?", result);
            setSignedIn(result);
        })();
    }, []);

    useEffect(() => {
        if (signedIn === false) {
            router.push("/signin");
        }
    }, [signedIn]);

    useEffect(() => {
        if (!signedIn) return;

        const token = localStorage.getItem("token");
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL!}?token=${token}`);

        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId: roomId
            }));
        };

        return () => ws.close();
    }, [signedIn]);

    if (signedIn === null) return <div>Loading auth...</div>;
    if (!socket) return <div>Connecting to ws server...</div>;

    return (
        <div>
            <Canvas roomId={roomId} socket={socket} />
        </div>
    );
}
