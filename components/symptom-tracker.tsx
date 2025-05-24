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
  Sparkles,
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
      const endDate = med.endDate ? new Date(med.endDate) : new Date(2099, 11, 31)
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

  // Get color based on severity with glass effect
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case SEVERITY_LEVELS.MILD:
        return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400/50 glow-accent"
      case SEVERITY_LEVELS.MODERATE:
        return "bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400/50 glow-secondary"
      case SEVERITY_LEVELS.SEVERE:
        return "bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50 glow-primary"
      default:
        return "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-400/30"
    }
  }

  // Export data as CSV
  const exportAsCSV = () => {
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

    let csvContent = "Date,Severity,Notes,"
    symptomTypes.forEach((type) => {
      csvContent += `${type},`
    })
    csvContent += "Temperature,Humidity,Pressure,UV Index,Wind Speed,Weather Description,Medications\n"

    currentMonthSymptoms.forEach((entry) => {
      const severityText = entry.severity === 1 ? "Mild" : entry.severity === 2 ? "Moderate" : "Severe"
      csvContent += `${format(entry.date, "yyyy-MM-dd")},${severityText},"${entry.notes.replace(/"/g, '""')}",`

      symptomTypes.forEach((type) => {
        csvContent += `${entry.symptoms[type] ? "Yes" : "No"},`
      })

      csvContent += `${entry.weather?.temperature || ""},${entry.weather?.humidity || ""},${entry.weather?.pressure || ""},${entry.weather?.uvIndex || ""},${entry.weather?.windSpeed || ""},"${entry.weather?.description || ""}",`

      const medsForDate = getMedicationsForDate(entry.date)
      csvContent += `"${medsForDate.map((m) => `${m.name} (${m.dosage})`).join("; ")}"\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `health-tracker-${format(currentDate, "yyyy-MM")}.csv`)
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

  // Navigation items with enhanced styling
  const navItems = [
    {
      id: "symptoms",
      label: "Symptoms",
      icon: <BarChart2 className="h-4 w-4" />,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "medications",
      label: "Medications",
      icon: <Pill className="h-4 w-4" />,
      gradient: "from-blue-500 to-cyan-500",
    },
    { id: "weather", label: "Weather", icon: <Cloud className="h-4 w-4" />, gradient: "from-cyan-500 to-blue-500" },
    {
      id: "emergency",
      label: "Emergency",
      icon: <Phone className="h-4 w-4" />,
      gradient: "from-red-500 to-orange-500",
    },
    {
      id: "insights",
      label: "AI Insights",
      icon: <Brain className="h-4 w-4" />,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      id: "patterns",
      label: "Patterns",
      icon: <TrendingUp className="h-4 w-4" />,
      gradient: "from-emerald-500 to-teal-500",
    },
  ]

  // Handle day selection for recurring symptoms
  const handleDaySelect = (day: Date) => {
    if (!selectionMode) {
      setSelectedDate(day)
      return
    }

    if (!selectionStart) {
      setSelectionStart(day)
      setSelectedDays([day])
    } else {
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
      weather: null,
    }))

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

    setSelectionMode(false)
    setSelectionStart(null)
    setSelectedDays([])
    setBulkEntryOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black floating-orbs">
      {/* Header with glass morphism */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/10">
        {/* Top row - Title with glow effect */}
        <div className="flex justify-center items-center h-16 border-b border-white/5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 glow-primary">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <h1 className="font-sans text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent tracking-wide">
              Inflammatory Disease Companion
            </h1>
          </div>
        </div>

        {/* Bottom row - Navigation with glass buttons */}
        <div className="flex h-16 items-center justify-center px-4">
          <div className="flex items-center justify-center max-w-6xl w-full">
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={mainView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMainView(item.id as any)}
                  className={cn(
                    "hidden md:flex whitespace-nowrap glass-button transition-all duration-300",
                    mainView === item.id
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg glow-primary`
                      : "hover:bg-white/10",
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Mobile menu with glass effect */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-auto glass-button">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="glass-card border-white/20">
                <div className="py-4">
                  <h2 className="text-lg font-semibold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Health Companion
                  </h2>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={mainView === item.id ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start glass-button",
                          mainView === item.id && `bg-gradient-to-r ${item.gradient} text-white`,
                        )}
                        onClick={() => setMainView(item.id as any)}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content with enhanced glass cards */}
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-7xl space-y-6">
          {mainView === "symptoms" && (
            <>
              <Card className="glass-card border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                            <BarChart2 className="h-5 w-5 text-purple-400" />
                          </div>
                          <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                            {format(currentDate, "MMMM yyyy")}
                          </h2>
                        </div>
                        <div className="flex glass-button rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPreviousMonth}
                            className="h-8 w-8 hover:bg-white/10"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNextMonth}
                            className="h-8 w-8 hover:bg-white/10"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TabsList className="glass-button">
                          <TabsTrigger value="calendar" className="data-[state=active]:bg-white/20">
                            Calendar
                          </TabsTrigger>
                          <TabsTrigger value="chart" className="data-[state=active]:bg-white/20">
                            Chart
                          </TabsTrigger>
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
                          className={cn(
                            "glass-button",
                            selectionMode && "bg-gradient-to-r from-purple-500 to-pink-500 text-white glow-primary",
                          )}
                        >
                          {selectionMode ? "Cancel Selection" : "Multi-Select"}
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="glass-button">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-white/20">
                            <DialogHeader>
                              <DialogTitle className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                Symptom Settings
                              </DialogTitle>
                            </DialogHeader>
                            <SymptomSettings symptomTypes={symptomTypes} onUpdate={updateSymptomTypes} />
                          </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="icon" onClick={exportAsCSV} className="glass-button">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <TabsContent value="calendar" className="p-6">
                      <div className="grid grid-cols-7 gap-2 text-center mb-4">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <div key={day} className="text-sm font-medium text-white/70 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                          <div key={`empty-start-${index}`} className="h-24 p-2 rounded-xl bg-white/5"></div>
                        ))}

                        {days.map((day) => {
                          const symptom = getSymptomForDate(day)
                          const medsForDay = getMedicationsForDate(day)
                          const hasSymptom = !!symptom
                          const hasMeds = medsForDay.length > 0
                          const severityClass = hasSymptom ? getSeverityColor(symptom.severity) : getSeverityColor(0)
                          const isSelected = selectedDays.some((d) => isSameDay(d, day))
                          const isToday = isSameDay(day, new Date())

                          return (
                            <div
                              key={day.toString()}
                              className={cn(
                                "h-24 p-2 border rounded-xl relative transition-all duration-300 backdrop-blur-sm",
                                severityClass,
                                isSelected && "ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent",
                                selectionMode && "cursor-pointer hover:scale-105",
                                isToday && "ring-2 ring-white/50",
                              )}
                              onMouseDown={() => selectionMode && handleDaySelect(day)}
                              onMouseOver={() => selectionMode && selectionStart && handleDaySelect(day)}
                              onMouseUp={() => selectionMode && handleSelectionComplete()}
                            >
                              <div className="flex justify-between items-start h-full">
                                <span
                                  className={cn(
                                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                    isToday && "bg-white/20 text-white font-bold",
                                  )}
                                >
                                  {format(day, "d")}
                                </span>

                                <div className="flex flex-col gap-1">
                                  {hasMeds && (
                                    <div className="p-1 rounded-full bg-blue-500/30">
                                      <Pill className="h-3 w-3 text-blue-300" />
                                    </div>
                                  )}

                                  {!selectionMode && (
                                    <>
                                      {hasSymptom ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-full hover:bg-red-500/20 p-1"
                                          onClick={() => {
                                            if (window.confirm(`Delete symptoms for ${format(day, "MMMM d, yyyy")}?`)) {
                                              setSymptoms(symptoms.filter((s) => !isSameDay(s.date, day)))
                                              toast({
                                                title: "Symptoms Deleted",
                                                description: `Your symptoms for ${format(day, "MMMM d, yyyy")} have been removed.`,
                                              })
                                            }
                                          }}
                                        >
                                          <X className="h-3 w-3 text-red-400" />
                                        </Button>
                                      ) : (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 rounded-full hover:bg-purple-500/20 p-1"
                                              onClick={() => setSelectedDate(day)}
                                            >
                                              <Plus className="h-3 w-3 text-purple-400" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="glass-card border-white/20">
                                            <DialogHeader>
                                              <DialogTitle className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                                Log Symptoms for {format(day, "MMMM d, yyyy")}
                                              </DialogTitle>
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
                                      className="absolute bottom-1 right-1 h-6 px-2 text-xs rounded-md hover:bg-white/10"
                                    >
                                      View
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4 glass-card border-white/20">
                                    <div className="space-y-3">
                                      <h3 className="font-medium text-sm bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                        Symptoms on {format(symptom.date, "MMM d, yyyy")}
                                      </h3>
                                      <div className="text-xs space-y-2">
                                        <div>
                                          <div className="font-medium text-white/80">Severity:</div>
                                          <div className="ml-2 text-white/60">
                                            {symptom.severity === 1 && "Mild"}
                                            {symptom.severity === 2 && "Moderate"}
                                            {symptom.severity === 3 && "Severe"}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="font-medium text-white/80">Symptoms:</div>
                                          <div className="ml-2 text-white/60">
                                            {Object.entries(symptom.symptoms)
                                              .filter(([_, present]) => present)
                                              .map(([name]) => name)
                                              .join(", ") || "None recorded"}
                                          </div>
                                        </div>
                                        {symptom.notes && (
                                          <div>
                                            <div className="font-medium text-white/80">Notes:</div>
                                            <div className="ml-2 text-white/60">{symptom.notes}</div>
                                          </div>
                                        )}
                                        {symptom.weather && (
                                          <div>
                                            <div className="font-medium text-white/80">Weather:</div>
                                            <div className="ml-2 flex items-center text-white/60">
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
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          )
                        })}

                        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                          <div key={`empty-end-${index}`} className="h-24 p-2 rounded-xl bg-white/5"></div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="chart" className="p-6">
                      <SymptomChart symptoms={currentMonthSymptoms} symptomTypes={symptomTypes} month={currentDate} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                      Monthly Summary
                    </h2>
                    <Button
                      onClick={exportAsCSV}
                      className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
                      <span className="text-sm text-white/80">Mild</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"></div>
                      <span className="text-sm text-white/80">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
                      <span className="text-sm text-white/80">Severe</span>
                    </div>
                  </div>

                  <p className="text-sm text-white/60 mb-4">
                    {currentMonthSymptoms.length === 0
                      ? "No symptoms recorded for this month. Click the + button on any day to log symptoms."
                      : `You've recorded symptoms on ${currentMonthSymptoms.length} days this month.`}
                  </p>

                  {currentMonthSymptoms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="glass p-4 rounded-lg">
                        <h3 className="text-sm font-medium mb-3 text-white/80">Most Common Symptoms</h3>
                        <ul className="text-sm space-y-2">
                          {getMostCommonSymptoms(currentMonthSymptoms, symptomTypes).map((item, index) => (
                            <li key={index} className="flex justify-between text-white/60">
                              <span>{item.name}</span>
                              <span>{item.count} days</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <h3 className="text-sm font-medium mb-3 text-white/80">Severity Distribution</h3>
                        <ul className="text-sm space-y-2">
                          <li className="flex justify-between text-white/60">
                            <span>Mild</span>
                            <span>{currentMonthSymptoms.filter((s) => s.severity === 1).length} days</span>
                          </li>
                          <li className="flex justify-between text-white/60">
                            <span>Moderate</span>
                            <span>{currentMonthSymptoms.filter((s) => s.severity === 2).length} days</span>
                          </li>
                          <li className="flex justify-between text-white/60">
                            <span>Severe</span>
                            <span>{currentMonthSymptoms.filter((s) => s.severity === 3).length} days</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
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

        {/* Bulk Entry Dialog with glass styling */}
        <Dialog open={bulkEntryOpen} onOpenChange={setBulkEntryOpen}>
          <DialogContent className="max-w-md glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Log Symptoms for Multiple Days
              </DialogTitle>
              <DialogDescription className="text-white/60">
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

// Helper functions and components remain the same but with updated styling
function getMostCommonSymptoms(entries: SymptomEntry[], symptomTypes: string[]) {
  const counts: Record<string, number> = {}

  entries.forEach((entry) => {
    Object.entries(entry.symptoms).forEach(([name, present]) => {
      if (present) {
        counts[name] = (counts[name] || 0) + 1
      }
    })
  })

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

// Bulk Symptom Form Component with glass styling
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
        <Label className="text-white/80">Severity</Label>
        <RadioGroup value={severity.toString()} onValueChange={(value) => setSeverity(Number.parseInt(value))}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="bulk-severity-mild" />
            <Label htmlFor="bulk-severity-mild" className="text-white/70">
              Mild
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="bulk-severity-moderate" />
            <Label htmlFor="bulk-severity-moderate" className="text-white/70">
              Moderate
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="bulk-severity-severe" />
            <Label htmlFor="bulk-severity-severe" className="text-white/70">
              Severe
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Symptoms</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {symptomTypes.map((symptom) => (
            <div key={symptom} className="flex items-center space-x-2">
              <Checkbox
                id={`bulk-symptom-${symptom}`}
                checked={selectedSymptoms[symptom]}
                onCheckedChange={() => toggleSymptom(symptom)}
              />
              <Label htmlFor={`bulk-symptom-${symptom}`} className="text-sm text-white/70">
                {symptom}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-notes" className="text-white/80">
          Notes
        </Label>
        <Textarea
          id="bulk-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about these symptoms..."
          className="min-h-[100px] glass border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onCancel} type="button" className="glass-button">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          Save Symptoms
        </Button>
      </div>
    </div>
  )
}

// Symptom Form Component with glass styling
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
        weather: null,
      }

      onSubmit(newEntry)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label className="text-white/80">Severity</Label>
        <RadioGroup value={severity.toString()} onValueChange={(value) => setSeverity(Number.parseInt(value))}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="severity-mild" />
            <Label htmlFor="severity-mild" className="text-white/70">
              Mild
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="severity-moderate" />
            <Label htmlFor="severity-moderate" className="text-white/70">
              Moderate
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="severity-severe" />
            <Label htmlFor="severity-severe" className="text-white/70">
              Severe
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Symptoms</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
          {symptomTypes.map((symptom) => (
            <div key={symptom} className="flex items-center space-x-2">
              <Checkbox
                id={`symptom-${symptom}`}
                checked={selectedSymptoms[symptom]}
                onCheckedChange={() => toggleSymptom(symptom)}
              />
              <Label htmlFor={`symptom-${symptom}`} className="text-sm text-white/70">
                {symptom}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-white/80">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about these symptoms..."
          className="min-h-[100px] glass border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onCancel} type="button" className="glass-button">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          Save Symptoms
        </Button>
      </div>
    </div>
  )
}
