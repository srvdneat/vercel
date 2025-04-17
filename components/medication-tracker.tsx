"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus, Edit, Trash2, Bell, BellOff } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MedicationEntry } from "@/components/symptom-tracker"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { scheduleNotification, cancelNotification } from "@/lib/notifications"

interface MedicationTrackerProps {
  medications: MedicationEntry[]
  onAddMedication: (medication: MedicationEntry) => void
  onUpdateMedication: (medication: MedicationEntry) => void
  onDeleteMedication: (id: string) => void
}

export default function MedicationTracker({
  medications,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
}: MedicationTrackerProps) {
  const [editingMedication, setEditingMedication] = useState<MedicationEntry | null>(null)

  const handleAddOrUpdate = (medication: MedicationEntry) => {
    if (editingMedication) {
      onUpdateMedication(medication)
    } else {
      onAddMedication(medication)
    }
    setEditingMedication(null)
  }

  const handleDelete = (id: string) => {
    // Cancel any notifications for this medication
    const medication = medications.find((m) => m.id === id)
    if (medication && medication.reminderEnabled) {
      medication.times.forEach((time) => {
        cancelNotification(`${medication.id}-${time}`)
      })
    }

    onDeleteMedication(id)
  }

  const toggleReminder = (medication: MedicationEntry) => {
    const updatedMedication = {
      ...medication,
      reminderEnabled: !medication.reminderEnabled,
    }

    // Schedule or cancel notifications
    if (updatedMedication.reminderEnabled) {
      // Schedule notifications for each time
      updatedMedication.times.forEach((time) => {
        scheduleNotification(
          `${medication.id}-${time}`,
          `Time to take ${medication.name}`,
          `Take ${medication.dosage} of ${medication.name}`,
          time,
        )
      })
    } else {
      // Cancel all notifications for this medication
      updatedMedication.times.forEach((time) => {
        cancelNotification(`${medication.id}-${time}`)
      })
    }

    onUpdateMedication(updatedMedication)
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle>Medication Tracker</CardTitle>
            <CardDescription>Track your medications and set reminders</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMedication(null)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMedication ? "Edit Medication" : "Add New Medication"}</DialogTitle>
              </DialogHeader>
              <MedicationForm
                existingMedication={editingMedication}
                onSubmit={handleAddOrUpdate}
                onCancel={() => setEditingMedication(null)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-4">
          {medications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No medications added yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click the "Add Medication" button to start tracking your medications.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {medications.map((medication) => (
                  <Card key={medication.id} className="overflow-hidden border shadow-sm">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-base">{medication.name}</h3>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleReminder(medication)}
                            title={medication.reminderEnabled ? "Disable reminders" : "Enable reminders"}
                            className="h-7 w-7"
                          >
                            {medication.reminderEnabled ? (
                              <Bell className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingMedication(medication)}
                                className="h-7 w-7"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Medication</DialogTitle>
                              </DialogHeader>
                              <MedicationForm
                                existingMedication={medication}
                                onSubmit={handleAddOrUpdate}
                                onCancel={() => setEditingMedication(null)}
                              />
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Medication</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                <p>Are you sure you want to delete {medication.name}?</p>
                                <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={() => handleDelete(medication.id)}>
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-xs">Frequency</p>
                          <p>{medication.frequency}</p>
                        </div>
                        <div>
                          <p className="font-medium text-xs">Times</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medication.times.map((time, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="font-medium text-xs">Duration</p>
                        <p className="text-sm">
                          From {format(new Date(medication.startDate), "MMM d, yyyy")}
                          {medication.endDate
                            ? ` to ${format(new Date(medication.endDate), "MMM d, yyyy")}`
                            : " (ongoing)"}
                        </p>
                      </div>

                      {medication.notes && (
                        <div className="mt-3">
                          <p className="font-medium text-xs">Notes</p>
                          <p className="text-sm text-muted-foreground">{medication.notes}</p>
                        </div>
                      )}

                      {medication.reminderEnabled && (
                        <Alert className="mt-3 bg-primary/5 border-primary/20 py-2">
                          <AlertDescription className="text-xs flex items-center">
                            <Bell className="h-3 w-3 mr-1" />
                            Reminders enabled for this medication
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface MedicationFormProps {
  existingMedication: MedicationEntry | null
  onSubmit: (medication: MedicationEntry) => void
  onCancel?: () => void
}

function MedicationForm({ existingMedication, onSubmit, onCancel }: MedicationFormProps) {
  const [name, setName] = useState(existingMedication?.name || "")
  const [dosage, setDosage] = useState(existingMedication?.dosage || "")
  const [frequency, setFrequency] = useState(existingMedication?.frequency || "daily")
  const [times, setTimes] = useState<string[]>(existingMedication?.times || ["08:00"])
  const [notes, setNotes] = useState(existingMedication?.notes || "")
  const [startDate, setStartDate] = useState(
    existingMedication?.startDate
      ? format(new Date(existingMedication.startDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  )
  const [endDate, setEndDate] = useState(
    existingMedication?.endDate ? format(new Date(existingMedication.endDate), "yyyy-MM-dd") : "",
  )
  const [reminderEnabled, setReminderEnabled] = useState(existingMedication?.reminderEnabled || false)

  const addTimeSlot = () => {
    setTimes([...times, "12:00"])
  }

  const removeTimeSlot = (index: number) => {
    const newTimes = [...times]
    newTimes.splice(index, 1)
    setTimes(newTimes)
  }

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times]
    newTimes[index] = value
    setTimes(newTimes)
  }

  const handleSubmit = () => {
    if (!name || !dosage || !startDate || times.length === 0) {
      return
    }

    const medication: MedicationEntry = {
      id: existingMedication?.id || uuidv4(),
      name,
      dosage,
      frequency,
      times,
      notes,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      reminderEnabled,
    }

    onSubmit(medication)

    // Return to previous screen after submission
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">Medication Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter medication name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dosage">Dosage</Label>
        <Input
          id="dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g., 10mg, 1 tablet"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="twice-daily">Twice Daily</SelectItem>
            <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="as-needed">As Needed</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Times</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTimeSlot} className="h-7 text-xs">
            Add Time
          </Button>
        </div>

        <div className="space-y-2">
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input type="time" value={time} onChange={(e) => updateTime(index, e.target.value)} className="flex-1" />
              {times.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTimeSlot(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reminder">Enable Reminders</Label>
          <Switch id="reminder" checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
        </div>
        {reminderEnabled && (
          <p className="text-xs text-muted-foreground">
            You will receive browser notifications at the specified times to remind you to take your medication.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about this medication..."
          className="min-h-[80px]"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel || (() => {})}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>{existingMedication ? "Update" : "Add"} Medication</Button>
      </DialogFooter>
    </div>
  )
}
