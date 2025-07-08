import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { ArrowUpRightIcon, CircleIcon, DiamondIcon, HandIcon, PencilIcon, RectangleHorizontalIcon, SlashIcon } from "lucide-react";
import { Game } from "@/draw/Game";
import useSize from "@/hooks/useSize";
import ZoomPanel from "./ZoomPanel";

export type Tool = "circle" | "rect" | "pencil" | "hand" | "line" | "arrow" | "diamond";

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
    const [selectedTool, setSelectedTool] = useState<Tool>("hand");
    const [zoomLevel, setZoomLevel] = useState<number>(1);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket, (zoom) => {
                setZoomLevel(zoom);
            });
            setGame(g);
            return () => {
                g.destroy();
            };
        }
    }, [canvasRef]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    game?.zoomIn?.();
                } else if (e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    game?.zoomOut?.();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [game]);


    return (
        <div>
            <canvas ref={canvasRef} width={windowSize[0]} height={windowSize[1]} />
            <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} game={game} />
            <ZoomPanel
                zoomLevel={zoomLevel}
                zoomIn={() => game?.zoomIn?.()}
                zoomOut={() => game?.zoomOut?.()}
            />
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
            <IconButton
                activated={selectedTool === "line"}
                icon={<SlashIcon />}
                onclick={() => setSelectedTool("line")}
            />
            <IconButton
                activated={selectedTool === "arrow"}
                icon={<ArrowUpRightIcon />}
                onclick={() => setSelectedTool("arrow")}
            />
            <IconButton
                activated={selectedTool === "diamond"}
                icon={<DiamondIcon />}
                onclick={() => setSelectedTool("diamond")}
            />


            <IconButton activated={selectedTool === "hand"} icon={<HandIcon />} onclick={() => { setSelectedTool("hand") }} />

            <button
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                onClick={() => { game?.resetZoom?.() }}
            >
                Reset Zoom
            </button>
        </div>
    );
}