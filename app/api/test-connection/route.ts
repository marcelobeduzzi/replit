import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test the connection by trying to fetch a count of users
    const { data, error } = await supabase.from("users").select("*", { count: "exact" })

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase!",
      data: { count: data.length },
    })
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to Supabase",
      },
      { status: 500 },
    )
  }
}

