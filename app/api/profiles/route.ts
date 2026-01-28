import { NextResponse } from "next/server";
import path from "path";
import { readdir } from "fs/promises";

export async function GET() {
  try {
    const profilesDir = path.join(process.cwd(), "public", "profiles");
    const entries = await readdir(profilesDir);
    const profiles = entries
      .filter((entry) => entry.toLowerCase().endsWith(".png"))
      .map((entry) => entry.slice(0, -4))
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Failed to load profiles:", error);
    return NextResponse.json({ profiles: [] });
  }
}
