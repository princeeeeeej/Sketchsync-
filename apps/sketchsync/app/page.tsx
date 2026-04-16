import { Button } from "@repo/ui/Button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="text-white">
      SketchSync 
      <Link href="/signin"> 
          <Button className="bg-blue-500 text-white px-5 py-3 rounded-[8px] mt-2 cursor-pointer" >Sign In</Button>
      </Link>
      <Link href="/signup">
      <Button className="bg-blue-500 text-white px-5 py-3 rounded-[8px] mt-2 cursor-pointer" >Sign Up</Button>
      </Link>
    </div>
  );
}
