"use client"

import { Label } from "@/components/ui/label"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Settings,
  BarChart2,
  Pill,
  Cloud,
  Phone,
  Menu,
  Brain,
  TrendingUp,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import SymptomSettings from "@/components/symptom-settings"
import SymptomChart from "@/components/symptom-chart"
import MedicationTracker from "@/components/medication-tracker"
import WeatherDisplay from "@/components/weather-display"
import EmergencyContacts, { type EmergencyContact } from "@/components/emergency-contacts"
import AIInsights from "@/components/ai-insights"
import AIPatternVisualization from "@/components/ai-pattern-visualization"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from "uuid"
// Import the SignOutButton component
// import SignOutButton from "@/components/auth/sign-out-button" - removed

// Import the server action
import { fetchCurrentWeather } from "@/actions/weather-actions"

// Severity levels
export const SEVERITY_LEVELS = {
  NONE: 0,
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
}

// Default symptom types
export const DEFAULT_SYMPTOM_TYPES = [
  "Pain",
  "Fatigue",
  "Stiffness",
  "Swelling",
  "Redness",
  "Fever",
  "Limited Mobility",
]

export type SymptomEntry = {
  id: string
  date: Date
  severity: number
  notes: string
  symptoms: {
    [key: string]: boolean
  }
  weather?: {
    temperature?: number
    humidity?: number
    pressure?: number
    description?: string
    icon?: string
    windSpeed?: number
    uvIndex?: number
    feelsLike?: number
  }
}

export type MedicationEntry = {
  id: string
  name: string
  dosage: string
  frequency: string
  times: string[]
  notes: string
  startDate: Date
  endDate?: Date
  reminderEnabled: boolean
}

