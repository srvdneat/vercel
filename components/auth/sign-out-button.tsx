"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  // Initialize Supabase client with explicit URL and key from environment variables
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.healthmod_NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.healthmod_NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      className="text-muted-foreground hover:text-foreground"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sign Out</span>
        </>
      )}
    </Button>
  )
}
