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

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roomId = roomId;
        this.existingShapes = [];
        this.socket = socket
        this.clicked = false;
        this.currentPencilPath = [];
        this.init();
        this.initHandlers();
        this.initMouseHandlers();


    }

    destroy(){
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExisitingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            }
        }
    }

    clearCanvas() {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.existingShapes.map((shape) => {
            this.ctx.strokeStyle = "black";
            if (shape.type === "rect") {
                const width = shape.width;
                const height = shape.height;

                const absWidth = Math.abs(width);
                const absHeight = Math.abs(height);

                const x = width < 0 ? shape.x + width : shape.x;
                const y = height < 0 ? shape.y + height : shape.y;

                this.ctx.strokeRect(x, y, absWidth, absHeight);
            } else if (shape.type === "circle") {
                const width = shape.width;
                const height = shape.height;

                const absWidth = Math.abs(width);
                const absHeight = Math.abs(height);

                const centerX = shape.x + width / 2;
                const centerY = shape.y + height / 2;

                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY, absWidth / 2, absHeight / 2, 0, 0, 2 * Math.PI);
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

    mouseDownHandler=(e)=> {
        this.clicked = true;
        this.startX = e.clientX
        this.startY = e.clientY
        if (this.selectedTool === "pencil") {
            this.currentPencilPath = [{ x: e.offsetX, y: e.offsetY }];
        }
    }

    mouseUpHandler=(e)=> {
        this.clicked = false;
        const width = e.clientX - this.startX
        const height = e.clientY - this.startY
        //@ts-ignore
        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        if (selectedTool === "rect" || selectedTool === "circle") {
            shape = {
                type: selectedTool,
                x: this.startX,
                y: this.startY,
                width: width,
                height: height

            };

        }
        else if (selectedTool === "pencil") {
            shape = {
                type: "pencil",
                points: this.currentPencilPath
            };
            this.currentPencilPath = [];
        }
        if (!shape) {
            return;
        }
        this.existingShapes.push(shape);
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId
        }));
    }

    mouseMoveHandler=(e)=> {
        if (this.clicked) {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;

            const absWidth = Math.abs(width);
            const absHeight = Math.abs(height);

            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;

            this.clearCanvas();

            const selectedTool = this.selectedTool;

            if (selectedTool === "rect") {
                this.ctx.strokeRect(
                    width < 0 ? e.clientX : this.startX,
                    height < 0 ? e.clientY : this.startY,
                    absWidth,
                    absHeight
                );
            } else if (selectedTool === "circle") {
                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY, absWidth / 2, absHeight / 2, 0, 0, 2 * Math.PI);
                this.ctx.stroke();
            } else if (selectedTool === "pencil") {
                this.currentPencilPath.push({ x: e.offsetX, y: e.offsetY });
                this.ctx.beginPath();
                this.ctx.moveTo(this.currentPencilPath[0].x, this.currentPencilPath[0].y);
                for (let i = 1; i < this.currentPencilPath.length; i++) {
                    this.ctx.lineTo(this.currentPencilPath[i].x, this.currentPencilPath[i].y);
                }
                this.ctx.stroke();
            }
        }
    }

    initMouseHandlers() {
        this.ctx.strokeStyle = "black";


        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)
    }

}