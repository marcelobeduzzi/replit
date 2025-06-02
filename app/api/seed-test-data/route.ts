import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const testUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "hashed_password_here", // In production, this should be properly hashed
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Manager User",
    email: "manager@example.com",
    password: "hashed_password_here",
    role: "manager",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Employee User",
    email: "employee@example.com",
    password: "hashed_password_here",
    role: "employee",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Supervisor User",
    email: "supervisor@example.com",
    password: "hashed_password_here",
    role: "supervisor",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Cashier User",
    email: "cashier@example.com",
    password: "hashed_password_here",
    role: "cashier",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Use POST method to seed test data",
  })
}

export async function POST() {
  try {
    console.log("Starting seed-test-data process...")

    // First, check if users already exist
    console.log("Checking for existing users...")
    const { data: existingUsers, error: checkError } = await supabase.from("users").select("*")

    if (checkError) {
      console.error("Error checking existing users:", checkError)
      return NextResponse.json(
        {
          success: false,
          error: checkError.message,
          details: "Error occurred while checking for existing users",
        },
        { status: 500 },
      )
    }

    console.log("Existing users check completed:", existingUsers?.length || 0, "users found")

    // Insert new test users
    console.log("Inserting new test users...")
    const { data, error } = await supabase.from("users").insert(testUsers).select()

    if (error) {
      console.error("Error inserting test data:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Error occurred while inserting test users",
        },
        { status: 500 },
      )
    }

    console.log("Test data inserted successfully:", data)
    return NextResponse.json({
      success: true,
      message: "Test data inserted successfully",
      data,
    })
  } catch (err) {
    console.error("Unexpected error in seed-test-data:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to insert test data",
        details: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

