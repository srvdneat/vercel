import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SymptomTrackerForm from "./symptom-tracker-form"
import SymptomChart from "./symptom-chart"
import HealthCalendar from "./health-calendar"

const SymptomTracker = () => {
  return (
    <Tabs defaultValue="tracker" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="tracker">Tracker</TabsTrigger>
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="medications">Medications</TabsTrigger>
        <TabsTrigger value="weather">Weather</TabsTrigger>
        <TabsTrigger value="emergency">Emergency</TabsTrigger>
      </TabsList>
      <TabsContent value="tracker" className="space-y-4">
        <SymptomTrackerForm />
      </TabsContent>
      <TabsContent value="chart" className="space-y-4">
        <SymptomChart />
      </TabsContent>
      <TabsContent value="calendar" className="space-y-4">
        <HealthCalendar />
      </TabsContent>
      <TabsContent value="medications" className="space-y-4">
        Medications Content
      </TabsContent>
      <TabsContent value="weather" className="space-y-4">
        Weather Content
      </TabsContent>
      <TabsContent value="emergency" className="space-y-4">
        Emergency Content
      </TabsContent>
    </Tabs>
  )
}

export default SymptomTracker
