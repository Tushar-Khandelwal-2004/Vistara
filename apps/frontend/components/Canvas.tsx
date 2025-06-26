import { initDraw } from "@/draw";
import useSize from "@/hooks/useSize";
import { useEffect, useRef } from "react";

export function Canvas({
    roomId,
    socket
}: {
    roomId: string,
    socket:WebSocket
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const windowSize=useSize();
    useEffect(() => {

        if (canvasRef.current) {


            initDraw(canvasRef.current, roomId, socket)

        }

    }, [canvasRef])
    return (
        <div>
            <canvas ref={canvasRef} width={windowSize[0]} height={windowSize[1]}></canvas>
        </div>
    )
}