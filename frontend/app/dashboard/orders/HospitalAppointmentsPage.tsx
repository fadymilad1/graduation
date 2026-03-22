'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FiShoppingCart } from 'react-icons/fi'
import { getHospitalAppointments, saveHospitalAppointments, type HospitalAppointment } from '@/lib/appointments'

export default function HospitalAppointmentsPage() {
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([])
  const [loading, setLoading] = useState(true)

  const loadAppointments = useCallback(() => {
    setAppointments(getHospitalAppointments())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const updateAppointmentStatus = (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status } : a))
      saveHospitalAppointments(next)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-neutral-gray">Loading appointments…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden px-0 sm:px-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-dark mb-1 sm:mb-2">
          Appointments
        </h1>
        <p className="text-xs sm:text-sm text-neutral-gray">
          Patient appointments from your hospital website. Manage them here.
        </p>
      </div>

      {appointments.length === 0 && (
        <Card className="p-6 sm:p-8 text-center">
          <FiShoppingCart className="mx-auto mb-3 sm:mb-4 text-neutral-gray" size={40} />
          <p className="text-sm sm:text-base text-neutral-gray">No appointments yet.</p>
          <p className="text-xs sm:text-sm text-neutral-gray mt-1">
            Appointments from your hospital website will appear here.
          </p>
        </Card>
      )}

      {appointments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {appointments.map((apt) => {
            const isPending = apt.status === 'pending'
            const isCompleted = apt.status === 'completed'
            const isCancelled = apt.status === 'cancelled'
            const statusBg = isCompleted
              ? 'bg-green-100 text-green-800'
              : isCancelled
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            return (
              <Card
                key={apt.id}
                className="p-4 sm:p-5 border border-neutral-border hover:shadow-md transition-shadow flex flex-col min-w-0"
              >
                <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3 min-w-0">
                  <span className="font-semibold text-neutral-dark text-sm sm:text-base truncate">
                    {apt.patientName}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 sm:py-1 rounded flex-shrink-0 ${statusBg}`}
                  >
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-neutral-gray truncate">{apt.patientEmail}</p>
                {apt.doctorName && (
                  <p className="text-sm text-primary mt-1">Dr. {apt.doctorName}</p>
                )}
                <p className="text-xs text-neutral-dark mt-1">{apt.department}</p>
                <p className="text-xs text-neutral-gray mt-1">
                  {apt.preferredDate} • {apt.preferredTime}
                </p>
                {apt.reason && (
                  <p className="text-xs text-neutral-gray mt-1 line-clamp-2">{apt.reason}</p>
                )}
                <p className="text-xs text-neutral-gray mt-1">
                  {new Date(apt.createdAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 border-t border-neutral-border">
                  {isPending && (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        className="text-xs sm:text-sm py-2 px-3 min-h-[36px] sm:min-h-[40px]"
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                      >
                        Mark completed
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs sm:text-sm py-2 px-3 min-h-[36px] sm:min-h-[40px]"
                        onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
