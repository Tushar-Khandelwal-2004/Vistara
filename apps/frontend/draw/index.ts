import axios from "axios";

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

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {

    const ctx = canvas.getContext("2d");

    let existingShapes: Shape[] = await getExisitingShapes(roomId);
    let currentPencilPath: { x: number; y: number }[] = [];

    if (!ctx) {
        return;
    }

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type == "chat") {
            const parsedShape = JSON.parse(message.message)
            existingShapes.push(parsedShape.shape)
            clearCanvas(existingShapes, canvas, ctx);
        }
    }

    clearCanvas(existingShapes, canvas, ctx);

    ctx.strokeStyle = "black";


    let clicked = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.clientX
        startY = e.clientY
        //@ts-ignore
        if (window.selectedTool === "pencil") {
            currentPencilPath = [{ x: e.offsetX, y: e.offsetY }];
        }
    })

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        const width = e.clientX - startX
        const height = e.clientY - startY
        //@ts-ignore
        const selectedTool = window.selectedTool;
        if (selectedTool === "rect" || selectedTool === "circle") {
            const shape: Shape = {
                type: selectedTool,
                x: startX,
                y: startY,
                width: width,
                height: height

            };
            existingShapes.push(shape)

            socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: roomId
            }))
        }
        else if (selectedTool === "pencil") {
            const shape: Shape = {
                type: "pencil",
                points: currentPencilPath
            };
            existingShapes.push(shape);
            socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: roomId
            }));
            currentPencilPath = [];
        }
    })

    canvas.addEventListener("mousemove", (e) => {
        // if (clicked) {
        //     const width = e.clientX - startX
        //     const height = e.clientY - startY
        //     clearCanvas(existingShapes, canvas, ctx);
        //     //@ts-ignore
        //     const selectedTool=window.selectedTool;
        //     if(selectedTool==="rect"){
        //         ctx.strokeRect(startX, startY, width, height);
        //     }
        //     else if(selectedTool==="circle"){
        //         const centerX=startX+width/2;
        //         const centerY=startY+height/2;
        //         ctx.beginPath();
        //         ctx.ellipse(centerX,centerY,width/2,height/2,0,0,2*Math.PI);
        //         ctx.stroke();
        //     }
        //     else if(selectedTool==="pencil"){

        //     }


        // }
        if (clicked) {
            const width = e.clientX - startX;
            const height = e.clientY - startY;

            const absWidth = Math.abs(width);
            const absHeight = Math.abs(height);

            const centerX = startX + width / 2;
            const centerY = startY + height / 2;

            clearCanvas(existingShapes, canvas, ctx);

            // @ts-ignore
            const selectedTool = window.selectedTool;

            if (selectedTool === "rect") {
                ctx.strokeRect(
                    width < 0 ? e.clientX : startX,
                    height < 0 ? e.clientY : startY,
                    absWidth,
                    absHeight
                );
            } else if (selectedTool === "circle") {
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, absWidth / 2, absHeight / 2, 0, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (selectedTool === "pencil") {
                currentPencilPath.push({ x: e.offsetX, y: e.offsetY });
                ctx.beginPath();
                ctx.moveTo(currentPencilPath[0].x, currentPencilPath[0].y);
                for (let i = 1; i < currentPencilPath.length; i++) {
                    ctx.lineTo(currentPencilPath[i].x, currentPencilPath[i].y);
                }
                ctx.stroke();
            }
        }

    })

}

// function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height)

//     existingShapes.map((shape) => {
//         ctx.strokeStyle = "black";
//         if (shape.type === "rect") {
//             const width = shape.width;
//             const height = shape.height;

//             const absWidth = Math.abs(width);
//             const absHeight = Math.abs(height);

//             const centerX = shape.x + width / 2;
//             const centerY = shape.y + height / 2;
//             ctx.strokeRect(
//                 width < 0 ? e.clientX : startX,
//                 height < 0 ? e.clientY : startY,
//                 absWidth,
//                 absHeight
//             );
//         } else if (shape.type === "circle") {
//             const width = shape.width;
//             const height = shape.height;

//             const absWidth = Math.abs(width);
//             const absHeight = Math.abs(height);

//             const centerX = shape.x + width / 2;
//             const centerY = shape.y + height / 2;
//             ctx.beginPath();
//             ctx.ellipse(centerX, centerY, absWidth / 2, absHeight / 2, 0, 0, 2 * Math.PI);
//             ctx.stroke();
//         } else if (shape.type === "pencil") {
//             // Pencil logic...
//         }
//     })
// }

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    existingShapes.map((shape) => {
        ctx.strokeStyle = "black";
        if (shape.type === "rect") {
            const width = shape.width;
            const height = shape.height;

            const absWidth = Math.abs(width);
            const absHeight = Math.abs(height);

            const x = width < 0 ? shape.x + width : shape.x;
            const y = height < 0 ? shape.y + height : shape.y;

            ctx.strokeRect(x, y, absWidth, absHeight);
        } else if (shape.type === "circle") {
            const width = shape.width;
            const height = shape.height;

            const absWidth = Math.abs(width);
            const absHeight = Math.abs(height);

            const centerX = shape.x + width / 2;
            const centerY = shape.y + height / 2;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, absWidth / 2, absHeight / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (shape.type === "pencil") {
            const points = shape.points;
            if (points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }
    });
}

async function getExisitingShapes(roomId: string) {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chats/${roomId}`)
    const messages = res.data.messages;

    const shapes = messages.map((x: { message: string }) => {
        const messageData = JSON.parse(x.message)
        return messageData.shape
    })
    return shapes
}