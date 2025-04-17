"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Cloud, CloudRain, Droplets, ArrowDown, ArrowUp, BarChart2, Wind, Sun, Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SymptomEntry } from "@/components/symptom-tracker"
import {
  fetchWeatherData,
  fetchWeatherForecast,
  fetchHistoricalWeather,
  getBrisbaneSeasonalInfo,
  getBrisbaneWeatherTriggers,
} from "@/lib/weather"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface WeatherDisplayProps {
  symptoms: SymptomEntry[]
  currentDate: Date
  onUpdateSymptom: (symptom: SymptomEntry) => void
}

export default function WeatherDisplay({ symptoms, currentDate, onUpdateSymptom }: WeatherDisplayProps) {
  const [currentWeather, setCurrentWeather] = useState<any>(null)
  const [forecast, setForecast] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [weatherCorrelation, setWeatherCorrelation] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("current")
  const [correlationView, setCorrelationView] = useState<"general" | "temperature" | "humidity" | "pressure">("general")
  const [seasonalInfo, setSeasonalInfo] = useState<any>(null)
  const [weatherTriggers, setWeatherTriggers] = useState<any[]>([])

  // Fetch current weather on component mount
  useEffect(() => {
    const getWeather = async () => {
      setIsLoading(true)
      try {
        const data = await fetchWeatherData()
        setCurrentWeather(data)

        const forecastData = await fetchWeatherForecast()
        setForecast(forecastData)

        // Get Brisbane seasonal information
        const seasonInfo = getBrisbaneSeasonalInfo()
        setSeasonalInfo(seasonInfo)

        // Get Brisbane weather triggers
        const triggers = getBrisbaneWeatherTriggers()
        setWeatherTriggers(triggers)
      } catch (error) {
        console.error("Failed to fetch Brisbane weather data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getWeather()
  }, [])

  // Calculate weather correlation with symptoms
  useEffect(() => {
    if (symptoms.length === 0) return

    // Get symptoms with weather data
    const symptomsWithWeather = symptoms.filter((s) => s.weather)

    if (symptomsWithWeather.length === 0) return

    // Group symptoms by weather conditions
    const weatherGroups: Record<string, { count: number; avgSeverity: number; entries: SymptomEntry[] }> = {}

    // Create data for specific correlations
    const temperatureData: any[] = []
    const humidityData: any[] = []
    const pressureData: any[] = []

    symptomsWithWeather.forEach((symptom) => {
      if (!symptom.weather?.description) return

      const weatherType = symptom.weather.description

      if (!weatherGroups[weatherType]) {
        weatherGroups[weatherType] = {
          count: 0,
          avgSeverity: 0,
          entries: [],
        }
      }

      weatherGroups[weatherType].count++
      weatherGroups[weatherType].avgSeverity += symptom.severity
      weatherGroups[weatherType].entries.push(symptom)

      // Add to specific correlation data
      if (symptom.weather.temperature) {
        temperatureData.push({
          temperature: symptom.weather.temperature,
          severity: symptom.severity,
          date: format(symptom.date, "MMM d"),
        })
      }

      if (symptom.weather.humidity) {
        humidityData.push({
          humidity: symptom.weather.humidity,
          severity: symptom.severity,
          date: format(symptom.date, "MMM d"),
        })
      }

      if (symptom.weather.pressure) {
        pressureData.push({
          pressure: symptom.weather.pressure,
          severity: symptom.severity,
          date: format(symptom.date, "MMM d"),
        })
      }
    })

    // Calculate average severity for each weather type
    Object.keys(weatherGroups).forEach((key) => {
      weatherGroups[key].avgSeverity = weatherGroups[key].avgSeverity / weatherGroups[key].count
    })

    // Convert to array for chart
    const correlationData = Object.entries(weatherGroups).map(([weather, data]) => ({
      weather,
      count: data.count,
      avgSeverity: Number.parseFloat(data.avgSeverity.toFixed(2)),
      entries: data.entries,
    }))

    // Sort by count
    correlationData.sort((a, b) => b.count - a.count)

    // Set all correlation data
    setWeatherCorrelation({
      general: correlationData,
      temperature: temperatureData,
      humidity: humidityData,
      pressure: pressureData,
    })
  }, [symptoms])

  // Update historical weather data for symptoms
  const updateHistoricalWeather = async () => {
    setIsLoading(true)

    try {
      // Get symptoms without weather data
      const symptomsWithoutWeather = symptoms.filter((s) => !s.weather)

      if (symptomsWithoutWeather.length === 0) {
        setIsLoading(false)
        return
      }

      // Get historical weather data for each symptom
      for (const symptom of symptomsWithoutWeather) {
        const historicalData = await fetchHistoricalWeather(symptom.date)

        if (historicalData) {
          // Update symptom with weather data
          const updatedSymptom = {
            ...symptom,
            weather: historicalData,
          }

          onUpdateSymptom(updatedSymptom)
        }
      }
    } catch (error) {
      console.error("Failed to update historical Brisbane weather data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get correlation insights
  const getCorrelationInsights = () => {
    if (!weatherCorrelation || !weatherCorrelation.general || weatherCorrelation.general.length === 0) {
      return null
    }

    const insights = []

    // Temperature insights
    if (weatherCorrelation.temperature && weatherCorrelation.temperature.length > 0) {
      const tempData = [...weatherCorrelation.temperature]
      tempData.sort((a, b) => b.severity - a.severity)

      const highTempSeverity = tempData.slice(0, Math.ceil(tempData.length / 3))
      const avgHighTemp = highTempSeverity.reduce((sum, item) => sum + item.temperature, 0) / highTempSeverity.length

      if (avgHighTemp > 25) {
        insights.push({
          factor: "Temperature",
          insight: "Higher temperatures appear to correlate with increased symptom severity",
          recommendation: "Consider planning activities during cooler parts of the day in Brisbane's summer",
        })
      } else if (avgHighTemp < 20) {
        insights.push({
          factor: "Temperature",
          insight: "Lower temperatures appear to correlate with increased symptom severity",
          recommendation: "Consider keeping warm during Brisbane's cooler months, especially in the evenings",
        })
      }
    }

    // Humidity insights
    if (weatherCorrelation.humidity && weatherCorrelation.humidity.length > 0) {
      const humidityData = [...weatherCorrelation.humidity]
      humidityData.sort((a, b) => b.severity - a.severity)

      const highHumiditySeverity = humidityData.slice(0, Math.ceil(humidityData.length / 3))
      const avgHighHumidity =
        highHumiditySeverity.reduce((sum, item) => sum + item.humidity, 0) / highHumiditySeverity.length

      if (avgHighHumidity > 65) {
        insights.push({
          factor: "Humidity",
          insight: "Higher humidity levels appear to correlate with increased symptom severity",
          recommendation: "Use air conditioning to reduce indoor humidity during Brisbane's humid periods",
        })
      }
    }

    // Pressure insights
    if (weatherCorrelation.pressure && weatherCorrelation.pressure.length > 0) {
      const pressureChanges = []
      const sortedByDate = [...weatherCorrelation.pressure].sort((a, b) => {
        return parseISO(a.date).getTime() - parseISO(b.date).getTime()
      })

      for (let i = 1; i < sortedByDate.length; i++) {
        const pressureChange = Math.abs(sortedByDate[i].pressure - sortedByDate[i - 1].pressure)
        const severityChange = sortedByDate[i].severity - sortedByDate[i - 1].severity

        if (pressureChange > 5 && severityChange > 0) {
          pressureChanges.push({
            date: sortedByDate[i].date,
            pressureChange,
            severityChange,
          })
        }
      }

      if (pressureChanges.length > 0) {
        insights.push({
          factor: "Barometric Pressure",
          insight: "Rapid changes in barometric pressure appear to correlate with symptom flares",
          recommendation: "Monitor weather forecasts for pressure changes, especially during Brisbane's storm season",
        })
      }
    }

    // Weather type insights
    if (weatherCorrelation.general && weatherCorrelation.general.length > 0) {
      const worstWeather = weatherCorrelation.general.sort((a, b) => b.avgSeverity - a.avgSeverity)[0]

      insights.push({
        factor: "Weather Condition",
        insight: `"${worstWeather.weather}" conditions appear to correlate with higher symptom severity`,
        recommendation: `Consider planning indoor activities during forecast ${worstWeather.weather} conditions`,
      })
    }

    return insights
  }

  const correlationInsights = getCorrelationInsights()

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>Brisbane Weather</CardTitle>
              <CardDescription>Weather data specific to Brisbane, Australia</CardDescription>
            </div>
            <Button onClick={updateHistoricalWeather} disabled={isLoading} size="sm">
              Update Historical Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b p-0">
              <TabsTrigger
                value="current"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Current Weather
              </TabsTrigger>
              <TabsTrigger
                value="forecast"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Forecast
              </TabsTrigger>
              <TabsTrigger
                value="correlation"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Symptom Correlation
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Brisbane Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="p-4">
              {currentWeather ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg">
                    <div className="text-lg font-medium mb-1">Brisbane, Queensland</div>
                    <div className="flex items-center justify-center mb-4">
                      {currentWeather.icon && (
                        <img
                          src={`https://openweathermap.org/img/wn/${currentWeather.icon}@2x.png`}
                          alt="Weather icon"
                          className="w-20 h-20"
                        />
                      )}
                      <div className="text-4xl font-bold">
                        {currentWeather.temperature && `${currentWeather.temperature}°C`}
                      </div>
                    </div>
                    <div className="text-lg capitalize mb-4">{currentWeather.description}</div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="flex items-center">
                        <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                        <span>Humidity: {currentWeather.humidity}%</span>
                      </div>
                      <div className="flex items-center">
                        <Cloud className="h-5 w-5 mr-2 text-gray-500" />
                        <span>Pressure: {currentWeather.pressure} hPa</span>
                      </div>
                      <div className="flex items-center">
                        <Wind className="h-5 w-5 mr-2 text-blue-400" />
                        <span>Wind: {currentWeather.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center">
                        <Sun className="h-5 w-5 mr-2 text-yellow-500" />
                        <span>UV Index: {currentWeather.uvIndex}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Brisbane Weather & Your Symptoms</h3>

                    {seasonalInfo && (
                      <Alert className="bg-primary/5 border-primary/20">
                        <AlertTitle className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Current Season: {seasonalInfo.season}
                        </AlertTitle>
                        <AlertDescription>
                          <p className="mt-1">{seasonalInfo.description}</p>
                          <div className="mt-2">
                            <strong className="text-sm">Seasonal Tips:</strong>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {seasonalInfo.tips.map((tip: string, index: number) => (
                                <li key={index}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Brisbane Weather Triggers:</h4>
                      <ScrollArea className="h-[180px] rounded-md border p-4">
                        <div className="space-y-4">
                          {weatherTriggers.map((trigger, index) => (
                            <div key={index} className="space-y-1">
                              <h5 className="text-sm font-medium">{trigger.factor}</h5>
                              <p className="text-sm text-muted-foreground">{trigger.impact}</p>
                              <p className="text-sm italic">Tip: {trigger.management}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading Brisbane weather data...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forecast" className="p-4">
              {forecast.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {forecast.slice(0, 5).map((day, index) => (
                      <Card key={index} className="overflow-hidden border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">{format(new Date(day.date), "EEE, MMM d")}</div>
                            {day.icon && (
                              <img
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                                alt="Weather icon"
                                className="w-12 h-12 mx-auto"
                              />
                            )}
                            <div className="text-lg font-bold">{day.temperature && `${day.temperature}°C`}</div>
                            <div className="text-sm capitalize mb-2">{day.description}</div>
                            <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <ArrowUp className="h-3 w-3 mr-1" />
                                {day.maxTemp}°
                              </span>
                              <span className="flex items-center">
                                <ArrowDown className="h-3 w-3 mr-1" />
                                {day.minTemp}°
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <div className="flex justify-center gap-2">
                                <span>Humidity: {day.humidity}%</span>
                                <span>UV: {day.uvIndex}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertDescription className="text-sm">
                      <div className="font-medium mb-1">Brisbane Weather Planning</div>
                      <p>
                        Brisbane's weather can change rapidly, especially during storm season. If you notice your
                        symptoms worsen in certain weather conditions, use this forecast to plan your activities and
                        medication schedule accordingly.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CloudRain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No forecast data available for Brisbane</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="correlation" className="p-4">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={correlationView === "general" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCorrelationView("general")}
                  >
                    General
                  </Button>
                  <Button
                    variant={correlationView === "temperature" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCorrelationView("temperature")}
                  >
                    Temperature
                  </Button>
                  <Button
                    variant={correlationView === "humidity" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCorrelationView("humidity")}
                  >
                    Humidity
                  </Button>
                  <Button
                    variant={correlationView === "pressure" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCorrelationView("pressure")}
                  >
                    Pressure
                  </Button>
                </div>

                {weatherCorrelation ? (
                  <>
                    {correlationView === "general" &&
                    weatherCorrelation.general &&
                    weatherCorrelation.general.length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={weatherCorrelation.general.map((item: any) => ({
                                weather: item.weather,
                                avgSeverity: item.avgSeverity,
                                count: item.count,
                              }))}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="weather" stroke="#888888" fontSize={12} />
                              <YAxis yAxisId="left" orientation="left" stroke="#7c3aed" fontSize={12} />
                              <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  borderRadius: "6px",
                                  border: "1px solid #f0f0f0",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                }}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="avgSeverity"
                                name="Average Severity"
                                stroke="#7c3aed"
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="count"
                                name="Number of Occurrences"
                                stroke="#10b981"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Brisbane Weather Correlation Analysis</h3>

                          <div className="space-y-2">
                            {weatherCorrelation.general.map((item: any, index: number) => (
                              <div key={index} className="p-4 border rounded-md">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium capitalize">{item.weather}</div>
                                  <div className="text-sm text-muted-foreground">{item.count} occurrences</div>
                                </div>
                                <div className="mt-2 flex items-center">
                                  <div className="w-full bg-muted rounded-full h-2.5">
                                    <div
                                      className="bg-primary h-2.5 rounded-full"
                                      style={{ width: `${(item.avgSeverity / 3) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="ml-2 text-sm">Avg. Severity: {item.avgSeverity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : correlationView === "temperature" &&
                      weatherCorrelation.temperature &&
                      weatherCorrelation.temperature.length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid stroke="#f0f0f0" />
                              <XAxis
                                type="number"
                                dataKey="temperature"
                                name="Temperature"
                                unit="°C"
                                domain={["dataMin-2", "dataMax+2"]}
                                stroke="#888888"
                                fontSize={12}
                              />
                              <YAxis
                                type="number"
                                dataKey="severity"
                                name="Severity"
                                domain={[0, 3]}
                                ticks={[0, 1, 2, 3]}
                                stroke="#888888"
                                fontSize={12}
                              />
                              <ZAxis type="category" dataKey="date" name="Date" />
                              <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  borderRadius: "6px",
                                  border: "1px solid #f0f0f0",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                }}
                              />
                              <Legend />
                              <Scatter
                                name="Temperature vs Severity"
                                data={weatherCorrelation.temperature}
                                fill="#7c3aed"
                              />
                              <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="3 3" label="Mild" />
                              <ReferenceLine y={2} stroke="#f97316" strokeDasharray="3 3" label="Moderate" />
                              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="3 3" label="Severe" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>

                        <Alert>
                          <AlertTitle>Temperature Correlation</AlertTitle>
                          <AlertDescription>
                            This chart shows how your symptom severity correlates with temperature in Brisbane. Each
                            point represents a day when you recorded symptoms, with the temperature on that day. Look
                            for clusters of points to identify potential temperature triggers.
                          </AlertDescription>
                        </Alert>

                        <div className="p-4 bg-muted/20 rounded-md">
                          <h4 className="font-medium mb-2">Brisbane Temperature Insights</h4>
                          <p className="text-sm">
                            Brisbane's subtropical climate means temperatures can vary significantly, from hot and humid
                            summers (December-February) to mild winters (June-August). Many people with inflammatory
                            conditions report symptom changes with temperature fluctuations.
                          </p>
                        </div>
                      </div>
                    ) : correlationView === "humidity" &&
                      weatherCorrelation.humidity &&
                      weatherCorrelation.humidity.length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid stroke="#f0f0f0" />
                              <XAxis
                                type="number"
                                dataKey="humidity"
                                name="Humidity"
                                unit="%"
                                domain={["dataMin-5", "dataMax+5"]}
                                stroke="#888888"
                                fontSize={12}
                              />
                              <YAxis
                                type="number"
                                dataKey="severity"
                                name="Severity"
                                domain={[0, 3]}
                                ticks={[0, 1, 2, 3]}
                                stroke="#888888"
                                fontSize={12}
                              />
                              <ZAxis type="category" dataKey="date" name="Date" />
                              <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  borderRadius: "6px",
                                  border: "1px solid #f0f0f0",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                }}
                              />
                              <Legend />
                              <Scatter name="Humidity vs Severity" data={weatherCorrelation.humidity} fill="#10b981" />
                              <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="3 3" label="Mild" />
                              <ReferenceLine y={2} stroke="#f97316" strokeDasharray="3 3" label="Moderate" />
                              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="3 3" label="Severe" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>

                        <Alert>
                          <AlertTitle>Humidity Correlation</AlertTitle>
                          <AlertDescription>
                            This chart shows how your symptom severity correlates with humidity levels in Brisbane.
                            Brisbane's humidity can be particularly high during summer months, which may affect
                            inflammatory conditions.
                          </AlertDescription>
                        </Alert>

                        <div className="p-4 bg-muted/20 rounded-md">
                          <h4 className="font-medium mb-2">Brisbane Humidity Insights</h4>
                          <p className="text-sm">
                            Brisbane's humidity levels can be quite high, especially during summer months when they
                            often exceed 70%. High humidity can increase joint pain and stiffness for many people with
                            inflammatory conditions. Air conditioning can help manage indoor humidity levels.
                          </p>
                        </div>
                      </div>
                    ) : correlationView === "pressure" &&
                      weatherCorrelation.pressure &&
                      weatherCorrelation.pressure.length > 0 ? (
                      <div className="space-y-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid stroke="#f0f0f0" />
                              <XAxis
                                type="number"
                                dataKey="pressure"
                                name="Pressure"
                                unit="hPa"
                                domain={["dataMin-5", "dataMax+5"]}
                                stroke="#888888"
                                fontSize={12}
                              />
                              <YAxis
                                type="number"
                                dataKey="severity"
                                name="Severity"
                                domain={[0, 3]}
                                ticks={[0, 1, 2, 3]}
                                stroke="#888888"
                                fontSize={12}
                              />
                              <ZAxis type="category" dataKey="date" name="Date" />
                              <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  borderRadius: "6px",
                                  border: "1px solid #f0f0f0",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                }}
                              />
                              <Legend />
                              <Scatter name="Pressure vs Severity" data={weatherCorrelation.pressure} fill="#3b82f6" />
                              <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="3 3" label="Mild" />
                              <ReferenceLine y={2} stroke="#f97316" strokeDasharray="3 3" label="Moderate" />
                              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="3 3" label="Severe" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>

                        <Alert>
                          <AlertTitle>Barometric Pressure Correlation</AlertTitle>
                          <AlertDescription>
                            This chart shows how your symptom severity correlates with barometric pressure in Brisbane.
                            Rapid pressure changes, common during Brisbane's storm season, may trigger symptom flares.
                          </AlertDescription>
                        </Alert>

                        <div className="p-4 bg-muted/20 rounded-md">
                          <h4 className="font-medium mb-2">Brisbane Pressure Insights</h4>
                          <p className="text-sm">
                            Brisbane experiences significant barometric pressure changes during its storm season
                            (November to March). These rapid changes can trigger pain and inflammation in joints and
                            tissues. Monitoring pressure forecasts can help you prepare for potential flares.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Not enough data for this correlation view</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Log more symptoms with weather data to see patterns emerge.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Not enough data to show correlation</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Log more symptoms with Brisbane weather data to see patterns emerge.
                    </p>
                    <Button onClick={updateHistoricalWeather} disabled={isLoading} className="mt-4">
                      Update Historical Weather Data
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="p-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader className="p-4 border-b">
                      <CardTitle>Brisbane Weather Insights</CardTitle>
                      <CardDescription>Understanding Brisbane's unique climate patterns</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="summer">
                          <AccordionTrigger>Summer (December-February)</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <p>
                                Hot and humid with temperatures typically between 28-35°C. Afternoon thunderstorms are
                                common.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">High Humidity</Badge>
                                <Badge variant="outline">Thunderstorms</Badge>
                                <Badge variant="outline">High UV</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Many people with inflammatory conditions report increased fatigue and joint swelling
                                during Brisbane's humid summer months.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="autumn">
                          <AccordionTrigger>Autumn (March-May)</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <p>
                                Mild temperatures with decreasing humidity. Temperatures typically range from 15-25°C.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">Mild Temperatures</Badge>
                                <Badge variant="outline">Decreasing Humidity</Badge>
                                <Badge variant="outline">Pleasant Weather</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Many people report improvement in inflammatory symptoms during Brisbane's autumn months
                                as humidity decreases.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="winter">
                          <AccordionTrigger>Winter (June-August)</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <p>
                                Mild, dry days with cool nights. Temperatures typically range from 10-22°C with low
                                humidity.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">Low Humidity</Badge>
                                <Badge variant="outline">Cool Nights</Badge>
                                <Badge variant="outline">Clear Skies</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Brisbane's mild winters are generally favorable for many inflammatory conditions, though
                                some people experience increased joint stiffness in the cooler mornings.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="spring">
                          <AccordionTrigger>Spring (September-November)</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <p>
                                Warming temperatures with increasing humidity. Temperatures typically range from
                                15-28°C.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">Increasing Humidity</Badge>
                                <Badge variant="outline">Warming Temperatures</Badge>
                                <Badge variant="outline">Storm Season Start</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Spring in Brisbane brings increasing pollen counts which may affect those with allergic
                                components to their inflammatory condition.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader className="p-4 border-b">
                      <CardTitle>Your Weather Correlations</CardTitle>
                      <CardDescription>Personalized insights based on your symptom data</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      {correlationInsights && correlationInsights.length > 0 ? (
                        <div className="space-y-4">
                          {correlationInsights.map((insight, index) => (
                            <div key={index} className="p-4 border rounded-md">
                              <div className="font-medium">{insight.factor}</div>
                              <p className="text-sm mt-1">{insight.insight}</p>
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                Recommendation: {insight.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Not enough data for personalized insights</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Continue logging symptoms with weather data to receive personalized insights.
                          </p>
                          <Button onClick={updateHistoricalWeather} disabled={isLoading} className="mt-4">
                            Update Historical Weather Data
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-sm">
                  <CardHeader className="p-4 border-b">
                    <CardTitle>Brisbane Weather Management Strategies</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-md">
                          <h3 className="font-medium">Managing High Humidity</h3>
                          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                            <li>Use air conditioning to reduce indoor humidity</li>
                            <li>Schedule outdoor activities for early morning when humidity is lower</li>
                            <li>Stay well-hydrated to help your body regulate temperature</li>
                            <li>Consider a dehumidifier for your bedroom</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-md">
                          <h3 className="font-medium">Managing Storm Season</h3>
                          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                            <li>Monitor weather forecasts for pressure changes</li>
                            <li>Consider preventative medications before storms</li>
                            <li>Maintain a consistent indoor environment during storms</li>
                            <li>Have pain management strategies ready during rapid weather changes</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-md">
                          <h3 className="font-medium">Managing High UV Exposure</h3>
                          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                            <li>Use sun protection (SPF 50+) year-round in Brisbane</li>
                            <li>Avoid outdoor activities between 10am-3pm</li>
                            <li>Wear UV-protective clothing and sunglasses</li>
                            <li>Be aware that some medications increase sun sensitivity</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-md">
                          <h3 className="font-medium">Managing Temperature Fluctuations</h3>
                          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                            <li>Layer clothing to adjust to Brisbane's variable temperatures</li>
                            <li>Use heating pads for joint stiffness in cooler weather</li>
                            <li>Stay cool with fans and air conditioning in summer</li>
                            <li>Maintain consistent indoor temperatures overnight</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      These strategies are specific to Brisbane's climate patterns and may help manage inflammatory
                      symptoms related to weather changes.
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
