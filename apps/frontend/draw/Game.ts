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
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "arrow";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "diamond";
    x: number;
    y: number;
    width: number;
    height: number;
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
    private onZoomChange?: (zoom: number) => void;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, onZoomChange?: (zoom: number) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roomId = roomId;
        this.existingShapes = [];
        this.socket = socket;
        this.clicked = false;
        this.currentPencilPath = [];
        this.onZoomChange = onZoomChange;

        this.init();
        this.initHandlers();
        this.initMouseHandlers();
        this.cleanupKeyboardZoom = this.initKeyboardZoom();
    }

    destroy() {
        window.removeEventListener("mousedown", this.mouseDownHandler);
        window.removeEventListener("mouseup", this.mouseUpHandler);
        window.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("wheel", this.handleZoom);
        this.cleanupKeyboardZoom?.();
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
        this.canvas.style.cursor = tool === "hand" ? "grab" : "crosshair";
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
            else if (shape.type === "line") {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
            }
            else if (shape.type === "arrow") {
                this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY);
            }
            else if (shape.type === "diamond") {
                this.drawDiamond(shape.x, shape.y, shape.width, shape.height);
            }


        });
    }

    mouseDownHandler = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;

        if (this.selectedTool === "hand") {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = "grabbing";
            return;
        }

        this.clicked = true;
        this.startX = x;
        this.startY = y;

        if (this.selectedTool === "pencil") {
            this.currentPencilPath = [{ x, y }];
        }
    };

    mouseUpHandler = (e: MouseEvent) => {
        if (this.selectedTool === "hand") {
            this.isPanning = false;
            this.canvas.style.cursor = "grab";
            return;
        }

        if (!this.clicked) return;

        this.clicked = false;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;

        const width = x - this.startX;
        const height = y - this.startY;

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
        else if (this.selectedTool === "line") {
            shape = {
                type: "line",
                startX: this.startX,
                startY: this.startY,
                endX: x,
                endY: y
            };
        }
        else if (this.selectedTool === "arrow") {
            shape = {
                type: "arrow",
                startX: this.startX,
                startY: this.startY,
                endX: x,
                endY: y
            };
        }
        else if (this.selectedTool === "diamond") {
            shape = {
                type: "diamond",
                x: this.startX,
                y: this.startY,
                width,
                height
            };
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
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        const x = (canvasX - this.offsetX) / this.scale;
        const y = (canvasY - this.offsetY) / this.scale;

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

        this.clearCanvas();

        const width = x - this.startX;
        const height = y - this.startY;

        if (this.selectedTool === "rect") {

            this.ctx.strokeRect(
                width < 0 ? x : this.startX,
                height < 0 ? y : this.startY,
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
            this.currentPencilPath.push({ x, y });
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentPencilPath[0].x, this.currentPencilPath[0].y);
            for (let i = 1; i < this.currentPencilPath.length; i++) {
                this.ctx.lineTo(this.currentPencilPath[i].x, this.currentPencilPath[i].y);
            }
            this.ctx.stroke();
        }
        else if (this.selectedTool === "line") {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
        else if (this.selectedTool === "arrow") {
            this.drawArrow(this.startX, this.startY, x, y);
        }
        else if (this.selectedTool === "diamond") {
            this.drawDiamond(this.startX, this.startY, width, height);
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

        let newScale = this.scale * factor;
        newScale = Math.min(Math.max(newScale, 0.5), 4.0);

        this.scale = newScale;
        this.offsetX = mouseX - worldX * this.scale;
        this.offsetY = mouseY - worldY * this.scale;

        this.clearCanvas();
        this.onZoomChange?.(this.scale);
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
        this.onZoomChange?.(this.scale);
    }

    initMouseHandlers() {
        window.addEventListener("mousedown", this.mouseDownHandler);
        window.addEventListener("mouseup", this.mouseUpHandler);
        window.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("wheel", this.handleZoom);
    }

    initKeyboardZoom() {
        const keyHandler = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === "=" || e.key === "+" || e.key === "-")) {
                e.preventDefault();

                const factor = e.key === "-" ? 1 / 1.1 : 1.1;
                this.applyZoom(factor);
            }
        };

        window.addEventListener("keydown", keyHandler);
        return () => window.removeEventListener("keydown", keyHandler);
    }

    zoomIn() {
        this.applyZoom(1.1);
    }

    zoomOut() {
        this.applyZoom(1 / 1.1);
    }

    applyZoom(factor: number) {
        const canvasCenterX = this.canvas.width / 2;
        const canvasCenterY = this.canvas.height / 2;

        const worldX = (canvasCenterX - this.offsetX) / this.scale;
        const worldY = (canvasCenterY - this.offsetY) / this.scale;

        let newScale = this.scale * factor;
        newScale = Math.min(Math.max(newScale, 0.5), 4.0);

        this.scale = newScale;
        this.offsetX = canvasCenterX - worldX * this.scale;
        this.offsetY = canvasCenterY - worldY * this.scale;

        this.clearCanvas();
        this.onZoomChange?.(this.scale);
    }

    getScale() { return this.scale; }
    getOffset() { return { x: this.offsetX, y: this.offsetY }; }
    getShapes() { return this.existingShapes; }

    getDrawnBounds() {
        if (this.existingShapes.length === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const shape of this.existingShapes) {
            if (shape.type === "rect" || shape.type === "circle") {
                const x1 = Math.min(shape.x, shape.x + shape.width);
                const y1 = Math.min(shape.y, shape.y + shape.height);
                const x2 = Math.max(shape.x, shape.x + shape.width);
                const y2 = Math.max(shape.y, shape.y + shape.height);
                minX = Math.min(minX, x1);
                minY = Math.min(minY, y1);
                maxX = Math.max(maxX, x2);
                maxY = Math.max(maxY, y2);
            } else if (shape.type === "pencil") {
                for (const point of shape.points) {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                }
            }
            else if (shape.type === "line") {
                minX = Math.min(minX, shape.startX, shape.endX);
                minY = Math.min(minY, shape.startY, shape.endY);
                maxX = Math.max(maxX, shape.startX, shape.endX);
                maxY = Math.max(maxY, shape.startY, shape.endY);
            }
            else if (shape.type === "arrow") {
                minX = Math.min(minX, shape.startX, shape.endX);
                minY = Math.min(minY, shape.startY, shape.endY);
                maxX = Math.max(maxX, shape.startX, shape.endX);
                maxY = Math.max(maxY, shape.startY, shape.endY);
            }
            else if (shape.type === "diamond") {
                const x1 = Math.min(shape.x, shape.x + shape.width);
                const y1 = Math.min(shape.y, shape.y + shape.height);
                const x2 = Math.max(shape.x, shape.x + shape.width);
                const y2 = Math.max(shape.y, shape.y + shape.height);
                minX = Math.min(minX, x1);
                minY = Math.min(minY, y1);
                maxX = Math.max(maxX, x2);
                maxY = Math.max(maxY, y2);
            }



        }

        return { minX, minY, maxX, maxY };
    }

    private drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const headLength = 10;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.lineTo(toX, toY);
        this.ctx.closePath();
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.fill();
    }
    private drawDiamond(x: number, y: number, width: number, height: number) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, y);
        this.ctx.lineTo(x + width, centerY);
        this.ctx.lineTo(centerX, y + height);
        this.ctx.lineTo(x, centerY);
        this.ctx.closePath();
        this.ctx.stroke();
    }


}
