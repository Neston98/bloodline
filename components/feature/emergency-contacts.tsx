"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Phone, User, Pencil, Trash2, Plus, X, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { EmergencyContact } from "@/types"

interface EmergencyContactsProps {
  contacts: EmergencyContact[]
  donorId: string
}

export function EmergencyContacts({ contacts: initialContacts, donorId }: EmergencyContactsProps) {
  const [contacts, setContacts] = useState(initialContacts)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", relation: "", phone: "" })

  const supabase = createClient()

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  async function handleAdd() {
    if (!form.name.trim()) return
    const tempId = `temp-${Date.now()}`
    const newContact: EmergencyContact = {
      id: tempId,
      donor_id: donorId,
      name: form.name.trim(),
      relation: form.relation.trim(),
      phone: form.phone.trim(),
    }
    setContacts((prev) => [newContact, ...prev])
    setAdding(false)
    setForm({ name: "", relation: "", phone: "" })

    const { data, error } = await supabase
      .from("emergency_contacts")
      .insert({ donor_id: donorId, name: newContact.name, relation: newContact.relation, phone: newContact.phone })
      .select()
      .single()
    if (error) {
      console.error("[BloodLine] add contact error:", error.message)
    } else if (data) {
      setContacts((prev) => prev.map((c) => (c.id === tempId ? data : c)))
    }
  }

  async function handleSave(id: string) {
    if (!form.name.trim()) return
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: form.name.trim(), relation: form.relation.trim(), phone: form.phone.trim() } : c)),
    )
    setEditingId(null)
    setForm({ name: "", relation: "", phone: "" })

    const { error } = await supabase
      .from("emergency_contacts")
      .update({ name: form.name.trim(), relation: form.relation.trim(), phone: form.phone.trim() })
      .eq("id", id)
    if (error) console.error("[BloodLine] update contact error:", error.message)
  }

  async function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })

    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id)
    if (error) console.error("[BloodLine] delete contact error:", error.message)
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id)))
    setSelectedIds(new Set())

    const { error } = await supabase.from("emergency_contacts").delete().in("id", ids)
    if (error) console.error("[BloodLine] bulk delete error:", error.message)
  }

  function startEdit(contact: EmergencyContact) {
    setEditingId(contact.id)
    setForm({ name: contact.name, relation: contact.relation, phone: contact.phone })
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setForm({ name: "", relation: "", phone: "" })
  }

  function cancelEdit() {
    setEditingId(null)
    setAdding(false)
    setForm({ name: "", relation: "", phone: "" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Emergency Contacts</CardTitle>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" onClick={startAdd}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contacts.length === 0 && !adding && (
            <p className="text-sm text-gray-500">No emergency contacts added yet.</p>
          )}

          {adding && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  placeholder="Relation"
                  value={form.relation}
                  onChange={(e) => setForm({ ...form, relation: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3.5 w-3.5" />Cancel
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={!form.name.trim()}>
                  <Check className="mr-1 h-3.5 w-3.5" />Save
                </Button>
              </div>
            </div>
          )}

          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${selectedIds.has(contact.id) ? "border-red-300 bg-red-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSelect(contact.id)}
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedIds.has(contact.id) ? "border-red-600 bg-red-600 text-white" : "border-gray-300 bg-white"}`}
                >
                  {selectedIds.has(contact.id) && <Check className="h-3 w-3" />}
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <User className="h-4 w-4" />
                </div>

                {editingId === contact.id ? (
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Name"
                      />
                      <input
                        value={form.relation}
                        onChange={(e) => setForm({ ...form, relation: e.target.value })}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Relation"
                      />
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-black">{contact.name}</p>
                      <p className="text-xs text-gray-900">{contact.relation}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingId === contact.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleSave(contact.id)} disabled={!form.name.trim()}>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(contact)}>
                      <Pencil className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(contact.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
