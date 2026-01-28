import { Suspense } from "react";
import GameClient from "./GameClient";

export default function GamePage() {
  return (
    //fixes issues with npm run build, fixes issues with searchparams on build, a bit of hack for now
    <Suspense fallback={<div className="min-h-screen p-6">Loading...</div>}>
      <GameClient />
    </Suspense>
  );
}
