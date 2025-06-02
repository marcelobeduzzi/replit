import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const tablesToCheck = [
  "users",
  "employees",
  "attendance",
  "payroll",
  "payroll_details",
  "delivery_stats",
  "audit",
  "audit_items",
  "billing",
  "balance",
]

export async function GET() {
  try {
    const results = await Promise.all(
      tablesToCheck.map(async (table) => {
        const { data, error } = await supabase.from(table).select("count", { count: "exact" })

        return {
          table,
          exists: !error,
          error: error?.message,
          count: data?.length || 0,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      message: "Table check completed",
      data: results,
    })
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check tables",
      },
      { status: 500 },
    )
  }
}