export default function SymptomTracker() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [medications, setMedications] = useState<MedicationEntry[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [symptomTypes, setSymptomTypes] = useState<string[]>(DEFAULT_SYMPTOM_TYPES)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("calendar")
  const [mainView, setMainView] = useState<
    "symptoms" | "medications" | "weather" | "emergency" | "insights" | "patterns"
  >("symptoms")
  const { toast } = useToast()

  const [selectionMode, setSelectionMode] = useState<boolean>(false)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [selectedDays, setSelectedDays] = useState<Date[]>([])
  const [bulkEntryOpen, setBulkEntryOpen] = useState<boolean>(false)

  // Load saved data on component mount
  useEffect(() => {
    const savedSymptoms = localStorage.getItem("symptomEntries")
    const savedSymptomTypes = localStorage.getItem("symptomTypes")
    const savedMedications = localStorage.getItem("medicationEntries")
    const savedContacts = localStorage.getItem("emergencyContacts")

    if (savedSymptoms) {
      try {
        const parsed = JSON.parse(savedSymptoms)
        // Convert string dates back to Date objects
        setSymptoms(
          parsed.map((entry: any) => ({
            ...entry,
            date: parseISO(entry.date),
          })),
        )
      } catch (e) {
        console.error("Failed to parse saved symptoms", e)
      }
    }

    if (savedSymptomTypes) {
      try {
        setSymptomTypes(JSON.parse(savedSymptomTypes))
      } catch (e) {
        console.error("Failed to parse saved symptom types", e)
      }
    }

    if (savedMedications) {
      try {
        const parsed = JSON.parse(savedMedications)
        // Convert string dates back to Date objects
        setMedications(
          parsed.map((entry: any) => ({
            ...entry,
            startDate: parseISO(entry.startDate),
            endDate: entry.endDate ? parseISO(entry.endDate) : undefined,
          })),
        )
      } catch (e) {
        console.error("Failed to parse saved medications", e)
      }
    }

    if (savedContacts) {
      try {
        setEmergencyContacts(JSON.parse(savedContacts))
      } catch (e) {
        console.error("Failed to parse saved emergency contacts", e)
      }
    }
  }, [])

  // Save data when it changes
  useEffect(() => {
    // Convert Date objects to ISO strings for storage
    const symptomsToSave = symptoms.map((entry) => ({
      ...entry,
      date: entry.date.toISOString(),
    }))
    localStorage.setItem("symptomEntries", JSON.stringify(symptomsToSave))
  }, [symptoms])

  useEffect(() => {
    localStorage.setItem("symptomTypes", JSON.stringify(symptomTypes))
  }, [symptomTypes])

  useEffect(() => {
    // Convert Date objects to ISO strings for storage
    const medicationsToSave = medications.map((entry) => ({
      ...entry,
      startDate: entry.startDate.toISOString(),
      endDate: entry.endDate ? entry.endDate.toISOString() : undefined,
    }))
    localStorage.setItem("medicationEntries", JSON.stringify(medicationsToSave))
  }, [medications])

  useEffect(() => {
    localStorage.setItem("emergencyContacts", JSON.stringify(emergencyContacts))
  }, [emergencyContacts])

  // Generate days for the current month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Navigation functions
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  // Get symptom entry for a specific date
  const getSymptomForDate = (date: Date) => {
    return symptoms.find((s) => isSameDay(s.date, date))
  }

  // Get medications for a specific date
  const getMedicationsForDate = (date: Date) => {
    return medications.filter((med) => {
      const startDate = new Date(med.startDate)
      const endDate = med.endDate ? new Date(med.endDate) : new Date(2099, 11, 31) // Far future date if no end date

      return date >= startDate && date <= endDate
    })
  }

  // Add or update symptom entry
  const addOrUpdateSymptom = (entry: SymptomEntry) => {
    const existingIndex = symptoms.findIndex((s) => isSameDay(s.date, entry.date))

    if (existingIndex >= 0) {
      const updatedSymptoms = [...symptoms]
      updatedSymptoms[existingIndex] = entry
      setSymptoms(updatedSymptoms)
      toast({
        title: "Symptoms Updated",
        description: `Your symptoms for ${format(entry.date, "MMMM d, yyyy")} have been updated.`,
      })
    } else {
      setSymptoms([...symptoms, entry])
      toast({
        title: "Symptoms Added",
        description: `Your symptoms for ${format(entry.date, "MMMM d, yyyy")} have been recorded.`,
      })
    }

    // Close the dialog and ensure we're on the symptoms view
    setSelectedDate(null)
    setMainView("symptoms")
    setActiveTab("calendar")
  }

  // Add or update medication
  const addOrUpdateMedication = (medication: MedicationEntry) => {
    const existingIndex = medications.findIndex((m) => m.id === medication.id)

    if (existingIndex >= 0) {
      const updatedMedications = [...medications]
      updatedMedications[existingIndex] = medication
      setMedications(updatedMedications)
      toast({
        title: "Medication Updated",
        description: `${medication.name} has been updated.`,
      })
    } else {
      setMedications([...medications, medication])
      toast({
        title: "Medication Added",
        description: `${medication.name} has been added to your medications.`,
      })
    }
  }

  // Delete medication
  const deleteMedication = (id: string) => {
    const medication = medications.find((m) => m.id === id)
    if (medication) {
      setMedications(medications.filter((m) => m.id !== id))
      toast({
        title: "Medication Removed",
        description: `${medication.name} has been removed from your medications.`,
      })
    }
  }

  // Add or update emergency contact
  const addOrUpdateContact = (contact: EmergencyContact) => {
    const existingIndex = emergencyContacts.findIndex((c) => c.id === contact.id)

    if (existingIndex >= 0) {
      const updatedContacts = [...emergencyContacts]
      updatedContacts[existingIndex] = contact
      setEmergencyContacts(updatedContacts)
      toast({
        title: "Contact Updated",
        description: `${contact.name} has been updated.`,
      })
    } else {
      setEmergencyContacts([...emergencyContacts, contact])
      toast({
        title: "Contact Added",
        description: `${contact.name} has been added to your emergency contacts.`,
      })
    }
  }

  // Delete emergency contact
  const deleteContact = (id: string) => {
    const contact = emergencyContacts.find((c) => c.id === id)
    if (contact) {
      setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id))
      toast({
        title: "Contact Removed",
        description: `${contact.name} has been removed from your emergency contacts.`,
      })
    }
  }

  // Update symptom types
  const updateSymptomTypes = (newTypes: string[]) => {
    setSymptomTypes(newTypes)
    toast({
      title: "Symptom Categories Updated",
      description: "Your symptom categories have been updated.",
    })
  }

  // Get color based on severity
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case SEVERITY_LEVELS.MILD:
        return "bg-yellow-100 border-yellow-200 hover:border-yellow-300" // Pastel yellow for mild
      case SEVERITY_LEVELS.MODERATE:
        return "bg-orange-100 border-orange-200 hover:border-orange-300" // Pastel orange for moderate
      case SEVERITY_LEVELS.SEVERE:
        return "bg-[#FF4000]/30 border-[#FF4000]/40 hover:border-[#FF4000]/50" // Keep current shade for severe
      default:
        return "bg-green-50 border-green-100 hover:border-green-200" // Slight green tint for no symptoms
    }
  }

  // Export data as CSV
  const exportAsCSV = () => {
    // Filter symptoms for current month
    const currentMonthSymptoms = symptoms.filter(
      (s) => s.date.getMonth() === currentDate.getMonth() && s.date.getFullYear() === currentDate.getFullYear(),
    )

    if (currentMonthSymptoms.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no symptoms recorded for this month.",
        variant: "destructive",
      })
      return
    }

    // Create CSV header
    let csvContent = "Date,Severity,Notes,"

    // Add all possible symptom types as columns
    symptomTypes.forEach((type) => {
      csvContent += `${type},`
    })

    // Add weather columns
    csvContent += "Temperature,Humidity,Pressure,UV Index,Wind Speed,Weather Description,"

    // Add medications column
    csvContent += "Medications\n"

    // Add data rows
    currentMonthSymptoms.forEach((entry) => {
      const severityText = entry.severity === 1 ? "Mild" : entry.severity === 2 ? "Moderate" : "Severe"

      // Format date and add severity and notes
      csvContent += `${format(entry.date, "yyyy-MM-dd")},${severityText},"${entry.notes.replace(/"/g, '""')}",`

      // Add symptom presence (Yes/No) for each type
      symptomTypes.forEach((type) => {
        csvContent += `${entry.symptoms[type] ? "Yes" : "No"},`
      })

      // Add weather data
      csvContent += `${entry.weather?.temperature || ""},${entry.weather?.humidity || ""},${entry.weather?.pressure || ""},${entry.weather?.uvIndex || ""},${entry.weather?.windSpeed || ""},"${entry.weather?.description || ""}",`

      // Add medications for this date
      const medsForDate = getMedicationsForDate(entry.date)
      csvContent += `"${medsForDate.map((m) => `${m.name} (${m.dosage})`).join("; ")}"\n`
    })

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `brisbane-symptom-tracker-${format(currentDate, "yyyy-MM")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: `Data for ${format(currentDate, "MMMM yyyy")} has been exported as CSV.`,
    })
  }

  // Get current month's symptoms
  const currentMonthSymptoms = symptoms.filter(
    (s) => s.date.getMonth() === currentDate.getMonth() && s.date.getFullYear() === currentDate.getFullYear(),
  )

  // Navigation items
  const navItems = [
    { id: "symptoms", label: "Symptoms", icon: <BarChart2 className="h-4 w-4" /> },
    { id: "medications", label: "Medications", icon: <Pill className="h-4 w-4" /> },
    { id: "weather", label: "Weather", icon: <Cloud className="h-4 w-4" /> },
    { id: "emergency", label: "Emergency", icon: <Phone className="h-4 w-4" /> },
    { id: "insights", label: "AI Insights", icon: <Brain className="h-4 w-4" /> },
    { id: "patterns", label: "Patterns", icon: <TrendingUp className="h-4 w-4" /> },
  ]

  // Handle day selection for recurring symptoms
  const handleDaySelect = (day: Date) => {
    if (!selectionMode) {
      // Regular single day selection
      setSelectedDate(day)
      return
    }

    // In selection mode
    if (!selectionStart) {
      // Start new selection
      setSelectionStart(day)
      setSelectedDays([day])
    } else {
      // Calculate all days between start and current
      const start = new Date(Math.min(selectionStart.getTime(), day.getTime()))
      const end = new Date(Math.max(selectionStart.getTime(), day.getTime()))

      const daysInRange = eachDayOfInterval({ start, end })
      setSelectedDays(daysInRange)
    }
  }

  // Handle mouse up to complete selection
  const handleSelectionComplete = () => {
    if (selectionMode && selectedDays.length > 0) {
      setBulkEntryOpen(true)
    }
  }

  // Add bulk symptoms to multiple days
  const addBulkSymptoms = (severity: number, selectedSymptoms: Record<string, boolean>, notes: string) => {
    const newEntries = selectedDays.map((day) => ({
      id: uuidv4(),
      date: day,
      severity,
      notes,
      symptoms: selectedSymptoms,
      weather: null, // We don't fetch weather for bulk entries
    }))

    // Add or update each entry
    newEntries.forEach((entry) => {
      const existingIndex = symptoms.findIndex((s) => isSameDay(s.date, entry.date))
      if (existingIndex >= 0) {
        const updatedSymptoms = [...symptoms]
        updatedSymptoms[existingIndex] = entry
        setSymptoms(updatedSymptoms)
      } else {
        setSymptoms((prev) => [...prev, entry])
      }
    })

    toast({
      title: "Bulk Symptoms Added",
      description: `Symptoms added for ${newEntries.length} days.`,
    })

    // Reset selection state
    setSelectionMode(false)
    setSelectionStart(null)
    setSelectedDays([])
    setBulkEntryOpen(false)
  }

  // Responsive grid columns based on screen size
  const getGridColumns = () => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth
      if (width < 640) return "grid-cols-1" // Mobile
      if (width < 1024) return "grid-cols-2" // Tablet
      return "grid-cols-3" // Desktop
    }
    return "grid-cols-1" // Default for SSR
  }

  const [gridColumns, setGridColumns] = useState(getGridColumns())

  // Update grid columns on window resize
  useEffect(() => {
    const handleResize = () => {
      setGridColumns(getGridColumns())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Top row - Title */}
        <div className="flex justify-center items-center h-14 border-b border-gray-100 py-3">
          <h1 className="font-sans text-2xl font-medium tracking-wide">Inflammatory Disease Companion</h1>
        </div>

        {/* Bottom row - Navigation */}
        <div className="flex h-14 items-center justify-center px-4">
          {/* Center container for navigation */}
          <div className="flex items-center justify-center max-w-4xl w-full">
            {/* Navigation items */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={mainView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMainView(item.id as any)}
                  className="hidden md:flex whitespace-nowrap"
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-auto">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="py-4">
                  <h2 className="text-lg font-semibold mb-4">Inflammatory Disease Companion</h2>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={mainView === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          setMainView(item.id as any)
                          // Close the sheet when an item is selected
                          document.querySelector("[data-radix-collection-item]")?.click()
                        }}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    ))}
                    <div className="pt-4 border-t mt-4"></div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-6xl space-y-4">
          {mainView === "symptoms" && (
            <>
              <Card className="overflow-hidden border-none shadow-sm">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-medium">{format(currentDate, "MMMM yyyy")}</h2>
                        <div className="flex">
                          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <TabsList>
                            <TabsTrigger value="calendar">Calendar</TabsTrigger>
                            <TabsTrigger value="chart">Chart</TabsTrigger>
                          </TabsList>

                          <Button
                            variant={selectionMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectionMode(!selectionMode)
                              if (!selectionMode) {
                                toast({
                                  title: "Multi-day Selection Enabled",
                                  description: "Click and drag to select multiple days for bulk symptom entry.",
                                })
                              } else {
                                setSelectionStart(null)
                                setSelectedDays([])
                              }
                            }}
                            className="h-8"
                          >
                            {selectionMode ? "Cancel Selection" : "Select Multiple Days"}
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Symptom Settings</DialogTitle>
                              </DialogHeader>
                              <SymptomSettings symptomTypes={symptomTypes} onUpdate={updateSymptomTypes} />
                            </DialogContent>
                          </Dialog>

                          <Button variant="ghost" size="icon" onClick={exportAsCSV} className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <TabsContent value="calendar" className="p-4">
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <div key={day} className="text-xs font-medium text-muted-foreground py-1">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                          <div key={`empty-start-${index}`} className="h-20 p-1 rounded-md bg-muted/10"></div>
                        ))}

                        {days.map((day) => {
                          const symptom = getSymptomForDate(day)
                          const medsForDay = getMedicationsForDate(day)
                          const hasSymptom = !!symptom
                          const hasMeds = medsForDay.length > 0
                          const severityClass = hasSymptom ? getSeverityColor(symptom.severity) : getSeverityColor(0) // Use 0 for no symptoms
                          const isSelected = selectedDays.some((d) => isSameDay(d, day))

                          return (
                            <div
                              key={day.toString()}
                              className={cn(
                                "h-20 p-1 border rounded-md relative transition-colors",
                                severityClass,
                                isSelected && "ring-2 ring-primary ring-offset-1",
                                selectionMode && "cursor-pointer",
                              )}
                              onMouseDown={() => selectionMode && handleDaySelect(day)}
                              onMouseOver={() => selectionMode && selectionStart && handleDaySelect(day)}
                              onMouseUp={() => selectionMode && handleSelectionComplete()}
                            >
                              <div className="flex justify-between items-start">
                                <span
                                  className={cn(
                                    "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                    isSameDay(day, new Date()) && "bg-[#FF4000]/30 text-gray-800",
                                  )}
                                >
                                  {format(day, "d")}
                                </span>

                                <div className="flex gap-1">
                                  {hasMeds && <Pill className="h-3 w-3 text-[#FF4000]" />}

                                  {!selectionMode && (
                                    <>
                                      {hasSymptom ? (
                                        // Delete button (without DialogTrigger)
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 rounded-full hover:bg-red-100"
                                          onClick={() => {
                                            // Confirm before deleting
                                            if (window.confirm(`Delete symptoms for ${format(day, "MMMM d, yyyy")}?`)) {
                                              // Remove the symptom entry
                                              setSymptoms(symptoms.filter((s) => !isSameDay(s.date, day)))
                                              toast({
                                                title: "Symptoms Deleted",
                                                description: `Your symptoms for ${format(day, "MMMM d, yyyy")} have been removed.`,
                                              })
                                            }
                                          }}
                                        >
                                          <X className="h-3 w-3 text-red-500" />
                                        </Button>
                                      ) : (
                                        // Add button (with DialogTrigger)
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 rounded-full hover:bg-[#FF4000]/10"
                                              onClick={() => setSelectedDate(day)}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Log Symptoms for {format(day, "MMMM d, yyyy")}</DialogTitle>
                                            </DialogHeader>
                                            <SymptomForm
                                              date={day}
                                              existingEntry={symptom}
                                              symptomTypes={symptomTypes}
                                              onSubmit={addOrUpdateSymptom}
                                              onCancel={() => setSelectedDate(null)}
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {hasSymptom && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="absolute bottom-1 right-1 h-5 px-2 text-xs rounded-sm hover:bg-[#FF4000]/10"
                                    >
                                      View
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-3">
                                    <div className="space-y-2">
                                      <h3 className="font-medium text-sm">
                                        Symptoms on {format(symptom.date, "MMM d, yyyy")}
                                      </h3>
                                      <div className="text-xs">
                                        <div className="font-medium">Severity:</div>
                                        <div className="ml-2">
                                          {symptom.severity === 1 && "Mild"}
                                          {symptom.severity === 2 && "Moderate"}
                                          {symptom.severity === 3 && "Severe"}
                                        </div>
                                      </div>
                                      <div className="text-xs">
                                        <div className="font-medium">Symptoms:</div>
                                        <div className="ml-2">
                                          {Object.entries(symptom.symptoms)
                                            .filter(([_, present]) => present)
                                            .map(([name]) => name)
                                            .join(", ") || "None recorded"}
                                        </div>
                                      </div>
                                      {symptom.notes && (
                                        <div className="text-xs">
                                          <div className="font-medium">Notes:</div>
                                          <div className="ml-2">{symptom.notes}</div>
                                        </div>
                                      )}

                                      {symptom.weather && (
                                        <div className="text-xs">
                                          <div className="font-medium">Brisbane Weather:</div>
                                          <div className="ml-2 flex items-center">
                                            {symptom.weather.icon && (
                                              <img
                                                src={`https://openweathermap.org/img/wn/${symptom.weather.icon}.png`}
                                                alt="Weather icon"
                                                className="w-6 h-6 mr-1"
                                              />
                                            )}
                                            <span>
                                              {symptom.weather.temperature && `${symptom.weather.temperature}°C, `}
                                              {symptom.weather.description}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {hasMeds && (
                                        <div className="text-xs">
                                          <div className="font-medium">Medications:</div>
                                          <ul className="ml-2 list-disc list-inside">
                                            {medsForDay.map((med) => (
                                              <li key={med.id}>
                                                {med.name} ({med.dosage})
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}

                              {!hasSymptom && hasMeds && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="absolute bottom-1 right-1 h-5 px-2 text-xs rounded-sm hover:bg-[#FF4000]/10"
                                    >
                                      Meds
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-3">
                                    <div className="space-y-2">
                                      <h3 className="font-medium text-sm">
                                        Medications for {format(day, "MMM d, yyyy")}
                                      </h3>
                                      <ul className="text-xs list-disc list-inside">
                                        {medsForDay.map((med) => (
                                          <li key={med.id}>
                                            {med.name} ({med.dosage})
                                            <div className="text-xs text-muted-foreground ml-5">
                                              {med.times.join(", ")}
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          )
                        })}

                        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                          <div key={`empty-end-${index}`} className="h-20 p-1 rounded-md bg-muted/10"></div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="chart" className="p-4">
                      <SymptomChart symptoms={currentMonthSymptoms} symptomTypes={symptomTypes} month={currentDate} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <h2 className="text-lg font-medium mb-4">Monthly Summary</h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF4000]/20"></div>
                      <span className="text-sm">Mild</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF4000]/30"></div>
                      <span className="text-sm">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF4000]/50"></div>
                      <span className="text-sm">Severe</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      {currentMonthSymptoms.length === 0
                        ? "No symptoms recorded for this month. Click the + button on any day to log symptoms."
                        : `You've recorded symptoms on ${currentMonthSymptoms.length} days this month.`}
                    </p>
                  </div>

                  {currentMonthSymptoms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Most Common Symptoms</h3>
                        <ul className="text-sm space-y-1">
                          {getMostCommonSymptoms(currentMonthSymptoms, symptomTypes).map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">{item.count} days</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Severity Distribution</h3>
                        <ul className="text-sm space-y-1">
                          <li className="flex justify-between">
                            <span>Mild</span>
                            <span className="text-muted-foreground">
                              {currentMonthSymptoms.filter((s) => s.severity === 1).length} days
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span>Moderate</span>
                            <span className="text-muted-foreground">
                              {currentMonthSymptoms.filter((s) => s.severity === 2).length} days
                            </span>
                          </li>
                          <li className="flex justify-between">
                            <span>Severe</span>
                            <span className="text-muted-foreground">
                              {currentMonthSymptoms.filter((s) => s.severity === 3).length} days
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={exportAsCSV} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {mainView === "medications" && (
            <MedicationTracker
              medications={medications}
              onAddMedication={addOrUpdateMedication}
              onUpdateMedication={addOrUpdateMedication}
              onDeleteMedication={deleteMedication}
            />
          )}

          {mainView === "weather" && (
            <WeatherDisplay symptoms={symptoms} currentDate={currentDate} onUpdateSymptom={addOrUpdateSymptom} />
          )}

          {mainView === "emergency" && (
            <EmergencyContacts
              contacts={emergencyContacts}
              onAddContact={addOrUpdateContact}
              onUpdateContact={addOrUpdateContact}
              onDeleteContact={deleteContact}
            />
          )}

          {mainView === "insights" && (
            <AIInsights symptoms={symptoms} medications={medications} symptomTypes={symptomTypes} />
          )}

          {mainView === "patterns" && (
            <AIPatternVisualization symptoms={symptoms} medications={medications} symptomTypes={symptomTypes} />
          )}
        </div>

        {/* Bulk Entry Dialog */}
        <Dialog open={bulkEntryOpen} onOpenChange={setBulkEntryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Symptoms for Multiple Days</DialogTitle>
              <DialogDescription>
                Adding symptoms for {selectedDays.length} days:{" "}
                {selectedDays.length > 0 &&
                  `${format(selectedDays[0], "MMM d")} - ${format(selectedDays[selectedDays.length - 1], "MMM d")}`}
              </DialogDescription>
            </DialogHeader>

            <BulkSymptomForm
              symptomTypes={symptomTypes}
              onSubmit={(severity, symptoms, notes) => addBulkSymptoms(severity, symptoms, notes)}
              onCancel={() => {
                setBulkEntryOpen(false)
                setSelectionMode(false)
                setSelectionStart(null)
                setSelectedDays([])
              }}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

// Bulk Symptom Form Component
function BulkSymptomForm({
  symptomTypes,
  onSubmit,
  onCancel,
}: {
  symptomTypes: string[]
  onSubmit: (severity: number, symptoms: Record<string, boolean>, notes: string) => void
  onCancel: () => void
}) {
  const [severity, setSeverity] = useState<number>(1)
  const [notes, setNotes] = useState<string>("")

  // Initialize symptoms object with all types set to false by default
  const initialSymptoms: Record<string, boolean> = {}
  symptomTypes.forEach((type) => {
    initialSymptoms[type] = false
  })

  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>(initialSymptoms)

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [symptom]: !selectedSymptoms[symptom],
    })
  }

  const handleSubmit = () => {
    onSubmit(severity, selectedSymptoms, notes)
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Severity</Label>
        <RadioGroup value={severity.toString()} onValueChange={(value) => setSeverity(Number.parseInt(value))}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="bulk-severity-mild" />
            <Label htmlFor="bulk-severity-mild">Mild</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="bulk-severity-moderate" />
            <Label htmlFor="bulk-severity-moderate">Moderate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="bulk-severity-severe" />
            <Label htmlFor="bulk-severity-severe">Severe</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Symptoms</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {symptomTypes.map((symptom) => (
            <div key={symptom} className="flex items-center space-x-2">
              <Checkbox
                id={`bulk-symptom-${symptom}`}
                checked={selectedSymptoms[symptom]}
                onCheckedChange={() => toggleSymptom(symptom)}
              />
              <Label htmlFor={`bulk-symptom-${symptom}`} className="text-sm">
                {symptom}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-notes">Notes</Label>
        <Textarea
          id="bulk-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about these symptoms..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Symptoms for {selectedSymptoms.length} Days</Button>
      </div>
    </div>
  )
}

// Helper function to get most common symptoms
function getMostCommonSymptoms(entries: SymptomEntry[], symptomTypes: string[]) {
  const counts: Record<string, number> = {}

  // Count occurrences of each symptom
  entries.forEach((entry) => {
    Object.entries(entry.symptoms).forEach(([name, present]) => {
      if (present) {
        counts[name] = (counts[name] || 0) + 1
      }
    })
  })

  // Convert to array and sort by count
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 symptoms
}

// Symptom Form Component
function SymptomForm({
  date,
  existingEntry,
  symptomTypes,
  onSubmit,
  onCancel,
}: {
  date: Date
  existingEntry?: SymptomEntry
  symptomTypes: string[]
  onSubmit: (entry: SymptomEntry) => void
  onCancel: () => void
}) {
  const [severity, setSeverity] = useState<number>(existingEntry?.severity || 1)
  const [notes, setNotes] = useState<string>(existingEntry?.notes || "")

  // Initialize symptoms object with all types set to false by default
  const initialSymptoms: Record<string, boolean> = {}
  symptomTypes.forEach((type) => {
    initialSymptoms[type] = existingEntry?.symptoms[type] || false
  })

  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>(initialSymptoms)

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms({
      ...selectedSymptoms,
      [symptom]: !selectedSymptoms[symptom],
    })
  }

  const handleSubmit = async () => {
    try {
      // Use the server action to fetch weather data
      const weather = await fetchCurrentWeather()

      const newEntry: SymptomEntry = {
        id: existingEntry?.id || uuidv4(),
        date: date,
        severity,
        notes,
        symptoms: selectedSymptoms,
        weather: weather,
      }

      onSubmit(newEntry)
    } catch (error) {
      console.error("Failed to fetch weather data", error)

      const newEntry: SymptomEntry = {
        id: existingEntry?.id || uuidv4(),
        date: date,
        severity,
        notes,
        symptoms: selectedSymptoms,
        weather: null, // Weather data failed to load
      }

      onSubmit(newEntry)
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
          placeholder="Add any additional notes about these symptoms..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Symptoms</Button>
      </div>
    </div>
  )
}
