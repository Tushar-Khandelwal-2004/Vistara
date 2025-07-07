import { Tool } from "@/components/Canvas";
import { getExisitingShapes } from "./http";

type Shape = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number
} | {
    type: "circle",
    x: number,
    y: number,
    width: number,
    height: number
} | {
    type: "pencil",
    points: { x: number; y: number }[]
};

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private roomId: string;
    private existingShapes: Shape[];
    private socket: WebSocket;
    private clicked: boolean;
    private currentPencilPath: { x: number; y: number }[];
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";

    private scale = 1;
    private offsetX = 0;
    private offsetY = 0;

    private isPanning = false;
    private lastPanX = 0;
    private lastPanY = 0;

    private cleanupKeyboardZoom?: () => void;


    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roomId = roomId;
        this.existingShapes = [];
        this.socket = socket;
        this.clicked = false;
        this.currentPencilPath = [];
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
        this.cleanupKeyboardZoom = this.initKeyboardZoom();

    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("wheel", this.handleZoom);
        this.cleanupKeyboardZoom?.();
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
        if (tool === "hand") {
            this.canvas.style.cursor = "grab";
        } else {
            this.canvas.style.cursor = "crosshair";
        }
    }

    async init() {
        this.existingShapes = await getExisitingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "chat") {
                const parsedShape = JSON.parse(message.message);
                this.existingShapes.push(parsedShape.shape);
                this.clearCanvas();
            }
        };
    }

    clearCanvas() {
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
        this.ctx.clearRect(-this.offsetX / this.scale, -this.offsetY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);

        this.existingShapes.forEach((shape) => {
            this.ctx.strokeStyle = "black";
            if (shape.type === "rect") {
                const { x, y, width, height } = shape;
                const drawX = width < 0 ? x + width : x;
                const drawY = height < 0 ? y + height : y;
                this.ctx.strokeRect(drawX, drawY, Math.abs(width), Math.abs(height));
            } else if (shape.type === "circle") {
                const { x, y, width, height } = shape;
                const centerX = x + width / 2;
                const centerY = y + height / 2;
                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, 2 * Math.PI);
                this.ctx.stroke();
            } else if (shape.type === "pencil") {
                const points = shape.points;
                if (points.length < 2) return;
                this.ctx.beginPath();
                this.ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    this.ctx.lineTo(points[i].x, points[i].y);
                }
                this.ctx.stroke();
            }
        });
    }

    mouseDownHandler = (e: MouseEvent) => {
        if (this.selectedTool === "hand") {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = "grabbing";
            return;
        }

        this.clicked = true;
        this.startX = (e.clientX - this.offsetX) / this.scale;
        this.startY = (e.clientY - this.offsetY) / this.scale;

        if (this.selectedTool === "pencil") {
            this.currentPencilPath = [{ x: this.startX, y: this.startY }];
        }
    };

    mouseUpHandler = (e: MouseEvent) => {
        if (this.selectedTool === "hand") {
            this.isPanning = false;
            this.canvas.style.cursor = "grab";
            return;
        }

        this.clicked = false;
        const endX = (e.clientX - this.offsetX) / this.scale;
        const endY = (e.clientY - this.offsetY) / this.scale;
        const width = endX - this.startX;
        const height = endY - this.startY;

        let shape: Shape | null = null;

        if (this.selectedTool === "rect" || this.selectedTool === "circle") {
            shape = {
                type: this.selectedTool,
                x: this.startX,
                y: this.startY,
                width,
                height
            };
        } else if (this.selectedTool === "pencil") {
            shape = {
                type: "pencil",
                points: this.currentPencilPath
            };
            this.currentPencilPath = [];
        }

        if (!shape) return;

        this.existingShapes.push(shape);
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId
        }));

        this.clearCanvas();
    };

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.selectedTool === "hand" && this.isPanning) {
            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.clearCanvas();
            return;
        }

        if (!this.clicked) return;

        const currX = (e.clientX - this.offsetX) / this.scale;
        const currY = (e.clientY - this.offsetY) / this.scale;
        const width = currX - this.startX;
        const height = currY - this.startY;

        this.clearCanvas();

        if (this.selectedTool === "rect") {
            this.ctx.strokeRect(
                width < 0 ? currX : this.startX,
                height < 0 ? currY : this.startY,
                Math.abs(width),
                Math.abs(height)
            );
        } else if (this.selectedTool === "circle") {
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, centerY, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else if (this.selectedTool === "pencil") {
            this.currentPencilPath.push({ x: currX, y: currY });
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentPencilPath[0].x, this.currentPencilPath[0].y);
            for (let i = 1; i < this.currentPencilPath.length; i++) {
                this.ctx.lineTo(this.currentPencilPath[i].x, this.currentPencilPath[i].y);
            }
            this.ctx.stroke();
        }
    };

    handleZoom = (e: WheelEvent) => {
        e.preventDefault();

        const zoomFactor = 1.1;
        const direction = e.deltaY < 0 ? 1 : -1;
        const factor = direction > 0 ? zoomFactor : 1 / zoomFactor;

        const mouseX = e.clientX - this.canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - this.canvas.getBoundingClientRect().top;

        const worldX = (mouseX - this.offsetX) / this.scale;
        const worldY = (mouseY - this.offsetY) / this.scale;

        const newScale = this.scale * factor;
        const MIN_SCALE = 0.2;
        const MAX_SCALE = 10;

        if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

        this.scale = newScale;

        this.offsetX = mouseX - worldX * this.scale;
        this.offsetY = mouseY - worldY * this.scale;

        this.clearCanvas();
    };

    resetZoom() {
        const canvasCenterX = this.canvas.width / 2;
        const canvasCenterY = this.canvas.height / 2;

        const worldX = (canvasCenterX - this.offsetX) / this.scale;
        const worldY = (canvasCenterY - this.offsetY) / this.scale;

        this.scale = 1;

        this.offsetX = canvasCenterX - worldX * this.scale;
        this.offsetY = canvasCenterY - worldY * this.scale;

        this.clearCanvas();
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("wheel", this.handleZoom);
    }

    initKeyboardZoom() {
    const keyHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey && (e.key === "=" || e.key === "+" || e.key === "-")) {
            e.preventDefault();

            const zoomFactor = 1.1;
            let factor = 1;

            if (e.key === "=" || e.key === "+") {
                factor = zoomFactor;
            } else if (e.key === "-") {
                factor = 1 / zoomFactor;
            }

            const canvasCenterX = this.canvas.width / 2;
            const canvasCenterY = this.canvas.height / 2;

            const worldX = (canvasCenterX - this.offsetX) / this.scale;
            const worldY = (canvasCenterY - this.offsetY) / this.scale;

            const newScale = this.scale * factor;
            const MIN_SCALE = 0.2;
            const MAX_SCALE = 10;

            if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

            this.scale = newScale;
            this.offsetX = canvasCenterX - worldX * this.scale;
            this.offsetY = canvasCenterY - worldY * this.scale;

            this.clearCanvas();
        }
    };

    window.addEventListener("keydown", keyHandler);

    return () => {
        window.removeEventListener("keydown", keyHandler);
    };
}

}
