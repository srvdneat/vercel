"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DEFAULT_SYMPTOM_TYPES } from "@/components/symptom-tracker"

interface SymptomSettingsProps {
  symptomTypes: string[]
  onUpdate: (types: string[]) => void
}

export default function SymptomSettings({ symptomTypes, onUpdate }: SymptomSettingsProps) {
  const [types, setTypes] = useState<string[]>(symptomTypes)
  const [newType, setNewType] = useState("")

  const addType = () => {
    if (newType.trim() && !types.includes(newType.trim())) {
      setTypes([...types, newType.trim()])
      setNewType("")
    }
  }

  const removeType = (index: number) => {
    const newTypes = [...types]
    newTypes.splice(index, 1)
    setTypes(newTypes)
  }

  const resetToDefaults = () => {
    setTypes([...DEFAULT_SYMPTOM_TYPES])
  }

  const handleSubmit = () => {
    onUpdate(types)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Customize Symptom Categories</Label>
        <div className="text-sm text-muted-foreground mb-4">
          Add, remove, or modify symptom categories to track for your condition.
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Add new symptom type"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addType()
              }
            }}
          />
          <Button type="button" onClick={addType} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <ScrollArea className="h-[200px] border rounded-md p-2">
          <div className="space-y-2">
            {types.map((type, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                <span>{type}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeType(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {types.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No symptom types added. Add some above.</div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults} type="button">
          Reset to Defaults
        </Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  )
}
