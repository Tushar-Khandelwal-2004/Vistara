import { initDraw } from "@/draw";
import useSize from "@/hooks/useSize";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { CircleIcon, PencilIcon, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil";

export function Canvas({
    roomId,
    socket
}: {
    roomId: string,
    socket: WebSocket
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const windowSize = useSize();
    const [game,setGame]=useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");

    useEffect(()=>{
        game?.setTool(selectedTool);
    },[selectedTool,game]);

    useEffect(() => {

        if (canvasRef.current) {
            const g=new Game(canvasRef.current, roomId, socket);
            setGame(g);
            return ()=>{
                g.destroy();
            }
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
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return (
        <div className="fixed top-10 left-10 flex ">
            <IconButton activated={selectedTool === "pencil"} icon={<PencilIcon />} onclick={() => { setSelectedTool("pencil") }} />
            <IconButton activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} onclick={() => { setSelectedTool("rect") }} />
            <IconButton activated={selectedTool === "circle"} icon={<CircleIcon />} onclick={() => { setSelectedTool("circle") }} />
        </div>
    )
}