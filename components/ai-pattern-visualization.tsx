"use client"

import { useState, useEffect } from "react"
import { format, subMonths } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
} from "recharts"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { Brain, RefreshCw, Calendar, Info, AlertTriangle, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { SymptomEntry, MedicationEntry } from "@/components/symptom-tracker"

interface AIPatternVisualizationProps {
  symptoms: SymptomEntry[]
  medications: MedicationEntry[]
  symptomTypes: string[]
}

type PatternType = "weekly" | "monthly" | "weather" | "medication" | "custom"
type TimeRange = 3 | 6 | 12 | 24

interface PatternData {
  type: PatternType
  title: string
  description: string
  chartType: "line" | "bar" | "scatter" | "radar" | "composed"
  data: any[]
  insights: string[]
  confidence: number
}

export default function AIPatternVisualization({ symptoms, medications, symptomTypes }: AIPatternVisualizationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patternData, setPatternData] = useState<PatternData[]>([])
  const [activePattern, setActivePattern] = useState<PatternType>("weekly")
  const [timeRange, setTimeRange] = useState<TimeRange>(6)
  const [showConfidenceScores, setShowConfidenceScores] = useState(false)

  // Generate visualizations when component mounts or when time range changes
  useEffect(() => {
    if (symptoms.length >= 10) {
      generateVisualizations()
    }
  }, [timeRange])

  const generateVisualizations = async () => {
    if (symptoms.length < 10) {
      setError("At least 10 symptom entries are needed to generate pattern visualizations.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Filter symptoms based on time range
      const cutoffDate = subMonths(new Date(), timeRange)
      const filteredSymptoms = symptoms.filter((s) => s.date >= cutoffDate)

      if (filteredSymptoms.length < 10) {
        setError(
          `Not enough data in the selected time range. You have ${filteredSymptoms.length} entries in the last ${timeRange} months.`,
        )
        setIsLoading(false)
        return
      }

      // Prepare data for the AI
      const symptomData = filteredSymptoms.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        day: format(s.date, "EEEE"),
        month: format(s.date, "MMMM"),
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
      }))

      // Create a summary of medication data
      const medicationData = medications
        .filter((m) => {
          // Only include medications that overlap with the time range
          const startDate = new Date(m.startDate)
          const endDate = m.endDate ? new Date(m.endDate) : new Date()
          return startDate <= new Date() && endDate >= cutoffDate
        })
        .map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          startDate: m.startDate.toISOString().split("T")[0],
          endDate: m.endDate ? m.endDate.toISOString().split("T")[0] : "ongoing",
        }))

      // Generate the prompt for the AI
      const prompt = `
          You are an AI specializing in medical data analysis and visualization. Analyze the following patient symptom data and generate visualizations that reveal patterns over time.
          
          SYMPTOM DATA (last ${timeRange} months):
          ${JSON.stringify(symptomData, null, 2)}
          
          MEDICATION DATA:
          ${JSON.stringify(medicationData, null, 2)}
          
          TRACKED SYMPTOM TYPES:
          ${JSON.stringify(symptomTypes, null, 2)}
          
          Generate 4 different visualizations that reveal different patterns in the data:
          1. Weekly patterns (day of week correlations)
          2. Monthly/seasonal patterns
          3. Weather correlation patterns
          4. Medication impact patterns
          
          For each visualization, provide:
          1. A title
          2. A brief description of what the visualization shows
          3. The chart type that would best display this pattern (choose from: line, bar, scatter, radar, composed)
          4. The processed data for the visualization in JSON format
          5. 2-3 key insights revealed by this pattern
          6. A confidence score (0-100) indicating how strong this pattern is in the data
          
          Format your response as a valid JSON array with objects for each visualization. Example:
          [
            {
              "type": "weekly",
              "title": "Weekly Symptom Pattern",
              "description": "Shows how symptoms vary by day of the week",
              "chartType": "bar",
              "data": [{"day": "Monday", "severity": 2.1, ...}, ...],
              "insights": ["Symptoms tend to be worse on Mondays", "Weekends show lower severity scores"],
              "confidence": 75
            },
            ...
          ]
          
          IMPORTANT: Your response MUST be a valid JSON array that can be parsed with JSON.parse(). Do not include any text before or after the JSON array.
          
          Focus on finding real patterns in the data. If a pattern is weak or not present, assign a lower confidence score.
          Ensure the data is properly formatted for direct use in charts.
        `

      // Call Groq API
      const { text } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt,
        system:
          "You are a medical data analysis AI specializing in finding patterns in symptom data. You always return valid JSON that can be parsed directly. Never include explanatory text outside the JSON structure.",
      })

      try {
        // Try to parse the response as JSON
        let jsonText = text.trim()

        // Check if the response starts with text instead of JSON
        const jsonStartIndex = jsonText.indexOf("[")
        if (jsonStartIndex > 0) {
          // Extract only the JSON part
          jsonText = jsonText.substring(jsonStartIndex)
        }

        // Find where the JSON array ends
        const jsonEndIndex = jsonText.lastIndexOf("]")
        if (jsonEndIndex > 0) {
          jsonText = jsonText.substring(0, jsonEndIndex + 1)
        }

        // Parse the cleaned JSON
        const parsedData = JSON.parse(jsonText)
        setPatternData(parsedData)

        // Set active pattern to the one with highest confidence
        const highestConfidencePattern = parsedData.reduce(
          (prev: PatternData, current: PatternData) => (current.confidence > prev.confidence ? current : prev),
          parsedData[0],
        )
        setActivePattern(highestConfidencePattern.type)
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError, "Raw response:", text)

        // Create fallback visualization data if parsing fails
        const fallbackData = [
          {
            type: "weekly",
            title: "Weekly Symptom Pattern",
            description: "Shows how symptoms vary by day of the week",
            chartType: "bar",
            data: symptomData.reduce((acc: any, curr) => {
              const day = format(new Date(curr.date), "EEEE")
              if (!acc.find((item: any) => item.day === day)) {
                acc.push({
                  day,
                  severity: curr.severity,
                  count: 1,
                })
              } else {
                const item = acc.find((item: any) => item.day === day)
                item.severity = (item.severity * item.count + curr.severity) / (item.count + 1)
                item.count += 1
              }
              return acc
            }, []),
            insights: [
              "This visualization shows your symptom patterns by day of week",
              "The data is based on your recorded symptoms",
            ],
            confidence: 60,
          },
        ]

        setPatternData(fallbackData)
        setActivePattern("weekly")
        setError("AI response could not be processed correctly. Showing simplified visualization instead.")
      }
    } catch (err) {
      console.error("Error generating visualizations:", err)
      setError("Failed to generate visualizations. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Get the currently active pattern data
  const activePatternData = patternData.find((p) => p.type === activePattern)

  // Render the appropriate chart based on the pattern type and chart type
  const renderChart = (pattern: PatternData) => {
    if (!pattern || !pattern.data || pattern.data.length === 0) {
      return <div className="h-[300px] flex items-center justify-center">No data available</div>
    }

    switch (pattern.chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pattern.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={pattern.type === "weekly" ? "day" : pattern.type === "monthly" ? "month" : "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="severity" stroke="#7c3aed" strokeWidth={2} />
              {pattern.data[0]?.frequency && (
                <Line type="monotone" dataKey="frequency" stroke="#10b981" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pattern.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={pattern.type === "weekly" ? "day" : pattern.type === "monthly" ? "month" : "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="severity" fill="#7c3aed" />
              {pattern.data[0]?.count && <Bar dataKey="count" fill="#10b981" />}
            </BarChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey={pattern.type === "weather" ? "temperature" : "value"}
                name={pattern.type === "weather" ? "Temperature" : "Value"}
              />
              <YAxis type="number" dataKey="severity" name="Severity" />
              <ZAxis type="category" dataKey="name" name="Name" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter name="Symptoms" data={pattern.data} fill="#7c3aed" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pattern.data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar name="Severity" dataKey="severity" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
              {pattern.data[0]?.frequency && (
                <Radar name="Frequency" dataKey="frequency" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              )}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case "composed":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={pattern.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#7c3aed" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="severity" fill="#7c3aed" />
              <Line yAxisId="right" type="monotone" dataKey="frequency" stroke="#10b981" />
              {pattern.data[0]?.trend && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="trend"
                  fill="#8884d8"
                  stroke="#8884d8"
                  fillOpacity={0.3}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="h-[300px] flex items-center justify-center">Unsupported chart type</div>
    }
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Pattern Visualization
            </CardTitle>
            <CardDescription>Discover hidden patterns in your symptom data</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={timeRange.toString()}
              onValueChange={(value) => setTimeRange(Number.parseInt(value) as TimeRange)}
            >
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={generateVisualizations}
              disabled={isLoading || symptoms.length < 10}
              className="flex items-center gap-2"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              {isLoading ? "Analyzing..." : "Generate"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {symptoms.length < 10 ? (
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Not Enough Data
            </AlertTitle>
            <AlertDescription>Log at least 10 symptom entries to generate AI pattern visualizations.</AlertDescription>
          </Alert>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Analyzing your symptom patterns...</p>
            <Skeleton className="h-[300px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : patternData.length > 0 ? (
          <div className="space-y-4">
            <Tabs value={activePattern} onValueChange={(value) => setActivePattern(value as PatternType)}>
              <TabsList className="w-full">
                {patternData.map((pattern) => (
                  <TabsTrigger key={pattern.type} value={pattern.type} className="flex items-center gap-1">
                    {pattern.type === "weekly" && <Calendar className="h-4 w-4" />}
                    {pattern.type === "monthly" && <Calendar className="h-4 w-4" />}
                    {pattern.type === "weather" && <Cloud className="h-4 w-4" />}
                    {pattern.type === "medication" && <Pill className="h-4 w-4" />}
                    {pattern.type === "custom" && <TrendingUp className="h-4 w-4" />}
                    <span className="hidden sm:inline">{pattern.title}</span>
                    <span className="sm:hidden">{pattern.type.charAt(0).toUpperCase()}</span>
                    {showConfidenceScores && (
                      <Badge
                        variant="outline"
                        className={`ml-1 ${
                          pattern.confidence >= 70
                            ? "bg-green-50"
                            : pattern.confidence >= 40
                              ? "bg-yellow-50"
                              : "bg-red-50"
                        }`}
                      >
                        {pattern.confidence}%
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {patternData.map((pattern) => (
                <TabsContent key={pattern.type} value={pattern.type} className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{pattern.title}</h3>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <Info className="h-4 w-4" />
                            <span className="hidden sm:inline">Details</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Pattern Details</h4>
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span>Pattern Type:</span>
                                <span className="font-medium">{pattern.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Chart Type:</span>
                                <span className="font-medium">{pattern.chartType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Confidence Score:</span>
                                <span
                                  className={`font-medium ${
                                    pattern.confidence >= 70
                                      ? "text-green-600"
                                      : pattern.confidence >= 40
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {pattern.confidence}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Data Points:</span>
                                <span className="font-medium">{pattern.data.length}</span>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {renderChart(pattern)}

                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium">Key Insights</h4>
                      <ul className="space-y-2">
                        {pattern.insights.map((insight, index) => (
                          <li key={index} className="flex gap-2 text-sm">
                            <span className="text-primary">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Click "Generate" to analyze your symptom patterns over time.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Our AI will identify patterns and visualize them to help you better understand your condition.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Pattern visualizations are generated using AI and should be interpreted with caution.
        </p>
        <div className="flex items-center gap-2">
          <Switch id="show-confidence" checked={showConfidenceScores} onCheckedChange={setShowConfidenceScores} />
          <Label htmlFor="show-confidence" className="text-xs">
            Show confidence scores
          </Label>
        </div>
      </CardFooter>
    </Card>
  )
}

// Helper function to get icon based on weather description
function getWeatherIcon(description: string) {
  if (!description) return <Cloud className="h-4 w-4" />

  const desc = description.toLowerCase()
  if (desc.includes("rain") || desc.includes("shower")) return <CloudRain className="h-4 w-4" />
  if (desc.includes("thunder")) return <CloudLightning className="h-4 w-4" />
  if (desc.includes("clear")) return <Sun className="h-4 w-4" />
  if (desc.includes("cloud")) return <Cloud className="h-4 w-4" />
  if (desc.includes("snow")) return <CloudSnow className="h-4 w-4" />
  if (desc.includes("fog") || desc.includes("mist")) return <CloudFog className="h-4 w-4" />

  return <Cloud className="h-4 w-4" />
}

// Import missing Lucide icons
import { Cloud, CloudRain, CloudLightning, Sun, CloudSnow, CloudFog, Pill } from "lucide-react"
