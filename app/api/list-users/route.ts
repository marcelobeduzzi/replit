import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Fetching all users...")
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 },
    )
  }
}

