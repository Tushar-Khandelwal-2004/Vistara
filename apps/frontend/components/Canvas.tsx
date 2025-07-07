import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { CircleIcon, HandIcon, PencilIcon, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";
import useSize from "@/hooks/useSize";

export type Tool = "circle" | "rect" | "pencil" | "hand";

export function Canvas({
    roomId,
    socket
}: {
    roomId: string,
    socket: WebSocket
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const windowSize = useSize();
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            return () => {
                g.destroy();
            };
        }
    }, [canvasRef]);

    return (
        <div>
            <canvas ref={canvasRef} width={windowSize[0]} height={windowSize[1]}></canvas>
            <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} game={game} />
        </div>
    );
}

export function TopBar({
    selectedTool,
    setSelectedTool,
    game
}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void,
    game?: Game
}) {
    return (
        <div className="fixed top-10 left-10 flex gap-2 bg-white p-2 rounded shadow">
            <IconButton activated={selectedTool === "pencil"} icon={<PencilIcon />} onclick={() => setSelectedTool("pencil")} />
            <IconButton activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} onclick={() => setSelectedTool("rect")} />
            <IconButton activated={selectedTool === "circle"} icon={<CircleIcon />} onclick={() => setSelectedTool("circle")} />
            <IconButton activated={selectedTool === "hand"} icon={<HandIcon/>} onclick={()=>{setSelectedTool("hand")}}  />
            <button
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                onClick={() => { game?.resetZoom() }}
            >
                Reset Zoom
            </button>
        </div>
    );
}
