import { initDraw } from "@/draw";
import useSize from "@/hooks/useSize";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { CircleIcon, PencilIcon, RectangleHorizontalIcon } from "lucide-react";

type Shape = "circle" | "rect" | "pencil";

export function Canvas({
    roomId,
    socket
}: {
    roomId: string,
    socket: WebSocket
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const windowSize = useSize();
    const [selectedTool, setSelectedTool] = useState<Shape>("circle");

    useEffect(()=>{
        //@ts-ignore
        window.selectedTool=selectedTool;
    },[selectedTool]);

    useEffect(() => {

        if (canvasRef.current) {


            initDraw(canvasRef.current, roomId, socket)

        }

    }, [canvasRef])
    return (
        <div>
            <canvas ref={canvasRef} width={windowSize[0]} height={windowSize[1]}></canvas>
            <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
        </div>
    )
}

export function TopBar({ selectedTool, setSelectedTool }: {
    selectedTool: Shape,
    setSelectedTool: (s: Shape) => void
}) {
    return (
        <div className="fixed top-10 left-10 flex ">
            <IconButton activated={selectedTool === "pencil"} icon={<PencilIcon />} onclick={() => { setSelectedTool("pencil") }} />
            <IconButton activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} onclick={() => { setSelectedTool("rect") }} />
            <IconButton activated={selectedTool === "circle"} icon={<CircleIcon />} onclick={() => { setSelectedTool("circle") }} />
        </div>
    )
}