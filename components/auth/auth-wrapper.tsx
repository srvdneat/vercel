"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import AuthForm from "./auth-form"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize Supabase client with explicit URL and key from environment variables
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.healthmod_NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.healthmod_NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setIsAuthenticated(!!data.session)
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md mb-8">
          <h1 className="text-3xl text-center font-light tracking-wide mb-2">Inflammatory Disease Companion</h1>
          <p className="text-center text-muted-foreground">
            Track, analyze, and manage your inflammatory disease symptoms
          </p>
        </div>
        <AuthForm onSuccess={() => setIsAuthenticated(true)} />
      </div>
    )
  }

  return <>{children}</>
}
