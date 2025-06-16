"use client"

import { useState, useEffect } from "react"
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar"
import { format } from "date-fns"
import type { SymptomEntry, MedicationEntry } from "@/components/symptom-tracker"

interface HealthCalendarProps {
  className?: string
}

export default function HealthCalendar({ className }: HealthCalendarProps) {
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [medications, setMedications] = useState<MedicationEntry[]>([])

  useEffect(() => {
    // Load data from localStorage using the same keys as your main app
    const savedSymptoms = localStorage.getItem("symptomEntries")
    const savedMedications = localStorage.getItem("medicationEntries")

    if (savedSymptoms) {
      try {
        const parsed = JSON.parse(savedSymptoms)
        setSymptoms(
          parsed.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          })),
        )
      } catch (e) {
        console.error("Failed to parse saved symptoms", e)
      }
    }

    if (savedMedications) {
      try {
        const parsed = JSON.parse(savedMedications)
        setMedications(
          parsed.map((entry: any) => ({
            ...entry,
            startDate: new Date(entry.startDate),
            endDate: entry.endDate ? new Date(entry.endDate) : undefined,
          })),
        )
      } catch (e) {
        console.error("Failed to parse saved medications", e)
      }
    }
  }, [])

  // Convert symptom entries to calendar events
  const calendarData = symptoms
    .map((entry) => {
      const events = []

      // Add symptom severity as main event
      const severityText = entry.severity === 1 ? "Mild" : entry.severity === 2 ? "Moderate" : "Severe"
      events.push({
        id: `${entry.id}-severity`,
        name: `Symptoms: ${severityText}`,
        time: "All day",
        datetime: entry.date.toISOString(),
      })

      // Add specific symptoms
      const activeSymptoms = Object.entries(entry.symptoms)
        .filter(([_, present]) => present)
        .map(([name]) => name)

      if (activeSymptoms.length > 0) {
        events.push({
          id: `${entry.id}-symptoms`,
          name: activeSymptoms.slice(0, 2).join(", ") + (activeSymptoms.length > 2 ? "..." : ""),
          time: "Symptoms",
          datetime: entry.date.toISOString(),
        })
      }

      // Add weather info if available
      if (entry.weather) {
        events.push({
          id: `${entry.id}-weather`,
          name: `${entry.weather.temperature}°C, ${entry.weather.description}`,
          time: "Weather",
          datetime: entry.date.toISOString(),
        })
      }

      // Add notes if they exist
      if (entry.notes && entry.notes.trim()) {
        events.push({
          id: `${entry.id}-notes`,
          name: entry.notes.length > 20 ? entry.notes.substring(0, 20) + "..." : entry.notes,
          time: "Notes",
          datetime: entry.date.toISOString(),
        })
      }

      return {
        day: entry.date,
        events,
      }
    })
    .filter((entry) => entry.events.length > 0)

  // Add medication events for each day
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Generate medication events for the visible date range
  medications.forEach((medication) => {
    const startDate = new Date(medication.startDate)
    const endDate = medication.endDate ? new Date(medication.endDate) : thirtyDaysFromNow

    // For each day the medication is active
    for (
      let d = new Date(Math.max(startDate.getTime(), thirtyDaysAgo.getTime()));
      d <= Math.min(endDate.getTime(), thirtyDaysFromNow.getTime());
      d.setDate(d.getDate() + 1)
    ) {
      const dayKey = format(d, "yyyy-MM-dd")
      let existingDay = calendarData.find((item) => format(item.day, "yyyy-MM-dd") === dayKey)

      if (!existingDay) {
        existingDay = {
          day: new Date(d),
          events: [],
        }
        calendarData.push(existingDay)
      }

      // Add medication events for each scheduled time
      medication.times.forEach((time, index) => {
        existingDay!.events.push({
          id: `${medication.id}-${dayKey}-${index}`,
          name: `${medication.name} ${medication.dosage}`,
          time: time,
          datetime: d.toISOString(),
        })
      })
    }
  })

  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
          Health Calendar
        </h1>
        <p className="text-white/60">View your symptoms, medications, and health notes in calendar format</p>
      </div>

      <div className="glass-card border-white/20 rounded-lg">
        <FullScreenCalendar data={calendarData} />
      </div>
    </div>
  )
}
