"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ShieldCheck, ShieldAlert, Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { formatDate } from "@/utils/formatters"
import { recalculateNextEligible } from "@/lib/appointment"
import type { TravelRecord } from "@/types"

interface TravelHistoryProps {
  records: TravelRecord[]
  donorId: string
}

const COUNTRY_CODES: Record<string, string> = {
  afghanistan: "af", albania: "al", algeria: "dz", angola: "ao", argentina: "ar",
  australia: "au", austria: "at", bangladesh: "bd", belgium: "be", bhutan: "bt",
  bolivia: "bo", brazil: "br", brunei: "bn", bulgaria: "bg", "burkina faso": "bf",
  myanmar: "mm", burma: "mm", cambodia: "kh", cameroon: "cm", canada: "ca",
  chad: "td", chile: "cl", china: "cn", colombia: "co", congo: "cd",
  "costa rica": "cr", croatia: "hr", cuba: "cu", "czech republic": "cz",
  denmark: "dk", "dominican republic": "do", ecuador: "ec", egypt: "eg",
  "el salvador": "sv", ethiopia: "et", fiji: "fj", finland: "fi", france: "fr",
  gabon: "ga", germany: "de", ghana: "gh", greece: "gr", guatemala: "gt",
  guyana: "gy", haiti: "ht", honduras: "hn", "hong kong": "hk", hungary: "hu",
  iceland: "is", india: "in", indonesia: "id", iran: "ir", iraq: "iq",
  ireland: "ie", israel: "il", italy: "it", jamaica: "jm", japan: "jp",
  jordan: "jo", kazakhstan: "kz", kenya: "ke", kuwait: "kw", laos: "la",
  latvia: "lv", lebanon: "lb", libya: "ly", lithuania: "lt", luxembourg: "lu",
  macau: "mo", malawi: "mw", malaysia: "my", maldives: "mv", mali: "ml",
  malta: "mt", mauritius: "mu", mexico: "mx", mongolia: "mn", montenegro: "me",
  morocco: "ma", mozambique: "mz", namibia: "na", nepal: "np", netherlands: "nl",
  "new zealand": "nz", nicaragua: "ni", niger: "ne", nigeria: "ng", norway: "no",
  oman: "om", pakistan: "pk", panama: "pa", "papua new guinea": "pg", paraguay: "py",
  peru: "pe", philippines: "ph", poland: "pl", portugal: "pt", qatar: "qa",
  romania: "ro", russia: "ru", rwanda: "rw", "saudi arabia": "sa", senegal: "sn",
  serbia: "rs", singapore: "sg", slovakia: "sk", slovenia: "si", "south africa": "za",
  "south korea": "kr", spain: "es", "sri lanka": "lk", sudan: "sd", suriname: "sr",
  sweden: "se", switzerland: "ch", syria: "sy", taiwan: "tw", tanzania: "tz",
  thailand: "th", "timor-leste": "tl", togo: "tg", "trinidad and tobago": "tt",
  tunisia: "tn", turkey: "tr", uganda: "ug", ukraine: "ua",
  "united arab emirates": "ae", uae: "ae", "united kingdom": "gb", "united states": "us",
  uruguay: "uy", uzbekistan: "uz", venezuela: "ve", vietnam: "vn", yemen: "ye",
  zambia: "zm", zimbabwe: "zw",
}

function countryFlag(country: string) {
  const code = COUNTRY_CODES[country.trim().toLowerCase()]
  if (!code) return <span className="text-sm">🏳️</span>
  return <img src={`https://flagcdn.com/24x18/${code}.png`} alt={country} className="inline-block rounded-sm" />
}

