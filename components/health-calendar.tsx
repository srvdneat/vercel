"use client"

import { useState, useEffect } from "react"
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar"
import { parseISO } from "date-fns"

interface SymptomEntry {
  id: string
  date: string
  symptoms: Array<{
    name: string
    severity: number
  }>
  medications: Array<{
    name: string
    dosage: string
    time: string
  }>
  notes?: string
}

interface HealthCalendarProps {
  className?: string
}

export default function HealthCalendar({ className }: HealthCalendarProps) {
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([])

  useEffect(() => {
    // Load symptom entries from localStorage
    const stored = localStorage.getItem("symptom-entries")
    if (stored) {
      try {
        setSymptomEntries(JSON.parse(stored))
      } catch (error) {
        console.error("Error loading symptom entries:", error)
      }
    }
  }, [])

  // Convert symptom entries to calendar events
  const calendarData = symptomEntries
    .map((entry) => {
      const events = []

      // Add symptom events
      entry.symptoms.forEach((symptom, index) => {
        events.push({
          id: `${entry.id}-symptom-${index}`,
          name: `${symptom.name} (${symptom.severity}/10)`,
          time: "All day",
          datetime: entry.date,
        })
      })

      // Add medication events
      entry.medications.forEach((medication, index) => {
        events.push({
          id: `${entry.id}-med-${index}`,
          name: `${medication.name} ${medication.dosage}`,
          time: medication.time,
          datetime: entry.date,
        })
      })

      // Add notes as events if they exist
      if (entry.notes) {
        events.push({
          id: `${entry.id}-notes`,
          name: "Notes",
          time: "All day",
          datetime: entry.date,
        })
      }

      return {
        day: parseISO(entry.date),
        events,
      }
    })
    .filter((entry) => entry.events.length > 0)

  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Health Calendar</h1>
        <p className="text-muted-foreground">View your symptoms, medications, and health notes in calendar format</p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <FullScreenCalendar data={calendarData} />
      </div>
    </div>
  )
}
