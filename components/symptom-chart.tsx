"use client"

import { useState } from "react"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns"
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
} from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { SymptomEntry } from "@/components/symptom-tracker"

interface SymptomChartProps {
  symptoms: SymptomEntry[]
  symptomTypes: string[]
  month: Date
}

export default function SymptomChart({ symptoms, symptomTypes, month }: SymptomChartProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(symptomTypes.length > 0 ? [symptomTypes[0]] : [])
  const [chartView, setChartView] = useState<"severity" | "symptoms" | "correlation">("severity")
  const [correlationFactor, setCorrelationFactor] = useState<"temperature" | "humidity" | "pressure">("temperature")

  // Generate all days in the month
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Prepare data for chart
  const chartData = days.map((day) => {
    const entry = symptoms.find((s) => isSameDay(s.date, day))

    // Base data point with date
    const dataPoint: any = {
      date: format(day, "dd"),
      fullDate: format(day, "MMM dd"),
      severity: entry ? entry.severity : 0,
    }

    // Add data for each selected symptom
    selectedSymptoms.forEach((symptom) => {
      dataPoint[symptom] = entry && entry.symptoms[symptom] ? 1 : 0
    })

    return dataPoint
  })

  // Prepare correlation data
  const correlationData = symptoms
    .filter((s) => s.weather)
    .map((symptom) => {
      let factor = 0

      if (correlationFactor === "temperature") {
        factor = symptom.weather?.temperature || 0
      } else if (correlationFactor === "humidity") {
        factor = symptom.weather?.humidity || 0
      } else if (correlationFactor === "pressure") {
        factor = symptom.weather?.pressure || 0
      }

      return {
        factor,
        severity: symptom.severity,
        date: format(symptom.date, "MMM dd"),
      }
    })

  // Toggle a symptom selection
  const toggleSymptomSelection = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom))
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom])
    }
  }

  // Handle empty state
  if (symptoms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">No symptom data recorded for this month</div>
        <div className="text-sm text-muted-foreground">Add symptoms using the calendar view to see trends here</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="space-y-2">
          <Label>Chart View</Label>
          <Select
            value={chartView}
            onValueChange={(value: "severity" | "symptoms" | "correlation") => setChartView(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity Trend</SelectItem>
              <SelectItem value="symptoms">Symptom Occurrence</SelectItem>
              <SelectItem value="correlation">Weather Correlation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {chartView === "symptoms" && (
          <div className="space-y-2">
            <Label>Symptoms to Display</Label>
            <div className="flex flex-wrap gap-2">
              {symptomTypes.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptomSelection(symptom)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedSymptoms.includes(symptom)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>
        )}

        {chartView === "correlation" && (
          <div className="space-y-2">
            <Label>Weather Factor</Label>
            <Select
              value={correlationFactor}
              onValueChange={(value: "temperature" | "humidity" | "pressure") => setCorrelationFactor(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select factor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
                <SelectItem value="pressure">Pressure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "severity" && (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis
                    domain={[0, 3]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(value) => {
                      return value === 0 ? "None" : value === 1 ? "Mild" : value === 2 ? "Moderate" : "Severe"
                    }}
                    stroke="#888888"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      return [
                        value === 0 ? "None" : value === 1 ? "Mild" : value === 2 ? "Moderate" : "Severe",
                        "Severity",
                      ]
                    }}
                    labelFormatter={(label) => {
                      const dataPoint = chartData.find((d) => d.date === label)
                      return dataPoint?.fullDate || label
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="severity"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    name="Severity"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              )}

              {chartView === "symptoms" && (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(value) => {
                      return value === 0 ? "No" : "Yes"
                    }}
                    stroke="#888888"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      return [value === 0 ? "No" : "Yes", name]
                    }}
                    labelFormatter={(label) => {
                      const dataPoint = chartData.find((d) => d.date === label)
                      return dataPoint?.fullDate || label
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Legend />

                  {selectedSymptoms.map((symptom, index) => {
                    // Generate a different color for each symptom line
                    const colors = ["#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6"]
                    return (
                      <Line
                        key={symptom}
                        type="monotone"
                        dataKey={symptom}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        name={symptom}
                        dot={{ r: 3 }}
                      />
                    )
                  })}
                </LineChart>
              )}

              {chartView === "correlation" && (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    dataKey="factor"
                    name={correlationFactor.charAt(0).toUpperCase() + correlationFactor.slice(1)}
                    unit={correlationFactor === "temperature" ? "°C" : correlationFactor === "humidity" ? "%" : "hPa"}
                    stroke="#888888"
                    fontSize={12}
                  />
                  <YAxis
                    type="number"
                    dataKey="severity"
                    name="Severity"
                    stroke="#888888"
                    fontSize={12}
                    domain={[0, 3]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(value) => {
                      return value === 0 ? "None" : value === 1 ? "Mild" : value === 2 ? "Moderate" : "Severe"
                    }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name, props) => {
                      if (name === "severity") {
                        return [
                          value === 0 ? "None" : value === 1 ? "Mild" : value === 2 ? "Moderate" : "Severe",
                          "Severity",
                        ]
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label) => ""}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Scatter
                    name={`${correlationFactor.charAt(0).toUpperCase() + correlationFactor.slice(1)} vs Severity`}
                    data={correlationData}
                    fill="#7c3aed"
                  />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
