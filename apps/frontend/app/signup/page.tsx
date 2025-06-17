"use client"
import SignupForm from "@/components/signup-form-demo";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef } from "react";
export default function Signup() {
    const router = useRouter();
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const onclick = async () => {
        const name = nameRef.current?.value || "";
        const username = emailRef.current?.value || "";
        const password = passwordRef.current?.value || "";

        try {
            const res = await axios.post(`${BACKEND_URL}/signup`, {
                name,
                username,
                password,
            });

            console.log("res.data", res.data);
            if (res.data.userId) {
                router.push("/signin");
            }
        } catch (err: any) {
            console.error(err.response?.data?.message || "Signup failed");
        }

        if (nameRef.current) nameRef.current.value = "";
        if (emailRef.current) emailRef.current.value = "";
        if (passwordRef.current) passwordRef.current.value = "";

    }
    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <SignupForm nameRef={nameRef} passwordRef={passwordRef} emailRef={emailRef} onclick={onclick} />
        </div>
    );
}