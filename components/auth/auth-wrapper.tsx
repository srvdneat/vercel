"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user has previously "signed in" (stored in localStorage)
    const authStatus = localStorage.getItem("demo_auth_status")
    if (authStatus === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleDemoSignIn = () => {
    localStorage.setItem("demo_auth_status", "authenticated")
    setIsAuthenticated(true)
  }

  const handleSignOut = () => {
    localStorage.removeItem("demo_auth_status")
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
        <div className="floating-orbs"></div>
        <div className="w-full max-w-md mb-8 text-center">
          <h1 className="text-3xl font-light tracking-wide mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Inflammatory Disease Companion
          </h1>
          <p className="text-white/60">Track, analyze, and manage your inflammatory disease symptoms</p>
        </div>

        <Card className="w-full max-w-md glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-light text-white">Demo Access</CardTitle>
            <CardDescription className="text-center text-white/60">
              Click below to access the symptom tracker demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDemoSignIn} className="w-full glass-button border-white/20 hover:glow-primary">
              Enter Demo
            </Button>
            <p className="text-xs text-white/40 mt-4 text-center">
              This is a demo version. Your data will be stored locally in your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {children}
      {/* Add sign out option in the header */}
      <style jsx global>{`
        .demo-sign-out {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 50;
        }
      `}</style>
      <Button onClick={handleSignOut} className="demo-sign-out">
        Sign Out
      </Button>
    </>
  )
}
