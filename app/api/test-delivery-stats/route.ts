import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("Attempting to insert test delivery stats...")

    const testData = {
      platform: "PedidosYa",
      week: 1,
      year: 2024,
      order_count: 150,
      revenue: 3000,
      complaints: 2,
      rating: 4.5,
      local: "BR Cabildo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Test data:", testData)

    const { data, error } = await supabase.from("delivery_stats").insert(testData).select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Successfully inserted data:", data)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

