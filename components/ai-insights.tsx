"use client"

import { useState, useEffect } from "react"
import { Lightbulb, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generateAIInsights } from "@/actions/ai-actions"
import type { SymptomEntry, MedicationEntry } from "@/components/symptom-tracker"

interface AIInsightsProps {
  symptoms: SymptomEntry[]
  medications: MedicationEntry[]
  symptomTypes: string[]
}

export default function AIInsights({ symptoms, medications, symptomTypes }: AIInsightsProps) {
  const [insights, setInsights] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confidenceScores, setConfidenceScores] = useState<number[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Check if we have enough data for meaningful insights
  const hasEnoughData = symptoms.length >= 5

  // Auto-generate insights when component mounts if we have enough data
  useEffect(() => {
    if (hasEnoughData && insights.length === 0) {
      generateInsights()
    }
  }, [])

  const generateInsights = async () => {
    if (!hasEnoughData) {
      setError("At least 5 symptom entries are needed to generate insights.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare data for the AI
      const recentSymptoms = symptoms.slice(-30) // Last 30 entries

      // Create a summary of symptom data
      const symptomSummary = recentSymptoms.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        severity: s.severity,
        symptoms: Object.entries(s.symptoms)
          .filter(([_, present]) => present)
          .map(([name]) => name),
        weather: s.weather
          ? {
              temperature: s.weather.temperature,
              humidity: s.weather.humidity,
              description: s.weather.description,
            }
          : null,
        notes: s.notes,
      }))

      // Create a summary of medication data
      const medicationSummary = medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.startDate.toISOString().split("T")[0],
        endDate: m.endDate ? m.endDate.toISOString().split("T")[0] : "ongoing",
      }))

      // Call the server action
      const result = await generateAIInsights(symptomSummary, medicationSummary, symptomTypes)

      if (!result.success) {
        setError(result.error || "Failed to generate insights")
        return
      }

      try {
        // Try to parse the response as JSON
        const parsedResponse = JSON.parse(result.data)
        const insightList = parsedResponse.map((item: any) => item.insight)
        const confidenceList = parsedResponse.map((item: any) => item.confidence)

        setInsights(insightList)
        setConfidenceScores(confidenceList)
        setLastUpdated(new Date())
      } catch (parseError) {
        // If JSON parsing fails, fall back to text splitting
        console.error("Failed to parse AI response as JSON:", parseError)
        const insightList = result.data
          .split("\n\n")
          .filter((insight) => insight.trim().length > 0)
          .map((insight) => insight.trim())

        setInsights(insightList)
        setConfidenceScores(Array(insightList.length).fill(70)) // Default confidence
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error("Error generating insights:", err)
      setError("Failed to generate insights. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Get personalized insights about your condition</CardDescription>
          </div>
          <Button onClick={generateInsights} disabled={isLoading || !hasEnoughData} className="flex items-center gap-2">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
            {isLoading ? "Analyzing..." : "Generate Insights"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!hasEnoughData ? (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Log at least 5 symptom entries to generate AI insights about your condition.
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Analyzing your symptom and medication data...</p>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : insights.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-primary/5">
                      Insight {index + 1}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Info className="h-3 w-3" />
                            Confidence: {confidenceScores[index] || "N/A"}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Confidence score indicates how reliable this insight is based on your data
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm">{insight}</p>
                  {index < insights.length - 1 && <Separator className="my-2" />}
                </div>
              ))}

              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-4 text-right">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click "Generate Insights" to analyze your symptom and medication data.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Our AI will identify patterns and provide personalized recommendations.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          Insights are generated using AI and should not replace professional medical advice. Always consult with your
          healthcare provider before making changes to your treatment plan.
        </p>
      </CardFooter>
    </Card>
  )
}
