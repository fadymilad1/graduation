'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiMapPin, FiPhoneCall, FiClock, FiCheck, FiAlertTriangle, FiStar } from 'react-icons/fi'
import { getSiteItem, getStoredUser, setSiteOwnerId, getSiteOwnerId } from '@/lib/storage'
import { getDoctorRatingStats } from '@/lib/reviews'
import { AIChatbot } from '@/components/pharmacy/AIChatbot'

type SelectedFeatures = {
  theme?: 'classic' | 'modern' | 'minimal'
  reviewSystem?: boolean
  aiChatbot?: boolean
  ambulanceOrdering?: boolean
  departments?: Array<{
    name: string
    doctors: Array<{
      name: string
      title: string
      specialization: string
      email: string
      experience: string
      photoData?: string | null
      certificatesData?: string[]
    }>
  }>
}

function formatValue(val: string): string {
  if (!val?.trim()) return val || ''
  return val
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

type BusinessInfo = {
  name?: string
  logo?: string
  about?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
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

function HospitalWebsiteContent() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [features, setFeatures] = useState<SelectedFeatures | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (user?.id) setSiteOwnerId(user.id)
    setBusinessInfo(safeJsonParse<BusinessInfo>(getSiteItem('businessInfo')))
    setFeatures(safeJsonParse<SelectedFeatures>(getSiteItem('selectedFeatures')))
  }, [])

  const brand = useMemo(() => {
    const name = businessInfo?.name?.trim() || 'Your Hospital'
    const logo = businessInfo?.logo || null
    const about =
      businessInfo?.about?.trim() ||
      'Modern, patient-centered care with experienced doctors and advanced medical technology.'
    const address = businessInfo?.address || 'Hospital address not set yet'
    const phone = businessInfo?.contactPhone || 'Phone number not set'
    const email = businessInfo?.contactEmail || ''

    const workingHours = businessInfo?.workingHours
    let openHours = 'Working hours not set'
    if (workingHours?.monday && !workingHours.monday.closed && workingHours.monday.open && workingHours.monday.close) {
      openHours = `Mon–Fri ${workingHours.monday.open}–${workingHours.monday.close}`
    }

    return { name, logo, about, address, phone, email, openHours }
  }, [businessInfo])

  const departments = (features?.departments || []).filter((d) => d.name?.trim())
  const siteOwnerId = getSiteOwnerId() || getStoredUser()?.id

  const hasReviews = Boolean(features?.reviewSystem)
  const hasAIChatbot = Boolean(features?.aiChatbot)
  const hasAmbulance = Boolean(features?.ambulanceOrdering)

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
        return {
          pageBg: 'bg-white',
          headerBg: 'bg-white',
          headerBorder: 'border-neutral-border',
          cardBg: 'bg-white shadow-sm',
        }
      default:
        return {
          pageBg: 'bg-gradient-to-b from-sky-50 via-white to-blue-50',
          headerBg: 'bg-white/90 backdrop-blur shadow-sm',
          headerBorder: 'border-sky-100',
          cardBg: 'bg-white/95 shadow-md',
        }
    }
  }, [theme])

  return (
    <div className={`min-h-screen ${themeClasses.pageBg} text-neutral-dark`}>
      {/* Hero */}
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
            <Link
              href="/templates/hospital"
              className="text-sm font-medium opacity-90 hover:opacity-100"
            >
              Home
            </Link>
            <Link
              href="/templates/hospital/doctors"
              className="text-sm font-medium opacity-90 hover:opacity-100"
            >
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

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-12">
        {/* Hero banner with image */}
        <section className="relative rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96 shadow-lg transition-transform duration-500 hover:-translate-y-1 hover:shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80"
            alt="Modern hospital facility"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Compassionate care for you and your family
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-2xl">
              Trust our experienced medical team for comprehensive healthcare. We combine advanced technology with a personal touch to support your wellbeing.
            </p>
          </div>
        </section>

        {/* Intro & CTAs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Welcome to {brand.name}</h2>
            <p className="text-sm sm:text-base text-neutral-gray leading-relaxed">
              {brand.about}
            </p>
            <p className="text-sm text-neutral-gray leading-relaxed">
              From routine check-ups to specialized care, we are committed to providing high-quality healthcare in a comfortable and supportive environment. Our team of board-certified physicians and dedicated staff work together to ensure the best possible outcomes for every patient.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-light text-primary text-xs">
                <FiCheck /> Board-certified doctors
              </span>
              {hasAmbulance && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs">
                  <FiAlertTriangle /> 24/7 ambulance
                </span>
              )}
              {hasAIChatbot && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ai-light text-ai text-xs">
                  <FiStar /> AI assistant enabled
                </span>
              )}
            </div>
          </div>
          {hasAmbulance && (
            <div className={`${themeClasses.cardBg} border border-neutral-border rounded-xl p-4 space-y-3 shadow-sm`}>
              <h3 className="font-semibold text-neutral-dark flex items-center gap-2">
                <FiAlertTriangle className="text-red-600" /> Emergency ambulance
              </h3>
              <p className="text-xs text-neutral-gray">
                For medical emergencies, call our emergency line immediately. For non-urgent ambulance requests, you
                can submit a request and our team will contact you.
              </p>
              <a
                href={brand.phone !== 'Phone number not set' ? `tel:${brand.phone}` : '#'}
                className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                Call Emergency
              </a>
            </div>
          )}
        </section>

        {/* Why choose us - with images and text */}
        <section className="space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold">Why choose us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${themeClasses.cardBg} border border-neutral-border rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1`}>
              <div className="relative h-40 sm:h-44">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80"
                  alt="Expert medical team"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-neutral-dark">Expert medical team</h3>
                <p className="text-sm text-neutral-gray leading-relaxed">
                  Our board-certified physicians bring years of experience and continuous training. We stay updated with the latest medical advances to offer you the best care.
                </p>
              </div>
            </div>
            <div className={`${themeClasses.cardBg} border border-neutral-border rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1`}>
              <div className="relative h-40 sm:h-44">
                <img
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&q=80"
                  alt="Modern facilities"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-neutral-dark">Modern facilities</h3>
                <p className="text-sm text-neutral-gray leading-relaxed">
                  Clean, well-equipped spaces and state-of-the-art technology support accurate diagnosis and effective treatment. Your comfort and safety are our priority.
                </p>
              </div>
            </div>
            <div className={`${themeClasses.cardBg} border border-neutral-border rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1`}>
              <div className="relative h-40 sm:h-44">
                <img
                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80"
                  alt="Patient-centered care"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-neutral-dark">Patient-centered care</h3>
                <p className="text-sm text-neutral-gray leading-relaxed">
                  We listen to your concerns, explain your options clearly, and involve you in every decision. Our goal is to help you feel informed and supported throughout your care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Facility gallery */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Our facility</h2>
          <p className="text-sm text-neutral-gray max-w-2xl leading-relaxed">
            A welcoming environment designed for your comfort and recovery. Our modern spaces and attentive staff help make every visit as smooth as possible.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
              'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&q=80',
              'https://images.unsplash.com/photo-1581594690567-e1a0b2f64f20?w=400&q=80',
              'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
            ].map((src, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-border">
                <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>

        {/* Map & Location */}
        {brand.address && brand.address !== 'Hospital address not set yet' && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">Find us</h2>
            <p className="text-sm text-neutral-gray leading-relaxed max-w-2xl">
              We are conveniently located at {brand.address}. Plan your visit using the map below—you can open it in Google Maps for turn-by-turn directions. Parking is available on-site, and our main entrance is clearly marked.
            </p>
            <div className="w-full h-64 rounded-xl border border-neutral-border overflow-hidden bg-neutral-light">
              <iframe
                title="Hospital location map"
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(brand.address)}&output=embed`}
              />
            </div>
          </section>
        )}

        {/* Our Doctors - preview on home */}
        {departments.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Our Doctors</h2>
                <p className="text-sm text-neutral-gray mt-1 max-w-2xl leading-relaxed">
                  Meet our experienced medical team. Each of our physicians is dedicated to providing personalized, high-quality care. Browse their profiles, learn about their specializations, and book an appointment when you are ready.
                </p>
              </div>
              <Link
                href="/templates/hospital/doctors"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors w-fit"
              >
                View all doctors & book
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments
                .flatMap((dept) =>
                  dept.doctors
                    .filter((d) => d.name?.trim())
                    .map((d) => ({ ...d, department: dept.name }))
                )
                .slice(0, 6)
                .map((doctor, i) => (
                <div key={i} className={`${themeClasses.cardBg} border border-neutral-border rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-start gap-3">
                    {doctor.photoData ? (
                      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-neutral-border">
                        <img
                          src={doctor.photoData}
                          alt={formatValue(doctor.name) || 'Doctor'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-lg">
                        {(doctor.name || 'D').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-dark truncate">
                        Name: {formatValue(doctor.name || 'Doctor')}
                      </p>
                      {doctor.title && (
                        <p className="text-xs text-neutral-gray">Title: {formatValue(doctor.title)}</p>
                      )}
                      {doctor.specialization && (
                        <p className="text-xs text-neutral-gray">Specialization: {formatValue(doctor.specialization)}</p>
                      )}
                      {(doctor as { department?: string }).department && (
                        <p className="text-xs text-primary mt-1">Department: {formatValue((doctor as { department?: string }).department || '')}</p>
                      )}
                      {hasReviews && (() => {
                        const stats = getDoctorRatingStats(doctor.name, (doctor as { department?: string }).department || '', siteOwnerId || undefined)
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
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {hasReviews && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">What our patients say</h2>
            <p className="text-sm text-neutral-gray max-w-2xl leading-relaxed">
              We value feedback from every patient. Your experience matters to us. This section will display real patient reviews and ratings as you start collecting them. Thank you for trusting us with your healthcare.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Excellent care and friendly staff.', 'Doctors explained everything clearly.', 'Clean facility and quick check-in.'].map(
                (text, idx) => (
                  <div key={idx} className={`${themeClasses.cardBg} border border-neutral-border rounded-xl p-4 space-y-2 shadow-sm`}>
                    <div className="flex items-center gap-1 text-ai">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <FiStar key={n} size={14} />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-dark">{text}</p>
                    <p className="text-xs text-neutral-gray">Patient</p>
                  </div>
                )
              )}
            </div>
          </section>
        )}

      </main>

      {hasAIChatbot && (
        <AIChatbot variant="hospital" pharmacyName={brand.name} pharmacyPhone={brand.phone} />
      )}
    </div>
  )
}

export default function HospitalWebsitePage() {
  return <HospitalWebsiteContent />
}

