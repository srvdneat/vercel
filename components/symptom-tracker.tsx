"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth } from "date-fns"
import { BarChart2, Pill, Cloud, Phone, Brain, TrendingUp, Calendar, Plus, Settings, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { initializeNotifications } from "@/lib/notifications"

import SymptomForm from "@/components/symptom-form"
import SymptomChart from "@/components/symptom-chart"
import HealthCalendar from "@/components/health-calendar"
import MedicationTracker from "@/components/medication-tracker"
import WeatherDisplay from "@/components/weather-display"
import EmergencyContacts from "@/components/emergency-contacts"
import AIInsights from "@/components/ai-insights"
import AIPatternVisualization from "@/components/ai-pattern-visualization"
import SymptomSettings from "@/components/symptom-settings"
import AuthWrapper from "@/components/auth/auth-wrapper"
import SignOutButton from "@/components/auth/sign-out-button"

// Default symptom types for inflammatory diseases
export const DEFAULT_SYMPTOM_TYPES = [
  "Joint Pain",
  "Joint Stiffness",
  "Swelling",
  "Fatigue",
  "Morning Stiffness",
  "Muscle Pain",
  "Headache",
  "Fever",
  "Skin Rash",
  "Eye Inflammation",
  "Digestive Issues",
  "Sleep Problems",
]

// Types
export interface WeatherData {
  temperature?: number
  humidity?: number
  pressure?: number
  description?: string
  icon?: string
  windSpeed?: number
  uvIndex?: number
  feelsLike?: number
}

export interface SymptomEntry {
  id: string
  date: Date
  severity: number
  symptoms: Record<string, boolean>
  notes: string
  weather?: WeatherData
}

export interface MedicationEntry {
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

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  isPrimary: boolean
  notes?: string
}

export default function SymptomTracker() {
  // State management
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [medications, setMedications] = useState<MedicationEntry[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [symptomTypes, setSymptomTypes] = useState<string[]>(DEFAULT_SYMPTOM_TYPES)
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()))
  const [activeTab, setActiveTab] = useState("symptoms")
  const [isAddingSymptom, setIsAddingSymptom] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { toast } = useToast()

  // Load data from localStorage on component mount
  useEffect(() => {
    loadData()
    initializeNotifications()
  }, [])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    saveData()
  }, [symptoms, medications, emergencyContacts, symptomTypes])

  const loadData = () => {
    try {
      // Load symptoms
      const savedSymptoms = localStorage.getItem("symptomEntries")
      if (savedSymptoms) {
        const parsed = JSON.parse(savedSymptoms)
        setSymptoms(
          parsed.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          })),
        )
      }

      // Load medications
      const savedMedications = localStorage.getItem("medicationEntries")
      if (savedMedications) {
        const parsed = JSON.parse(savedMedications)
        setMedications(
          parsed.map((entry: any) => ({
            ...entry,
            startDate: new Date(entry.startDate),
            endDate: entry.endDate ? new Date(entry.endDate) : undefined,
          })),
        )
      }

      // Load emergency contacts
      const savedContacts = localStorage.getItem("emergencyContacts")
      if (savedContacts) {
        setEmergencyContacts(JSON.parse(savedContacts))
      }

      // Load symptom types
      const savedTypes = localStorage.getItem("symptomTypes")
      if (savedTypes) {
        setSymptomTypes(JSON.parse(savedTypes))
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error loading data",
        description: "There was an issue loading your saved data.",
        variant: "destructive",
      })
    }
  }

  const saveData = () => {
    try {
      localStorage.setItem("symptomEntries", JSON.stringify(symptoms))
      localStorage.setItem("medicationEntries", JSON.stringify(medications))
      localStorage.setItem("emergencyContacts", JSON.stringify(emergencyContacts))
      localStorage.setItem("symptomTypes", JSON.stringify(symptomTypes))
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }

  // Symptom management functions
  const addSymptom = (symptom: SymptomEntry) => {
    setSymptoms((prev) => {
      const filtered = prev.filter((s) => s.id !== symptom.id)
      return [...filtered, symptom].sort((a, b) => b.date.getTime() - a.date.getTime())
    })
    setIsAddingSymptom(false)
    toast({
      title: "Symptom entry saved",
      description: `Recorded ${symptom.severity === 1 ? "mild" : symptom.severity === 2 ? "moderate" : "severe"} symptoms for ${format(symptom.date, "MMM d, yyyy")}`,
    })
  }

  const updateSymptom = (symptom: SymptomEntry) => {
    setSymptoms((prev) => prev.map((s) => (s.id === symptom.id ? symptom : s)))
    toast({
      title: "Symptom entry updated",
      description: "Your symptom entry has been updated successfully.",
    })
  }

  const deleteSymptom = (id: string) => {
    setSymptoms((prev) => prev.filter((s) => s.id !== id))
    toast({
      title: "Symptom entry deleted",
      description: "The symptom entry has been removed.",
    })
  }

  // Medication management functions
  const addMedication = (medication: MedicationEntry) => {
    setMedications((prev) => [...prev, medication])
    toast({
      title: "Medication added",
      description: `${medication.name} has been added to your medication list.`,
    })
  }

  const updateMedication = (medication: MedicationEntry) => {
    setMedications((prev) => prev.map((m) => (m.id === medication.id ? medication : m)))
    toast({
      title: "Medication updated",
      description: `${medication.name} has been updated.`,
    })
  }

  const deleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  // Emergency contact management functions
  const addEmergencyContact = (contact: EmergencyContact) => {
    setEmergencyContacts((prev) => [...prev, contact])
    toast({
      title: "Emergency contact added",
      description: `${contact.name} has been added to your emergency contacts.`,
    })
  }

  const updateEmergencyContact = (contact: EmergencyContact) => {
    setEmergencyContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)))
    toast({
      title: "Emergency contact updated",
      description: `${contact.name} has been updated.`,
    })
  }

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id))
  }

  // Symptom types management
  const updateSymptomTypes = (types: string[]) => {
    setSymptomTypes(types)
    toast({
      title: "Symptom types updated",
      description: "Your symptom categories have been updated.",
    })
  }

  // Navigation items
  const navItems = [
    {
      id: "symptoms",
      label: "Symptoms",
      icon: <BarChart2 className="h-4 w-4" />,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
      gradient: "from-green-500 to-emerald-500",
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

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="floating-orbs"></div>

        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-black/90 border-white/20">
                  <SheetHeader>
                    <SheetTitle className="text-white">Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "default" : "ghost"}
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          setActiveTab(item.id)
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-xl font-light tracking-wide bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Inflammatory Disease Companion
                </h1>
                <p className="text-sm text-white/60 hidden sm:block">Track, analyze, and manage your symptoms</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/90 border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>Symptom Settings</DialogTitle>
                  </DialogHeader>
                  <SymptomSettings symptomTypes={symptomTypes} onUpdate={updateSymptomTypes} />
                </DialogContent>
              </Dialog>

              <SignOutButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 glass border-r border-white/10 min-h-screen">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 transition-all duration-300 ${
                    activeTab === item.id
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg glow-primary`
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Quick Add Button */}
              {activeTab === "symptoms" && (
                <div className="mb-6">
                  <Dialog open={isAddingSymptom} onOpenChange={setIsAddingSymptom}>
                    <DialogTrigger asChild>
                      <Button className="glass-button border-white/20 hover:glow-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Symptom Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle>Add Symptom Entry</DialogTitle>
                      </DialogHeader>
                      <SymptomForm
                        date={selectedDate}
                        symptomTypes={symptomTypes}
                        onSubmit={addSymptom}
                        onCancel={() => setIsAddingSymptom(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Content based on active tab */}
              {activeTab === "symptoms" && (
                <SymptomChart symptoms={symptoms} symptomTypes={symptomTypes} month={currentMonth} />
              )}

              {activeTab === "calendar" && <HealthCalendar className="w-full" />}

              {activeTab === "medications" && (
                <MedicationTracker
                  medications={medications}
                  onAddMedication={addMedication}
                  onUpdateMedication={updateMedication}
                  onDeleteMedication={deleteMedication}
                />
              )}

              {activeTab === "weather" && (
                <WeatherDisplay symptoms={symptoms} currentDate={new Date()} onUpdateSymptom={updateSymptom} />
              )}

              {activeTab === "emergency" && (
                <EmergencyContacts
                  contacts={emergencyContacts}
                  onAddContact={addEmergencyContact}
                  onUpdateContact={updateEmergencyContact}
                  onDeleteContact={deleteEmergencyContact}
                />
              )}

              {activeTab === "insights" && (
                <AIInsights symptoms={symptoms} medications={medications} symptomTypes={symptomTypes} />
              )}

              {activeTab === "patterns" && (
                <AIPatternVisualization symptoms={symptoms} medications={medications} symptomTypes={symptomTypes} />
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  )
}