const COUNTRIES = [
  {
    group: "Southeast Asia",
    items: [
      { name: "Brunei", cities: ["Bandar Seri Begawan"] },
      { name: "Cambodia", cities: ["Phnom Penh", "Siem Reap", "Sihanoukville"] },
      { name: "Indonesia", cities: ["Jakarta", "Bali", "Surabaya", "Yogyakarta", "Lombok", "Bandung", "Medan"] },
      { name: "Laos", cities: ["Vientiane", "Luang Prabang"] },
      { name: "Malaysia", cities: ["Kuala Lumpur", "Penang", "Johor Bahru", "Malacca", "Kota Kinabalu", "Kuching", "Langkawi", "Ipoh"] },
      { name: "Myanmar", cities: ["Yangon", "Mandalay", "Naypyidaw", "Bagan"] },
      { name: "Philippines", cities: ["Manila", "Cebu", "Davao", "Boracay", "Palawan", "Tagaytay"] },
      { name: "Singapore", cities: ["Singapore"] },
      { name: "Thailand", cities: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Krabi", "Koh Samui", "Ayutthaya", "Hua Hin"] },
      { name: "Timor-Leste", cities: ["Dili"] },
      { name: "Vietnam", cities: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An", "Nha Trang", "Hue", "Ha Long Bay"] },
    ],
  },
  {
    group: "East Asia",
    items: [
      { name: "China", cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Hong Kong", "Macau", "Chengdu", "Xi'an", "Kunming", "Chongqing", "Nanjing"] },
      { name: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Hokkaido", "Fukuoka", "Nagoya", "Okinawa", "Yokohama", "Nara", "Kobe"] },
      { name: "Mongolia", cities: ["Ulaanbaatar"] },
      { name: "South Korea", cities: ["Seoul", "Busan", "Jeju", "Incheon", "Daegu", "Gyeongju"] },
      { name: "Taiwan", cities: ["Taipei", "Taichung", "Kaohsiung", "Tainan", "Hualien"] },
    ],
  },
  {
    group: "South Asia",
    items: [
      { name: "Bangladesh", cities: ["Dhaka", "Chittagong", "Sylhet"] },
      { name: "Bhutan", cities: ["Thimphu", "Paro"] },
      { name: "India", cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Goa", "Jaipur", "Hyderabad", "Kerala", "Agra", "Varanasi", "Pune", "Ahmedabad"] },
      { name: "Maldives", cities: ["Male", "Malé Atoll"] },
      { name: "Nepal", cities: ["Kathmandu", "Pokhara", "Chitwan"] },
      { name: "Pakistan", cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi"] },
      { name: "Sri Lanka", cities: ["Colombo", "Kandy", "Galle", "Negombo", "Jaffna"] },
    ],
  },
  {
    group: "Europe",
    items: [
      { name: "Austria", cities: ["Vienna", "Salzburg", "Innsbruck"] },
      { name: "Belgium", cities: ["Brussels", "Antwerp", "Bruges", "Ghent"] },
      { name: "Croatia", cities: ["Dubrovnik", "Split", "Zagreb"] },
      { name: "Czech Republic", cities: ["Prague", "Brno", "Karlovy Vary"] },
      { name: "Denmark", cities: ["Copenhagen", "Aarhus"] },
      { name: "Finland", cities: ["Helsinki", "Rovaniemi"] },
      { name: "France", cities: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux", "Strasbourg", "Cannes", "Avignon"] },
      { name: "Germany", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Düsseldorf", "Stuttgart", "Dresden"] },
      { name: "Greece", cities: ["Athens", "Santorini", "Mykonos", "Crete", "Thessaloniki", "Rhodes"] },
      { name: "Hungary", cities: ["Budapest"] },
      { name: "Iceland", cities: ["Reykjavik", "Akureyri", "Keflavik", "Vik", "Husavik", "Isafjordur", "Egilsstadir", "Selfoss", "Hella", "Hofn"] },
      { name: "Ireland", cities: ["Dublin", "Cork", "Galway"] },
      { name: "Italy", cities: ["Rome", "Milan", "Venice", "Florence", "Naples", "Bologna", "Turin", "Verona", "Cinque Terre", "Amalfi"] },
      { name: "Netherlands", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Maastricht"] },
      { name: "Norway", cities: ["Oslo", "Bergen", "Tromsø"] },
      { name: "Poland", cities: ["Warsaw", "Krakow", "Gdansk", "Wroclaw"] },
      { name: "Portugal", cities: ["Lisbon", "Porto", "Faro", "Algarve", "Madeira"] },
      { name: "Romania", cities: ["Bucharest", "Cluj-Napoca", "Brasov"] },
      { name: "Russia", cities: ["Moscow", "Saint Petersburg", "Vladivostok"] },
      { name: "Spain", cities: ["Barcelona", "Madrid", "Valencia", "Seville", "Granada", "Málaga", "Ibiza", "Palma de Mallorca", "Bilbao", "Tenerife"] },
      { name: "Sweden", cities: ["Stockholm", "Gothenburg", "Malmo"] },
      { name: "Switzerland", cities: ["Zurich", "Geneva", "Bern", "Lucerne", "Interlaken", "Zermatt"] },
      { name: "Turkey", cities: ["Istanbul", "Antalya", "Cappadocia", "Izmir", "Bodrum", "Ankara", "Pamukkale"] },
      { name: "Ukraine", cities: ["Kyiv", "Lviv", "Odesa"] },
      { name: "United Kingdom", cities: ["London", "Edinburgh", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Bristol", "Cambridge", "Oxford", "Bath", "Belfast", "Cardiff"] },
    ],
  },
  {
    group: "Middle East & Central Asia",
    items: [
      { name: "Iran", cities: ["Tehran", "Isfahan", "Shiraz", "Mashhad"] },
      { name: "Iraq", cities: ["Baghdad", "Erbil", "Basra"] },
      { name: "Israel", cities: ["Tel Aviv", "Jerusalem", "Haifa", "Eilat"] },
      { name: "Jordan", cities: ["Amman", "Petra", "Dead Sea"] },
      { name: "Kazakhstan", cities: ["Almaty", "Nur-Sultan"] },
      { name: "Kuwait", cities: ["Kuwait City"] },
      { name: "Oman", cities: ["Muscat", "Salalah"] },
      { name: "Qatar", cities: ["Doha"] },
      { name: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"] },
      { name: "Syria", cities: ["Damascus", "Aleppo"] },
      { name: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah"] },
      { name: "Uzbekistan", cities: ["Tashkent", "Samarkand", "Bukhara"] },
      { name: "Yemen", cities: ["Sana'a", "Aden"] },
    ],
  },
  {
    group: "North America",
    items: [
      { name: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Quebec City", "Banff", "Whistler"] },
      { name: "Mexico", cities: ["Mexico City", "Cancun", "Playa del Carmen", "Puerto Vallarta", "Guadalajara", "Tulum", "Cabo San Lucas"] },
      { name: "United States", cities: ["New York", "Los Angeles", "San Francisco", "Chicago", "Miami", "Las Vegas", "Orlando", "Boston", "Seattle", "Washington DC", "Honolulu", "Denver", "Atlanta", "Dallas", "Houston", "San Diego", "Portland", "Nashville", "Austin", "Phoenix"] },
    ],
  },
  {
    group: "Central & South America",
    items: [
      { name: "Argentina", cities: ["Buenos Aires", "Bariloche", "Mendoza", "Cordoba"] },
      { name: "Bolivia", cities: ["La Paz", "Sucre", "Uyuni", "Santa Cruz"] },
      { name: "Brazil", cities: ["Rio de Janeiro", "Sao Paulo", "Brasilia", "Salvador", "Fortaleza", "Manaus", "Florianopolis", "Iguazu Falls"] },
      { name: "Chile", cities: ["Santiago", "Easter Island", "Valparaiso", "Patagonia"] },
      { name: "Colombia", cities: ["Bogota", "Medellin", "Cartagena", "Cali"] },
      { name: "Costa Rica", cities: ["San Jose", "Liberia", "Manuel Antonio", "Arenal"] },
      { name: "Cuba", cities: ["Havana", "Varadero", "Trinidad"] },
      { name: "Dominican Republic", cities: ["Punta Cana", "Santo Domingo", "Puerto Plata"] },
      { name: "Ecuador", cities: ["Quito", "Guayaquil", "Galapagos Islands", "Cuenca"] },
      { name: "El Salvador", cities: ["San Salvador", "Santa Ana"] },
      { name: "Guatemala", cities: ["Guatemala City", "Antigua", "Lake Atitlan"] },
      { name: "Haiti", cities: ["Port-au-Prince", "Cap-Haitien"] },
      { name: "Honduras", cities: ["Tegucigalpa", "Roatan"] },
      { name: "Nicaragua", cities: ["Managua", "Granada", "San Juan del Sur"] },
      { name: "Panama", cities: ["Panama City", "Bocas del Toro"] },
      { name: "Paraguay", cities: ["Asuncion", "Ciudad del Este"] },
      { name: "Peru", cities: ["Lima", "Cusco", "Machu Picchu", "Arequipa", "Iquitos"] },
      { name: "Suriname", cities: ["Paramaribo"] },
      { name: "Uruguay", cities: ["Montevideo", "Punta del Este"] },
      { name: "Venezuela", cities: ["Caracas", "Margarita Island", "Los Roques"] },
    ],
  },
  {
    group: "Oceania",
    items: [
      { name: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast", "Adelaide", "Cairns", "Canberra", "Hobart", "Darwin"] },
      { name: "Fiji", cities: ["Nadi", "Suva", "Denarau"] },
      { name: "New Zealand", cities: ["Auckland", "Wellington", "Christchurch", "Queenstown", "Rotorua", "Dunedin"] },
      { name: "Papua New Guinea", cities: ["Port Moresby", "Lae"] },
    ],
  },
  {
    group: "Africa",
    items: [
      { name: "Egypt", cities: ["Cairo", "Luxor", "Aswan", "Alexandria", "Sharm El Sheikh", "Hurghada"] },
      { name: "Ethiopia", cities: ["Addis Ababa", "Lalibela"] },
      { name: "Ghana", cities: ["Accra", "Kumasi"] },
      { name: "Kenya", cities: ["Nairobi", "Mombasa", "Malindi", "Masai Mara"] },
      { name: "Morocco", cities: ["Marrakech", "Casablanca", "Fes", "Rabat", "Tangier", "Chefchaouen", "Essaouira"] },
      { name: "Nigeria", cities: ["Lagos", "Abuja", "Port Harcourt"] },
      { name: "Senegal", cities: ["Dakar"] },
      { name: "South Africa", cities: ["Cape Town", "Johannesburg", "Durban", "Kruger National Park", "Pretoria", "Port Elizabeth"] },
      { name: "Tanzania", cities: ["Dar es Salaam", "Zanzibar", "Kilimanjaro", "Arusha", "Serengeti"] },
      { name: "Tunisia", cities: ["Tunis", "Hammamet", "Sousse"] },
      { name: "Uganda", cities: ["Kampala"] },
      { name: "Zambia", cities: ["Lusaka", "Livingstone"] },
      { name: "Zimbabwe", cities: ["Harare", "Victoria Falls"] },
    ],
  },
]

function findCountry(name: string) {
  const lower = name.trim().toLowerCase()
  for (const group of COUNTRIES) {
    for (const c of group.items) {
      if (c.name.toLowerCase() === lower) return c
    }
  }
  return null
}


const MALARIA_RISK_COUNTRIES = new Set([
  "thailand", "myanmar", "indonesia", "philippines", "vietnam", "laos",
  "cambodia", "malaysia", "india", "bangladesh", "nepal", "bhutan",
  "pakistan", "sri lanka", "china", "papua new guinea", "timor-leste",
  "afghanistan", "yemen", "oman", "saudi arabia", "iran",
  "nigeria", "ghana", "kenya", "tanzania", "uganda", "ethiopia",
  "democratic republic of the congo", "angola", "mozambique", "zambia",
  "zimbabwe", "cameroon", "ivory coast", "mali", "burkina faso",
  "togo", "benin", "niger", "chad", "sudan", "south sudan",
  "rwanda", "burundi", "malawi", "botswana", "namibia", "south africa",
  "brazil", "colombia", "peru", "venezuela", "ecuador", "guyana",
  "suriname", "french guiana", "bolivia", "paraguay", "panama",
  "honduras", "guatemala", "nicaragua", "costa rica", "el salvador",
  "haiti", "dominican republic", "mexico",
])

function isMalariaRisk(country: string) {
  return MALARIA_RISK_COUNTRIES.has(country.trim().toLowerCase())
}

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function deriveClearedDate(returnDate: string, country: string): string {
  const d = new Date(returnDate + "T12:00:00")
  if (isMalariaRisk(country)) {
    d.setDate(d.getDate() + 90)
  } else {
    d.setDate(d.getDate() + 14)
  }
  return d.toISOString().slice(0, 10)
}

function deriveStatus(clearedDate: string): "cleared" | "pending" {
  return clearedDate <= todayLocal() ? "cleared" : "pending"
}

function clearanceDays(country: string): number {
  return isMalariaRisk(country) ? 90 : 14
}

function clearanceNote(country: string, returnDate: string): string {
  const days = clearanceDays(country)
  const d = new Date(returnDate + "T12:00:00")
  d.setDate(d.getDate() + days)
  return `${days}-day deferral until ${d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}`
}


export function TravelHistory({ records: initialRecords, donorId }: TravelHistoryProps) {
  const [records, setRecords] = useState(initialRecords.map((r) => ({
    ...r,
    status: deriveStatus(r.cleared_date || r.return_date),
  })))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ country: "", city: "", return_date: "" })
  const [cancelledMsg, setCancelledMsg] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const INP_CLS = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black h-10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (!form.country.trim() || !form.return_date) return
    const tempId = `temp-${Date.now()}`
    const clearedDate = deriveClearedDate(form.return_date, form.country)
    const status = deriveStatus(clearedDate)
    const newRecord: TravelRecord = {
      id: tempId,
      donor_id: donorId,
      country: form.country.trim(),
      city: form.city.trim(),
      return_date: form.return_date,
      cleared_date: clearedDate,
      status,
    }
    setRecords((prev) => [newRecord, ...prev])
    setAdding(false)
    setForm({ country: "", city: "", return_date: "" })

    const { data, error } = await supabase
      .from("travel_history")
      .insert({
        donor_id: donorId,
        country: newRecord.country,
        city: newRecord.city,
        return_date: newRecord.return_date,
        cleared_date: newRecord.cleared_date,
        status: newRecord.status,
      })
      .select()
      .single()
    if (error) {
      console.error("[BloodLine] add travel record error:", error.message)
    } else if (data) {
      setRecords((prev) => prev.map((r) => (r.id === tempId ? { ...data, status: deriveStatus(data.cleared_date || data.return_date) } : r)))
    }
    await handleDeferralEffects(clearedDate)
    router.refresh()
  }

  async function handleSave(id: string) {
    if (!form.country.trim() || !form.return_date) return
    const clearedDate = deriveClearedDate(form.return_date, form.country)
    const status = deriveStatus(clearedDate)
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, country: form.country.trim(), city: form.city.trim(), return_date: form.return_date, cleared_date: clearedDate, status }
          : r,
      ),
    )
    setEditingId(null)
    setForm({ country: "", city: "", return_date: "" })

    const { error } = await supabase
      .from("travel_history")
      .update({ country: form.country.trim(), city: form.city.trim(), return_date: form.return_date, cleared_date: clearedDate, status })
      .eq("id", id)
    if (error) console.error("[BloodLine] update travel record error:", error.message)
    await handleDeferralEffects(clearedDate)
    router.refresh()
  }

  async function handleDeferralEffects(clearedDate: string) {
    if (!clearedDate || clearedDate <= todayLocal()) return

    await recalculateNextEligible(donorId)

    const { data: appts, error: apptErr } = await supabase
      .from("appointments")
      .select("id, appointment_date, time_start, centre_name")
      .eq("donor_id", donorId)
      .in("status", ["scheduled", "fast_pass"])
      .lte("appointment_date", clearedDate)
    if (apptErr) console.error("[BloodLine] fetch appointments error:", apptErr.message)

    if (appts && appts.length > 0) {
      const ids = appts.map((a) => a.id)
      const { error: cancelErr } = await supabase.from("appointments").update({ status: "cancelled" }).in("id", ids)
      if (cancelErr) console.error("[BloodLine] cancel appointments error:", cancelErr.message)

      const dates = appts.map((a) => `${a.appointment_date} ${a.time_start}${a.centre_name ? ` (${a.centre_name})` : ""}`).join(", ")
      setCancelledMsg(`${appts.length} appointment${appts.length > 1 ? "s" : ""} cancelled due to travel deferral: ${dates}`)
      setTimeout(() => setCancelledMsg(null), 8000)
    }
  }

  async function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    const { error } = await supabase.from("travel_history").delete().eq("id", id)
    if (error) console.error("[BloodLine] delete travel record error:", error.message)
    await recalculateNextEligible(donorId)
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)))
    setSelectedIds(new Set())
    const { error } = await supabase.from("travel_history").delete().in("id", ids)
    if (error) console.error("[BloodLine] bulk delete travel error:", error.message)
    await recalculateNextEligible(donorId)
  }

  function startEdit(record: TravelRecord) {
    setEditingId(record.id)
    setForm({ country: record.country, city: record.city, return_date: record.return_date })
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setForm({ country: "", city: "", return_date: "" })
  }

  function cancelEdit() {
    setEditingId(null)
    setAdding(false)
    setForm({ country: "", city: "", return_date: "" })
  }

  function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={INP_CLS}>
        <option value="">Select a country</option>
        {COUNTRIES.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.items.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    )
  }

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Travel History</CardTitle>
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
      <CardContent className="overflow-visible">
        <div className="space-y-3">
          {records.length === 0 && !adding && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No travel history recorded yet.</p>
          )}

          {adding && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DatePicker value={form.return_date} onChange={(v) => setForm({ ...form, return_date: v })} inputCls={INP_CLS} />
                <CountrySelect value={form.country} onChange={(v) => setForm({ ...form, country: v, city: "" })} />
                <input
                  placeholder="City / Region"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={INP_CLS}
                />
              </div>
              {form.country && form.return_date && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{clearanceNote(form.country, form.return_date)}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3.5 w-3.5" />Cancel
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={!form.country.trim() || !form.return_date}>
                  <Check className="mr-1 h-3.5 w-3.5" />Save
                </Button>
              </div>
            </div>
          )}

          {records.map((record) =>
            editingId === record.id ? (
              <div key={record.id} className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-lg">
                    {countryFlag(record.country)}
                  </div>
                  <span className="text-sm font-medium text-black dark:text-gray-100">{record.city ? `${record.city}, ` : ""}{record.country}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DatePicker value={form.return_date} onChange={(v) => setForm({ ...form, return_date: v })} inputCls={INP_CLS} />
                  <CountrySelect value={form.country} onChange={(v) => setForm({ ...form, country: v, city: "" })} />
                  <input
                    placeholder="City / Region"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={INP_CLS}
                  />
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="mr-1 h-3.5 w-3.5" />Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave(record.id)} disabled={!form.country.trim() || !form.return_date}>
                    <Check className="mr-1 h-3.5 w-3.5" />Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={record.id}
                className={`flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors dark:border-gray-700 ${selectedIds.has(record.id) ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20" : ""}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button
                    onClick={() => toggleSelect(record.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors dark:border-gray-600 ${selectedIds.has(record.id) ? "border-red-600 bg-red-600 text-white" : "border-gray-300 bg-white dark:bg-gray-700"}`}
                  >
                    {selectedIds.has(record.id) && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-lg">
                    {countryFlag(record.country)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black dark:text-gray-100">
                      {record.city ? `${record.city}, ` : ""}{record.country}
                    </p>
                    <p className="text-xs text-gray-900 dark:text-gray-300">
                      Returned {formatDate(record.return_date)}
                      {new Date(record.cleared_date || record.return_date) > new Date() && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">· deferring until {formatDate(record.cleared_date)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {record.status === "cleared" ? (
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                  )}
                  <Badge variant={record.status === "cleared" ? "success" : "warning"}>
                    {record.status}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(record)}>
                    <Pencil className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </div>
              </div>
            ),
          )}

          {cancelledMsg && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <span className="font-medium">✕ {cancelledMsg}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
