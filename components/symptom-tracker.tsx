"use client"
import { useState } from "react"
import { BarChart2, Pill, Cloud, Phone, Brain, TrendingUp, Calendar } from "lucide-react"
import SymptomChart from "@/components/symptom-chart"
import HealthCalendar from "@/components/health-calendar"

// Navigation items with enhanced styling
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

const SymptomTracker = () => {
  const [mainView, setMainView] = useState<
    "symptoms" | "calendar" | "medications" | "weather" | "emergency" | "insights" | "patterns"
  >("symptoms")

  return (
    <div>
      {mainView === "symptoms" && <SymptomChart className="w-full" />}
      {mainView === "calendar" && <HealthCalendar className="w-full" />}
    </div>
  )
}

export default SymptomTracker
