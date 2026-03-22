'use client'

import React, { useState, useEffect } from 'react'
import PharmacyOrdersPage from './PharmacyOrdersPage'
import HospitalAppointmentsPage from './HospitalAppointmentsPage'

export default function OrdersPage() {
  const [userType, setUserType] = useState<'hospital' | 'pharmacy' | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserType(user.businessType || user.business_type || 'hospital')
      } catch {
        setUserType('hospital')
      }
    } else {
      setUserType('hospital')
    }
  }, [])

  if (userType === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-neutral-gray">Loading…</p>
      </div>
    )
  }

  if (userType === 'hospital') {
    return <HospitalAppointmentsPage />
  }

  return <PharmacyOrdersPage />
}
