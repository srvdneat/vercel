"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { SymptomEntry } from "@/components/symptom-tracker"
import { fetchWeatherData } from "@/lib/weather"

interface SymptomFormProps {
  date: Date
  existingEntry?: SymptomEntry
  symptomTypes: string[]
  onSubmit: (entry: SymptomEntry) => void
  onCancel?: () => void
}

export default function SymptomForm({ date, existingEntry, symptomTypes, onSubmit, onCancel }: SymptomFormProps) {
  const [severity, setSeverity] = useState<number>(existingEntry?.severity || 1)
  const [notes, setNotes] = useState<string>(existingEntry?.notes || "")
  const [weatherData, setWeatherData] = useState(existingEntry?.weather)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)

  // Initialize symptoms object with all types set to false by default
  const initialSymptoms: Record<string, boolean> = {}
  symptomTypes.forEach((type) => {
    initialSymptoms[type] = existingEntry?.symptoms?.[type] || false
  })

  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>(initialSymptoms)

  // Fetch weather data when the form is opened
  useEffect(() => {
    const getWeatherData = async () => {
      if (!existingEntry?.weather) {
        setIsLoadingWeather(true)
        try {
          const data = await fetchWeatherData()
          setWeatherData(data)
        } catch (error) {
          console.error("Failed to fetch weather data:", error)
        } finally {
          setIsLoadingWeather(false)
        }
      }
    }

    getWeatherData()
  }, [existingEntry?.weather])

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [symptom]: !selectedSymptoms[symptom],
    })
  }

  const handleSubmit = () => {
    onSubmit({
      id: existingEntry?.id || uuidv4(),
      date,
      severity,
      notes,
      symptoms: selectedSymptoms,
      weather: weatherData,
    })

    // Return to previous screen after submission
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Severity</Label>
        <RadioGroup value={severity.toString()} onValueChange={(value) => setSeverity(Number.parseInt(value))}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="severity-mild" />
            <Label htmlFor="severity-mild">Mild</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="severity-moderate" />
            <Label htmlFor="severity-moderate">Moderate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="severity-severe" />
            <Label htmlFor="severity-severe">Severe</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Symptoms</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {symptomTypes.map((symptom) => (
            <div key={symptom} className="flex items-center space-x-2">
              <Checkbox
                id={`symptom-${symptom}`}
                checked={selectedSymptoms[symptom]}
                onCheckedChange={() => toggleSymptom(symptom)}
              />
              <Label htmlFor={`symptom-${symptom}`} className="text-sm">
                {symptom}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about your symptoms..."
          className="min-h-[100px]"
        />
      </div>

      {weatherData && (
        <div className="p-3 bg-muted/30 rounded-md">
          <Label className="mb-2 block">Current Weather</Label>
          <div className="flex items-center">
            {weatherData.icon && (
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`}
                alt="Weather icon"
                className="w-10 h-10 mr-2"
              />
            )}
            <div>
              <div className="text-sm font-medium">
                {weatherData.temperature && `${weatherData.temperature}°C`}
                {weatherData.description && ` - ${weatherData.description}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {weatherData.humidity && `Humidity: ${weatherData.humidity}%`}
                {weatherData.pressure && ` | Pressure: ${weatherData.pressure} hPa`}
              </div>
            </div>
          </div>
          <div className="text-xs mt-2 text-muted-foreground">
            Weather data will be saved with your symptom entry to help identify potential triggers.
          </div>
        </div>
      )}

      {isLoadingWeather && (
        <div className="text-center p-2">
          <div className="text-sm">Loading weather data...</div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} className={onCancel ? "w-auto" : "w-full"}>
          Save Symptoms
        </Button>
      </div>
    </div>
  )
}
