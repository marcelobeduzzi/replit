import { testConnection } from "../lib/supabase"

async function main() {
  console.log("Testing Supabase connection...")
  const isConnected = await testConnection()
  if (isConnected) {
    console.log("✅ Successfully connected to Supabase!")
  } else {
    console.log("❌ Failed to connect to Supabase")
  }
  process.exit(isConnected ? 0 : 1)
}

main().catch(console.error)

