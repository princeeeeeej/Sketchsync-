import { Button } from "@repo/ui/Button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex gap-5 text-white">
      <h1 className="text-2xl font-bold text-black">SketchSync</h1>
      <Link href="/room"><Button className="py-1 px-3 bg-black rounded-2xl">Create Room</Button></Link>
      <Link href="/signin"><Button className="py-1 px-3 bg-black rounded-2xl">Join Room</Button></Link>
      <Link href="/signin"><Button className="py-1 px-3 bg-black rounded-2xl">Sign in</Button></Link>
      <Link href="/signup"><Button className="py-1 px-3 bg-black rounded-2xl">Sign up</Button></Link>
    </div>
  )
}
