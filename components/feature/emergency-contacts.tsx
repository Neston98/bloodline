import { Phone, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EmergencyContact } from "@/types"

interface EmergencyContactsProps {
  contacts: EmergencyContact[]
}

export function EmergencyContacts({ contacts }: EmergencyContactsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{contact.name}</p>
                  <p className="text-xs text-gray-900">{contact.relation}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5" />
                <span>{contact.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
