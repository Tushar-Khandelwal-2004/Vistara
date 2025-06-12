import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";


export function useSocket() {
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<WebSocket>();
    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZTAyYTViNC03NjUwLTQwZjItYTcwMy02MWU1MWQ4M2U4YTMiLCJpYXQiOjE3NDk2Mzc2ODV9.86TF-0rm1WM05JKcYZlh3daFX7RlX1t56mmkWgXwmU8`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    }, []);
    return {
        socket,
        loading
    }
}