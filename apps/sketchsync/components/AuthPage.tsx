"use client"
import { BACKEND_URL } from "@/app/config";
import { useRouter } from "next/navigation";
import { useState } from "react";

const AuthPage = ({isSignIn}: {isSignIn : boolean}) =>{
    const router = useRouter()
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const handler = async () => {
        const response = await fetch(`${BACKEND_URL}/${isSignIn ? "signin" : "signup"}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                ...(isSignIn ? {} : { username })
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            router.push("/");
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Authentication failed");
        }
    }
    return (
        <div className="flex  justify-center items-center w-screen h-screen bg-black">
            <div className="bg-white flex flex-col justify-center items-center rounded-2xl p-3">
                <div className="p-2 m-2 rounded">
                <h1 className="text-4xl font-bold">{isSignIn ? "Sign In" : "Sign Up"}</h1>
            </div>
            <div className="p-5 m-2 rounded flex flex-col gap-2">
                <input type="text" placeholder="Email" className="border border-gray-300 rounded-[8px] px-7 py-3" onChange={(e) => setEmail(e.target.value)}/>
                {isSignIn ? null : <input type="text" placeholder="Username" className="border border-gray-300 rounded-[8px] px-7 py-3" onChange={(e) => setUsername(e.target.value)}/>}
                <input type="password" placeholder="Password" className="border border-gray-300 rounded-[8px] px-7 py-3" onChange={(e) => setPassword(e.target.value)}/>
                <button className="bg-blue-500 text-white px-5 py-3 rounded-[8px] mt-2" onClick={handler}>{isSignIn ? "Sign In" : "Sign Up"}</button>
            </div>
            </div>
        </div>
    )
}

export default AuthPage;