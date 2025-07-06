"use client"
import { isUserSignedIn } from "@/utils/UserSignin";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react"

type Rooms = {
    slug: string;
    id: number;
    createdAt: Date;
    adminId: string;
}

export default function Room() {
    const [signedIn, setSignedIn] = useState<boolean | null>(null);
    const [rooms, setRooms] = useState<Rooms[]>([]);
    const router = useRouter();
    const roomRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        (async () => {
            const result = await isUserSignedIn();
            console.log("User signed in?", result);
            setSignedIn(result);
        })()
    }, [])
    useEffect(() => {
        if (!signedIn) return;

        (async () => {
            const fetchedRooms = await getRoomList();
            if (fetchedRooms) {
                setRooms(fetchedRooms);
            }
        })();
    }, [signedIn]);


    useEffect(() => {
        if (!signedIn) {
            return;
        }
        const result = getRoomList();


    }, []);

    const getRoomList = async () => {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roomlist`, {
            headers: {
                Authorization: localStorage.getItem("token")
            }
        });
        if (response.data.success === true) {
            return response.data.rooms
        }
        return null;

    };
    const onClick = async () => {
        const room = roomRef.current?.value?.trim();
        if (!room) {
            alert("Please enter a room name");
            return;
        }

        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/room`,
                { name: room },
                {
                    headers: {
                        Authorization: `${localStorage.getItem("token")}`,
                    },
                }
            );

            if (result.data.roomId) {
                alert(`Room "${room}" created with ID: ${result.data.roomId}`);
            } else {
                alert("Error: Unexpected response");
            }
        } catch (err: any) {
            alert(err.response?.data?.message ?? "Failed to create room");
        }
    };

    if (signedIn === null) return <div>Loading auth...</div>;

    if (signedIn === true) return (
        <div>
            <div>Hello from room</div>
            <div>
                <input ref={roomRef} className="border-2 " type="text" />
                <button onClick={onClick} className="bg-slate-200">create room</button>
            </div>
            <div>{rooms.map((room,index)=>(
                <button onClick={()=>{router.push(`/canvas/${room.id}`)}}>{room.slug}</button>
            ))}</div>
        </div>
    )
}