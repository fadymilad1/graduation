'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiMapPin, FiPhoneCall, FiClock, FiSearch, FiUser, FiStar } from 'react-icons/fi'
import { getSiteItem, getStoredUser, setSiteOwnerId, getSiteOwnerId } from '@/lib/storage'
import { addHospitalAppointment, getAvailableSlots } from '@/lib/appointments'
import { getDoctorReviews, getDoctorRatingStats } from '@/lib/reviews'
import { AIChatbot } from '@/components/pharmacy/AIChatbot'

type Doctor = {
  name: string
  title: string
  specialization: string
  email: string
  experience: string
  photoData?: string | null
  certificatesData?: string[]
  slots?: Array<{ dayOfWeek: number; time: string }>
}

type Department = {
  name: string
  doctors: Doctor[]
}

function formatValue(val: string): string {
  if (!val?.trim()) return val || ''
  return val
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

type SelectedFeatures = {
  theme?: 'classic' | 'modern' | 'minimal'
  reviewSystem?: boolean
  aiChatbot?: boolean
  departments?: Department[]
}

type BusinessInfo = {
  name?: string
  logo?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  workingHours?: Record<string, { open?: string; close?: string; closed?: boolean }>
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

type DoctorWithDept = Doctor & { department: string }

export default function HospitalDoctorsPage() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [features, setFeatures] = useState<SelectedFeatures | null>(null)
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithDept | null>(null)
  const [bookingDoctor, setBookingDoctor] = useState<DoctorWithDept | null>(null)
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    preferredDate: '',
    preferredTime: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (user?.id) setSiteOwnerId(user.id)
    setBusinessInfo(safeJsonParse<BusinessInfo>(getSiteItem('businessInfo')))
    setFeatures(safeJsonParse<SelectedFeatures>(getSiteItem('selectedFeatures')))
  }, [])

  useEffect(() => {
    setSelectedSlot(null)
  }, [bookingDoctor])


  const brand = useMemo(() => {
    const name = businessInfo?.name?.trim() || 'Your Hospital'
    const logo = businessInfo?.logo || null
    const address = businessInfo?.address || 'Hospital address not set yet'
    const phone = businessInfo?.contactPhone || 'Phone number not set'
    const email = businessInfo?.contactEmail || ''
    const workingHours = businessInfo?.workingHours
    let openHours = 'Working hours not set'
    if (workingHours?.monday && !workingHours.monday.closed && workingHours.monday.open && workingHours.monday.close) {
      openHours = `Mon–Fri ${workingHours.monday.open}–${workingHours.monday.close}`
    }
    return { name, logo, address, phone, email, openHours }
  }, [businessInfo])

  const hasReviews = Boolean(features?.reviewSystem)
  const hasAIChatbot = Boolean(features?.aiChatbot)
  const departments = (features?.departments || []).filter((d) => d.name?.trim())
  const siteOwnerId = getSiteOwnerId() || getStoredUser()?.id

  const allDoctors: DoctorWithDept[] = useMemo(() => {
    return departments.flatMap((dept) =>
      dept.doctors
        .filter((d) => d.name?.trim())
        .map((d) => ({ ...d, department: dept.name }))
    )
  }, [departments])

  const specialties = useMemo(() => {
    const set = new Set<string>()
    allDoctors.forEach((d) => {
      const s = (d.specialization || '').trim()
      if (s) set.add(s)
    })
    return Array.from(set).sort()
  }, [allDoctors])

  const filteredDoctors = useMemo(() => {
    let result = allDoctors
    if (specialtyFilter) {
      result = result.filter(
        (d) => (d.specialization || '').toLowerCase() === specialtyFilter.toLowerCase()
      )
    }
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter((d) => {
        const matchName = d.name.toLowerCase().includes(q)
        const matchDept = d.department.toLowerCase().includes(q)
        const matchSpec = (d.specialization || '').toLowerCase().includes(q)
        const matchTitle = (d.title || '').toLowerCase().includes(q)
        return matchName || matchDept || matchSpec || matchTitle
      })
    }
    return result
  }, [allDoctors, search, specialtyFilter])

  const theme = features?.theme || 'classic'
  const themeClasses = useMemo(() => {
    switch (theme) {
      case 'modern':
        return {
          pageBg: 'bg-gradient-to-br from-cyan-100 via-sky-50 to-indigo-100',
          headerBg: 'bg-white/90 backdrop-blur shadow-md text-neutral-dark',
          headerBorder: 'border-cyan-300/70',
          cardBg: 'bg-white/95 shadow-xl border border-cyan-200',
        }
      case 'minimal':
        return { pageBg: 'bg-white', headerBg: 'bg-white', headerBorder: 'border-neutral-border', cardBg: 'bg-white shadow-sm' }
      default:
        return {
          pageBg: 'bg-gradient-to-b from-sky-50 via-white to-blue-50',
          headerBg: 'bg-white/90 backdrop-blur shadow-sm',
          headerBorder: 'border-sky-100',
          cardBg: 'bg-white/95 shadow-md',
        }
    }
  }, [theme])

  const availableSlots = useMemo(() => {
    if (!bookingDoctor?.name || !bookingDoctor?.department) return []
    return getAvailableSlots(
      bookingDoctor.slots || [],
      bookingDoctor.name,
      bookingDoctor.department,
      siteOwnerId || undefined
    )
  }, [bookingDoctor?.name, bookingDoctor?.department, bookingDoctor?.slots, siteOwnerId])

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return
    const ownerId = getSiteOwnerId() || getStoredUser()?.id
    addHospitalAppointment(
      {
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
        department: bookingDoctor?.department || '',
        doctorName: bookingDoctor?.name,
        preferredDate: selectedSlot.date,
        preferredTime: selectedSlot.time,
        reason: '',
      },
      ownerId || undefined
    )
    setSubmitted(true)
    setFormData({ patientName: '', patientEmail: '', patientPhone: '', preferredDate: '', preferredTime: '' })
    setSelectedSlot(null)
    setBookingDoctor(null)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div className={`min-h-screen ${themeClasses.pageBg} text-neutral-dark`}>
      <header className={`${themeClasses.headerBg} border-b ${themeClasses.headerBorder}`}>
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {brand.logo && (
              <div className="relative h-12 w-12 rounded-full overflow-hidden border border-neutral-border bg-neutral-light">
                <Image src={brand.logo} alt={brand.name} fill className="object-cover" sizes="48px" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{brand.name}</h1>
              <p className="text-xs sm:text-sm text-neutral-gray flex items-center gap-2">
                <FiMapPin className="inline-block" /> {brand.address}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/templates/hospital" className="text-sm font-medium opacity-90 hover:opacity-100">
              Home
            </Link>
            <Link href="/templates/hospital/doctors" className="text-sm font-medium opacity-100 underline">
              Doctors
            </Link>
          </nav>
          <div className="flex flex-col items-end gap-1 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <FiPhoneCall className="text-primary" />
              <span>{brand.phone}</span>
            </div>
            {brand.email && (
              <a href={`mailto:${brand.email}`} className="text-primary hover:underline">
                {brand.email}
              </a>
            )}
            <div className="flex items-center gap-2 text-neutral-gray">
              <FiClock />
              <span>{brand.openHours}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <section className="relative rounded-2xl overflow-hidden h-48 sm:h-56 shadow-lg transition-transform duration-500 hover:-translate-y-1 hover:shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&q=80"
            alt="Our medical team"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">Doctors & Departments</h2>
            <p className="text-sm text-white/90">
              Meet our physicians. Search by name, department, or specialization—then view profiles and book appointments.
            </p>
          </div>
        </section>

        <div>
          <p className="text-sm text-neutral-gray leading-relaxed max-w-2xl">
            Our board-certified physicians bring expertise across multiple specialties. Use the search box below to find the right doctor for your needs. Click &quot;View profile&quot; to see full details, or &quot;Reserve appointment&quot; to schedule a visit.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray" size={18} />
            <input
              type="search"
              placeholder="Search doctors, departments, specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-border bg-white text-neutral-dark placeholder:text-neutral-gray focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-neutral-border bg-white text-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[180px]"
            aria-label="Filter by specialty"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {formatValue(s)}
              </option>
            ))}
          </select>
        </div>

        {allDoctors.length === 0 ? (
          <div className={`${themeClasses.cardBg} border border-neutral-border rounded-xl p-8 text-center`}>
            <FiUser className="mx-auto mb-4 text-neutral-gray" size={48} />
            <p className="text-neutral-gray">No doctors added yet. Add departments and doctors in Hospital Setup.</p>
            <Link href="/dashboard/hospital/setup" className="inline-block mt-4 text-primary hover:underline text-sm">
              Go to Hospital Setup
            </Link>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className={`${themeClasses.cardBg} border border-neutral-border rounded-xl p-8 text-center`}>
            <p className="text-neutral-gray">No doctors match &quot;{search}&quot;. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor, i) => (
              <div
                key={i}
                className={`${themeClasses.cardBg} border border-neutral-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {doctor.photoData ? (
                    <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border border-neutral-border">
                      <img
                        src={doctor.photoData}
                        alt={formatValue(doctor.name) || 'Doctor'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-xl">
                      {(doctor.name || 'D').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-dark">Name: {formatValue(doctor.name || 'Doctor')}</p>
                    {doctor.title && (
                      <p className="text-xs text-neutral-gray">Title: {formatValue(doctor.title)}</p>
                    )}
                    {doctor.specialization && (
                      <p className="text-xs text-neutral-gray">Specialization: {formatValue(doctor.specialization)}</p>
                    )}
                    <p className="text-xs text-primary mt-1">Department: {formatValue(doctor.department)}</p>
                    {hasReviews && (() => {
                      const stats = getDoctorRatingStats(doctor.name, doctor.department, siteOwnerId)
                      if (stats.count === 0) return null
                      return (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <FiStar className="fill-current" size={12} />
                          {stats.average} ({stats.count} review{stats.count !== 1 ? 's' : ''})
                        </p>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-border text-sm font-medium hover:bg-neutral-light transition-colors"
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingDoctor(doctor)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Reserve appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {submitted && (
          <div className="fixed bottom-4 right-4 px-4 py-3 rounded-lg bg-green-600 text-white text-sm shadow-lg z-50">
            Appointment request submitted. The hospital will contact you shortly.
          </div>
        )}
      </main>

      {/* Doctor profile modal */}
      {selectedDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedDoctor(null)}
        >
          <div
            className={`${themeClasses.cardBg} rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              {selectedDoctor.photoData ? (
                <div className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border border-neutral-border">
                  <img
                    src={selectedDoctor.photoData}
                    alt={formatValue(selectedDoctor.name) || 'Doctor'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-2xl">
                  {(selectedDoctor.name || 'D').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-neutral-dark">Name: {formatValue(selectedDoctor.name || 'Doctor')}</h3>
                <p className="text-sm text-primary">Department: {formatValue(selectedDoctor.department)}</p>
                {selectedDoctor.title && (
                  <p className="text-sm text-neutral-gray">Title: {formatValue(selectedDoctor.title)}</p>
                )}
                {selectedDoctor.specialization && (
                  <p className="text-sm text-neutral-gray">Specialization: {formatValue(selectedDoctor.specialization)}</p>
                )}
              </div>
            </div>
            {selectedDoctor.experience && (
              <p className="text-sm text-neutral-gray mb-4">
                <span className="font-medium text-neutral-dark">Experience:</span> {formatValue(selectedDoctor.experience)}
              </p>
            )}
            {selectedDoctor.email && (
              <p className="text-sm text-neutral-gray mb-4">
                <span className="font-medium text-neutral-dark">Email:</span>{' '}
                <a href={`mailto:${selectedDoctor.email}`} className="text-primary hover:underline">
                  {selectedDoctor.email}
                </a>
              </p>
            )}
            {selectedDoctor.certificatesData && selectedDoctor.certificatesData.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-neutral-dark mb-2">Certificates:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.certificatesData.map((dataUrl, idx) => (
                    dataUrl.startsWith('data:image/') ? (
                      <a key={idx} href={dataUrl} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded border border-neutral-border overflow-hidden hover:opacity-90">
                        <img src={dataUrl} alt={`Certificate ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ) : (
                      <a key={idx} href={dataUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-border text-sm text-primary hover:bg-neutral-light">
                        📄 Certificate {idx + 1}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            {hasReviews && (
              <div className="mb-4 pt-4 border-t border-neutral-border">
                <p className="text-sm font-medium text-neutral-dark mb-2">Reviews</p>
                {(() => {
                  const reviews = getDoctorReviews(selectedDoctor.name, selectedDoctor.department, siteOwnerId)
                  const stats = getDoctorRatingStats(selectedDoctor.name, selectedDoctor.department, siteOwnerId)
                  return (
                    <>
                      {stats.count > 0 && (
                        <p className="text-sm text-neutral-gray mb-3 flex items-center gap-1">
                          <FiStar className="fill-amber-500 text-amber-500" size={16} />
                          {stats.average} ({stats.count} review{stats.count !== 1 ? 's' : ''})
                        </p>
                      )}
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {reviews.length === 0 ? (
                          <p className="text-xs text-neutral-gray">No reviews yet. Reviews are collected after appointments via email.</p>
                        ) : (
                          reviews.map((r) => (
                            <div key={r.id} className="text-sm p-2 rounded-lg bg-neutral-light">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-neutral-dark">{formatValue(r.reviewerName)}</span>
                                <span className="flex items-center gap-0.5 text-amber-600">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <FiStar key={n} size={12} className={n <= r.rating ? 'fill-current' : ''} />
                                  ))}
                                </span>
                                <span className="text-xs text-neutral-gray">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-neutral-gray text-xs">{r.comment}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null)
                setBookingDoctor(selectedDoctor)
              }}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark"
            >
              Reserve appointment
            </button>
            <button
              type="button"
              onClick={() => setSelectedDoctor(null)}
              className="w-full mt-2 py-2 rounded-lg border border-neutral-border font-medium hover:bg-neutral-light"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Booking form modal */}
      {bookingDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setBookingDoctor(null)}
        >
          <div
            className={`${themeClasses.cardBg} rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Reserve appointment</h3>
            <p className="text-sm text-neutral-gray mb-4">
              with {formatValue(bookingDoctor.name)} • {formatValue(bookingDoctor.department)}
            </p>
            <form onSubmit={handleReserve} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Your full name"
                value={formData.patientName}
                onChange={(e) => setFormData((p) => ({ ...p, patientName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-border"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={formData.patientEmail}
                onChange={(e) => setFormData((p) => ({ ...p, patientEmail: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-border"
              />
              <input
                type="tel"
                required
                placeholder="Phone"
                value={formData.patientPhone}
                onChange={(e) => setFormData((p) => ({ ...p, patientPhone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-border"
              />
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Select a time slot</label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-neutral-gray py-3 px-4 bg-neutral-light rounded-lg">
                    {(!bookingDoctor?.slots || bookingDoctor.slots.length === 0)
                      ? 'No slots configured for this doctor. Please contact the hospital.'
                      : 'No available slots right now. Please check back later.'}
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-neutral-border p-2">
                    {availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot({ date: slot.date, time: slot.time })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                            ? 'bg-primary text-white'
                            : 'hover:bg-neutral-light'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={availableSlots.length === 0 || !selectedSlot}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit request
                </button>
                <button
                  type="button"
                  onClick={() => setBookingDoctor(null)}
                  className="px-4 py-2.5 rounded-lg border border-neutral-border font-medium hover:bg-neutral-light"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {hasAIChatbot && (
        <AIChatbot variant="hospital" pharmacyName={brand.name} pharmacyPhone={brand.phone} />
      )}
    </div>
  )
}
