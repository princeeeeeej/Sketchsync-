"use client"
import { Button } from "@repo/ui/Button";
const AuthPage = ({isSignIn}: {isSignIn : boolean}) =>{
    return (
        <div className="flex  justify-center items-center w-screen h-screen bg-black">
            <div className="bg-white flex flex-col justify-center items-center rounded-2xl p-3">
                <div className="p-2 m-2 rounded">
                <h1 className="text-4xl font-bold">{isSignIn ? "Sign In" : "Sign Up"}</h1>
            </div>
            <div className="p-5 m-2 rounded flex flex-col gap-2">
                <input type="text" placeholder="Username" className="border border-gray-300 rounded-[8px] px-7 py-3" />
                <input type="password" placeholder="Password" className="border border-gray-300 rounded-[8px] px-7 py-3" />
                <Button className="bg-blue-500 text-white px-5 py-3 rounded-[8px] mt-2" >{isSignIn ? "Sign In" : "Sign Up"}</Button>
            </div>
            </div>
        </div>
    )
}

export default AuthPage;