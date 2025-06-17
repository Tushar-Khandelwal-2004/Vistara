"use client"
import SigninForm from "@/components/signinform";
import axios from "axios";
import { useRef, useState } from "react";

export default function Signin() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const onclick = async () => {
        const username = emailRef.current?.value || "";
        const password = passwordRef.current?.value || "";
        setLoading(true);
        try {
            const res = await axios.post(`${BACKEND_URL}/signin`, {
                username,
                password,
            });

            console.log("res.data", res.data);
            if (res.data.token) {
                alert(res.data.token)
            }

        } catch (err: any) {
            console.error(err.response?.data?.message || "Signin failed");
        }
        if (emailRef.current) emailRef.current.value = "";
        if (passwordRef.current) passwordRef.current.value = "";
        setLoading(false);

    }
    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <SigninForm loading={loading} passwordRef={passwordRef} emailRef={emailRef} onclick={onclick} />
        </div>
    )
}