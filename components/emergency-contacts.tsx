"use client"

import { useState } from "react"
import { Phone, Plus, Trash2, Edit, Star, AlertTriangle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

export type EmergencyContact = {
  id: string
  name: string
  relationship: string
  phone: string
  isPrimary: boolean
  notes?: string
}

interface EmergencyContactsProps {
  contacts: EmergencyContact[]
  onAddContact: (contact: EmergencyContact) => void
  onUpdateContact: (contact: EmergencyContact) => void
  onDeleteContact: (id: string) => void
}

export default function EmergencyContacts({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}: EmergencyContactsProps) {
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)

  const handleAddOrUpdate = (contact: EmergencyContact) => {
    if (editingContact) {
      onUpdateContact(contact)
    } else {
      onAddContact(contact)
    }
    setEditingContact(null)
  }

  const setPrimaryContact = (id: string) => {
    // Update all contacts to set only the selected one as primary
    contacts.forEach((contact) => {
      if (contact.id === id && !contact.isPrimary) {
        onUpdateContact({ ...contact, isPrimary: true })
      } else if (contact.id !== id && contact.isPrimary) {
        onUpdateContact({ ...contact, isPrimary: false })
      }
    })
  }

  // Brisbane emergency services
  const brisbaneEmergencyServices = [
    {
      name: "Emergency Services",
      phone: "000",
      description: "Police, Fire, Ambulance",
    },
    {
      name: "Queensland Health",
      phone: "13 43 25 84",
      description: "Health advice line",
    },
    {
      name: "Poisons Information Centre",
      phone: "13 11 26",
      description: "Advice for poisoning or suspected poisoning",
    },
    {
      name: "Royal Brisbane and Women's Hospital",
      phone: "07 3646 8111",
      description: "Major Brisbane hospital",
    },
    {
      name: "Princess Alexandra Hospital",
      phone: "07 3176 2111",
      description: "Major Brisbane hospital",
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>Manage your emergency contacts for quick access</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingContact(null)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
              </DialogHeader>
              <ContactForm
                existingContact={editingContact}
                onSubmit={handleAddOrUpdate}
                hasPrimary={contacts.some((c) => c.isPrimary)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-4">
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No emergency contacts added yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add important contacts for quick access during emergencies.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <Card key={contact.id} className={`border ${contact.isPrimary ? "border-primary" : "border-border"}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-base">{contact.name}</h3>
                            {contact.isPrimary && <Star className="h-4 w-4 fill-primary text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPrimaryContact(contact.id)}
                            disabled={contact.isPrimary}
                            title="Set as primary contact"
                            className="h-7 w-7"
                          >
                            <Star className={`h-3.5 w-3.5 ${contact.isPrimary ? "fill-primary text-primary" : ""}`} />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingContact(contact)}
                                className="h-7 w-7"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Contact</DialogTitle>
                              </DialogHeader>
                              <ContactForm
                                existingContact={contact}
                                onSubmit={handleAddOrUpdate}
                                hasPrimary={contacts.some((c) => c.isPrimary && c.id !== contact.id)}
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
                                <DialogTitle>Delete Contact</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                <p>Are you sure you want to delete {contact.name}?</p>
                                <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={() => onDeleteContact(contact.id)}>
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="mt-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </a>
                      </div>

                      {contact.notes && <div className="mt-2 text-xs text-muted-foreground">{contact.notes}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start p-4 border-t">
          <h3 className="text-sm font-medium mb-2">Brisbane Emergency Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {brisbaneEmergencyServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.description}</div>
                </div>
                <a
                  href={`tel:${service.phone}`}
                  className="flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  <Phone className="h-3 w-3" />
                  {service.phone}
                </a>
              </div>
            ))}
          </div>

          <Alert className="mt-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-sm text-red-500">
              In case of a medical emergency, call 000 immediately.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  )
}

interface ContactFormProps {
  existingContact: EmergencyContact | null
  onSubmit: (contact: EmergencyContact) => void
  hasPrimary: boolean
}

function ContactForm({ existingContact, onSubmit, hasPrimary }: ContactFormProps) {
  const [name, setName] = useState(existingContact?.name || "")
  const [relationship, setRelationship] = useState(existingContact?.relationship || "")
  const [phone, setPhone] = useState(existingContact?.phone || "")
  const [notes, setNotes] = useState(existingContact?.notes || "")
  const [isPrimary, setIsPrimary] = useState(existingContact?.isPrimary || !hasPrimary)

  const handleSubmit = () => {
    if (!name || !relationship || !phone) {
      return
    }

    const contact: EmergencyContact = {
      id: existingContact?.id || uuidv4(),
      name,
      relationship,
      phone,
      notes,
      isPrimary,
    }

    onSubmit(contact)
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter contact name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">Relationship</Label>
        <Input
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="e.g., Doctor, Family Member, Specialist"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="primary" checked={isPrimary} onCheckedChange={setIsPrimary} disabled={existingContact?.isPrimary} />
        <Label htmlFor="primary">Set as primary contact</Label>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSubmit}>{existingContact ? "Update" : "Add"} Contact</Button>
      </DialogFooter>
    </div>
  )
}
