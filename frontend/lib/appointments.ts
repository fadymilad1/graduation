/**
 * Hospital appointments - stored in user-scoped localStorage.
 * When a visitor reserves on the hospital site, we save to the site owner's storage.
 */

import { getScopedItem, setScopedItem, getItemForUser, setItemForUser, getStoragePrefix } from './storage'

export type AppointmentStatus = 'pending' | 'completed' | 'cancelled'

export type HospitalAppointment = {
  id: string
  patientName: string
  patientEmail: string
  patientPhone: string
  department: string
  doctorName?: string
  preferredDate: string
  preferredTime: string
  reason: string
  status: AppointmentStatus
  createdAt: string
}

const APPOINTMENTS_KEY = 'hospitalAppointments'

function getStorage(userId?: string | null) {
  const get = (key: string) =>
    userId ? getItemForUser(userId, key) : getScopedItem(key)
  const set = (key: string, value: string) =>
    userId ? setItemForUser(userId, key, value) : setScopedItem(key, value)
  return { get, set }
}

export function getHospitalAppointments(userId?: string | null): HospitalAppointment[] {
  const { get } = getStorage(userId)
  try {
    const raw = get(APPOINTMENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((a: HospitalAppointment) => ({
      ...a,
      status: a.status || 'pending',
    }))
  } catch {
    return []
  }
}

export function addHospitalAppointment(
  data: Omit<HospitalAppointment, 'id' | 'status' | 'createdAt'>,
  siteOwnerId?: string | null
): HospitalAppointment {
  const storage = getStorage(siteOwnerId)
  const list = getHospitalAppointments(siteOwnerId)
  const id = `APT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const appointment: HospitalAppointment = {
    ...data,
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  list.unshift(appointment)
  storage.set(APPOINTMENTS_KEY, JSON.stringify(list))
  return appointment
}

export function saveHospitalAppointments(
  appointments: HospitalAppointment[],
  userId?: string | null
): void {
  const { set } = getStorage(userId)
  set(APPOINTMENTS_KEY, JSON.stringify(appointments))
}

/** Get set of booked slot keys "date|time" for a doctor (pending or completed, not cancelled) */
export function getBookedSlotKeys(
  doctorName: string,
  department: string,
  siteOwnerId?: string | null
): Set<string> {
  const appointments = getHospitalAppointments(siteOwnerId)
  const set = new Set<string>()
  appointments.forEach((a) => {
    if (a.status === 'cancelled') return
    if (a.doctorName !== doctorName || a.department !== department) return
    set.add(`${a.preferredDate}|${a.preferredTime}`)
  })
  return set
}

export type DoctorSlot = { dayOfWeek: number; time: string }  // 0=Sun..6=Sat, time="09:00"

export type AvailableSlot = { date: string; time: string; label: string }

/** Generate available slots for next N weeks from doctor's recurring slots, excluding booked ones */
export function getAvailableSlots(
  slots: DoctorSlot[],
  doctorName: string,
  department: string,
  siteOwnerId?: string | null,
  weeksAhead = 3
): AvailableSlot[] {
  const booked = getBookedSlotKeys(doctorName, department, siteOwnerId)
  const result: AvailableSlot[] = []
  const now = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let w = 0; w < weeksAhead; w++) {
    for (let d = 0; d < 7; d++) {
      const check = new Date(now)
      check.setDate(check.getDate() + w * 7 + d)
      const dayOfWeek = check.getDay()
      const dateStr = check.toISOString().slice(0, 10)

      slots.forEach((slot) => {
        if (slot.dayOfWeek !== dayOfWeek) return
        const key = `${dateStr}|${slot.time}`
        if (booked.has(key)) return
        const [h, m] = slot.time.split(':').map(Number)
        const slotTime = new Date(check)
        slotTime.setHours(h, m, 0, 0)
        if (slotTime <= now) return  // Skip past slots
        const label = `${dayNames[dayOfWeek]}, ${check.toLocaleDateString()} at ${slot.time}`
        result.push({ date: dateStr, time: slot.time, label })
      })
    }
  }

  return result.slice(0, 50)  // Limit to 50 slots
}

export function getHospitalAppointmentsStats(appointments: HospitalAppointment[]) {
  const total = appointments.length
  const pending = appointments.filter((a) => a.status === 'pending').length
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length
  const completed = appointments.filter((a) => a.status === 'completed').length
  const now = new Date()
  const thisMonth = appointments.filter((a) => {
    const d = new Date(a.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  return { total, pending, cancelled, completed, monthly: thisMonth }
}
