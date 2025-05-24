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
        // Parse the cleaned JSON response
        const parsedResponse = JSON.parse(result.data)

        if (Array.isArray(parsedResponse)) {
          const insightList = parsedResponse.map((item: any) => item.insight || item.text || String(item))
          const confidenceList = parsedResponse.map((item: any) => item.confidence || 70)

          setInsights(insightList)
          setConfidenceScores(confidenceList)
          setLastUpdated(new Date())
        } else {
          throw new Error("Response is not an array")
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)

        // Create fallback insights based on the data we have
        const fallbackInsights = generateFallbackInsights(symptomSummary, medicationSummary)
        setInsights(fallbackInsights.map((i) => i.insight))
        setConfidenceScores(fallbackInsights.map((i) => i.confidence))
        setLastUpdated(new Date())
        setError("AI response could not be processed. Showing basic analysis instead.")
      }
    } catch (err) {
      console.error("Error generating insights:", err)
      setError("Failed to generate insights. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Generate fallback insights when AI parsing fails
  const generateFallbackInsights = (symptoms: any[], medications: any[]) => {
    const insights = []

    if (symptoms.length > 0) {
      // Analyze severity trends
      const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length
      insights.push({
        insight: `Your average symptom severity over the last ${symptoms.length} entries is ${avgSeverity.toFixed(1)} out of 3. ${avgSeverity > 2 ? "Consider discussing treatment adjustments with your doctor." : "Your symptoms appear to be relatively well-managed."}`,
        confidence: 80,
      })

      // Analyze most common symptoms
      const symptomCounts: Record<string, number> = {}
      symptoms.forEach((s) => {
        s.symptoms.forEach((symptom: string) => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
        })
      })

      const mostCommon = Object.entries(symptomCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([name]) => name)

      if (mostCommon.length > 0) {
        insights.push({
          insight: `Your most frequently reported symptoms are ${mostCommon.join(" and ")}. Tracking these patterns can help identify triggers and treatment effectiveness.`,
          confidence: 75,
        })
      }
    }

    if (medications.length > 0) {
      insights.push({
        insight: `You're currently tracking ${medications.length} medication${medications.length > 1 ? "s" : ""}. Consistent medication tracking helps ensure optimal treatment outcomes.`,
        confidence: 70,
      })
    }

    // Add weather insight if available
    const weatherEntries = symptoms.filter((s) => s.weather)
    if (weatherEntries.length > 5) {
      insights.push({
        insight: `You have weather data for ${weatherEntries.length} symptom entries. This data can help identify weather-related triggers for your condition.`,
        confidence: 65,
      })
    }

    // Add general advice
    insights.push({
      insight: `Continue logging your symptoms regularly. The more data you collect, the better insights we can provide about your condition patterns.`,
      confidence: 90,
    })

    return insights.slice(0, 5) // Return max 5 insights
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
          <Alert variant={error.includes("basic analysis") ? "default" : "destructive"}>
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
