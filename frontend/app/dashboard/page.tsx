'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { FiUpload, FiLayout, FiFileText, FiGlobe, FiMessageSquare, FiDollarSign } from 'react-icons/fi'
import { getScopedItem } from '@/lib/storage'
import { getPharmacyOrders, getPharmacyOrdersStats } from '@/lib/orders'
import { getHospitalAppointments, getHospitalAppointmentsStats } from '@/lib/appointments'

type StatEntry = {
  label: string
  value: number
  change: number
}

type PharmacyStats = {
  totalOrders: number
  totalOrdersChange: number
  pendingOrders: number
  pendingOrdersChange: number
  cancelledOrders: number
  cancelledOrdersChange: number
  monthlyOrders: number
  monthlyOrdersChange: number
}

const defaultPharmacyStats: PharmacyStats = {
  totalOrders: 0,
  totalOrdersChange: 0,
  pendingOrders: 0,
  pendingOrdersChange: 0,
  cancelledOrders: 0,
  cancelledOrdersChange: 0,
  monthlyOrders: 0,
  monthlyOrdersChange: 0,
}

const formatChange = (value: number) => `${value > 0 ? '+' : ''}${value}%`

const AnimatedNumber = ({ value, duration = 900 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const startValueRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const startValue = startValueRef.current
    const difference = value - startValue
    const startTime = performance.now()

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const nextValue = Math.round(startValue + difference * progress)
      setDisplayValue(nextValue)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        startValueRef.current = value
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  useEffect(() => {
    startValueRef.current = 0
    setDisplayValue(0)
  }, [])

  return <>{displayValue.toLocaleString()}</>
}

export default function DashboardPage() {
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('hospital')
  const [selectedFeatures, setSelectedFeatures] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [templatePurchased, setTemplatePurchased] = useState(false)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [pharmacyStats, setPharmacyStats] = useState<PharmacyStats>(defaultPharmacyStats)
  const [hospitalStats, setHospitalStats] = useState({ total: 0, pending: 0, monthly: 0, change: 0 })
  const [hasPharmacySetup, setHasPharmacySetup] = useState(false)
  const [hasBusinessInfo, setHasBusinessInfo] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    // Get user type from localStorage (auth user, not scoped)
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserType(user.businessType || user.business_type || 'hospital')
    }

    // Get selected features (for hospital) - user-scoped
    const features = getScopedItem('selectedFeatures')
    if (features) {
      setSelectedFeatures(JSON.parse(features))
    }

    // Get total price - user-scoped
    const price = getScopedItem('totalPrice')
    if (price) {
      setTotalPrice(parseFloat(price))
    }

    // Get selected template (for pharmacy) - user-scoped
    const template = getScopedItem('selectedTemplate')
    if (template) {
      setSelectedTemplate(parseInt(template))
    }

    // Pharmacy: only show price summary after purchase - user-scoped
    const started = getScopedItem('templateSubscriptionStartedAt')
    if (started) {
      setTemplatePurchased(true)
    }

    // Pharmacy: compute stats from actual orders (not stored defaults)
    const user = JSON.parse(userData || '{}')
    if (user.businessType === 'pharmacy' || user.business_type === 'pharmacy') {
      try {
        const orders = getPharmacyOrders()
        const computed = getPharmacyOrdersStats(orders)
        // Always fall back to 0s so we never show NaN/undefined
        setPharmacyStats({ ...defaultPharmacyStats, ...computed })
      } catch (error) {
        console.error('Failed to compute pharmacy stats from orders', error)
        setPharmacyStats(defaultPharmacyStats)
      }
    } else {
      const storedPharmacyStats = getScopedItem('pharmacyStats')
      if (storedPharmacyStats) {
        try {
          const parsedStats = JSON.parse(storedPharmacyStats)
          setPharmacyStats({ ...defaultPharmacyStats, ...parsedStats })
        } catch (error) {
          console.error('Failed to parse pharmacy stats from localStorage', error)
          setPharmacyStats(defaultPharmacyStats)
        }
      } else {
        setPharmacyStats(defaultPharmacyStats)
      }
    }

    if (user.businessType === 'hospital' || user.business_type === 'hospital') {
      try {
        const apts = getHospitalAppointments()
        const stats = getHospitalAppointmentsStats(apts)
        setHospitalStats({
          total: stats.total,
          pending: stats.pending,
          monthly: stats.monthly,
          change: 0,
        })
      } catch {
        setHospitalStats({ total: 0, pending: 0, monthly: 0, change: 0 })
      }
    }

    const pharmacySetup = getScopedItem('pharmacySetup')
    if (pharmacySetup) {
      try {
        const parsed = JSON.parse(pharmacySetup)
        const hasProducts = parsed?.products?.some?.((p: any) => p?.name?.trim())
        setHasPharmacySetup(Boolean(hasProducts))
      } catch {
        setHasPharmacySetup(false)
      }
    }

    const businessInfo = getScopedItem('businessInfo')
    if (businessInfo) {
      try {
        const parsed = JSON.parse(businessInfo)
        setHasBusinessInfo(Boolean(parsed?.name?.trim() || parsed?.logo))
      } catch {
        setHasBusinessInfo(false)
      }
    }

    // isPublished: scoped for logged-in, global fallback for hospital
    const published = getScopedItem('isPublished') === 'true' || localStorage.getItem('isPublished') === 'true'
    setIsPublished(published)
  }, [])

  // Refresh stats when page gains focus (e.g. after placing order, reserving appointment, or visiting Orders page)
  useEffect(() => {
    const refreshStats = () => {
      if (userType === 'pharmacy') {
        try {
          const orders = getPharmacyOrders()
          const computed = getPharmacyOrdersStats(orders)
          setPharmacyStats({ ...defaultPharmacyStats, ...computed })
        } catch {
          setPharmacyStats(defaultPharmacyStats)
        }
      } else if (userType === 'hospital') {
        try {
          const apts = getHospitalAppointments()
          const stats = getHospitalAppointmentsStats(apts)
          setHospitalStats({ total: stats.total, pending: stats.pending, monthly: stats.monthly, change: 0 })
        } catch {
          setHospitalStats({ total: 0, pending: 0, monthly: 0, change: 0 })
        }
      }
    }
    window.addEventListener('focus', refreshStats)
    return () => window.removeEventListener('focus', refreshStats)
  }, [userType])

  const pharmacyStatEntries: StatEntry[] = [
    {
      label: 'Total Orders',
      value: pharmacyStats.totalOrders,
      change: pharmacyStats.totalOrdersChange,
    },
    {
      label: 'Pending Orders',
      value: pharmacyStats.pendingOrders,
      change: pharmacyStats.pendingOrdersChange,
    },
    {
      label: 'Canceled Orders',
      value: pharmacyStats.cancelledOrders,
      change: pharmacyStats.cancelledOrdersChange,
    },
  ]

  // Pharmacy: Choose Template (1), Fill Website Options (2), Upload Logo (3), Publish (4)
  const setupSteps =
    userType === 'pharmacy'
      ? [
          { label: 'Choose Template', completed: Boolean(selectedTemplate) },
          { label: 'Fill Website Options', completed: hasPharmacySetup },
          { label: 'Upload Logo', completed: hasBusinessInfo },
          { label: 'Publish', completed: isPublished },
        ]
      : [
          { label: 'Upload Logo', completed: hasBusinessInfo },
          { label: 'Hospital Setup', completed: Boolean(selectedFeatures) },
          { label: 'Business Info', completed: hasBusinessInfo },
          { label: 'Publish', completed: isPublished },
        ]

  const currentStep = setupSteps.findIndex((s) => !s.completed)
  const activeStep = currentStep >= 0 ? currentStep : setupSteps.length - 1

  const stats: StatEntry[] = userType === 'hospital' 
    ? [
        { label: 'Total Appointments', value: hospitalStats.total, change: hospitalStats.change },
        { label: 'Pending Appointments', value: hospitalStats.pending, change: hospitalStats.change },
        { label: 'This Month', value: hospitalStats.monthly, change: hospitalStats.change },
      ]
    : pharmacyStatEntries

  const isHospital = userType === 'hospital'
  const isPharmacy = userType === 'pharmacy'
  const templatePurchasedAndSelected = isPharmacy && templatePurchased && !!selectedTemplate
  const showPricingSummary =
    (isHospital && !!selectedFeatures) ||
    isPharmacy
  const safeTotalPrice =
    typeof totalPrice === 'number' && !Number.isNaN(totalPrice) ? totalPrice : 0
  const displayPrice =
    templatePurchasedAndSelected || (isHospital && !!selectedFeatures)
      ? safeTotalPrice
      : 0

  const pricingDescription =
    isHospital
      ? 'Selected features for your website'
      : templatePurchasedAndSelected
        ? `Template #${selectedTemplate} selected`
        : 'No template purchased yet'

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-dark mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-neutral-gray">Welcome back! Here's your website setup progress.</p>
      </div>

      {/* Setup Progress */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Setup Progress</h2>
        <ProgressBar steps={setupSteps} currentStep={activeStep} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {userType === 'pharmacy' ? (
            <>
              <Link href="/dashboard/pharmacy/templates">
                <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <FiLayout className="mx-auto mb-3 text-primary" size={32} />
                  <h3 className="font-medium text-neutral-dark mb-1">1. Choose Template</h3>
                  <p className="text-sm text-neutral-gray">Select a design</p>
                </Card>
              </Link>
              <Link href="/dashboard/pharmacy/setup">
                <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <FiFileText className="mx-auto mb-3 text-primary" size={32} />
                  <h3 className="font-medium text-neutral-dark mb-1">2. Fill Website Options</h3>
                  <p className="text-sm text-neutral-gray">Add products & info</p>
                </Card>
              </Link>
              <Link href="/dashboard/business-info">
                <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <FiUpload className="mx-auto mb-3 text-primary" size={32} />
                  <h3 className="font-medium text-neutral-dark mb-1">3. Upload Logo</h3>
                  <p className="text-sm text-neutral-gray">Add your logo</p>
                </Card>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (selectedTemplate) {
                    window.open(`/templates/pharmacy/${selectedTemplate}`, '_blank', 'noopener,noreferrer')
                  } else {
                    window.open('/templates/pharmacy/1?demo=1', '_blank', 'noopener,noreferrer')
                  }
                }}
                className="p-0 m-0 text-left"
              >
                <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <FiGlobe className="mx-auto mb-3 text-primary" size={32} />
                  <h3 className="font-medium text-neutral-dark mb-1">4. Publish</h3>
                  <p className="text-sm text-neutral-gray">
                    {selectedTemplate ? 'View your live website' : 'Preview demo website'}
                  </p>
                </Card>
              </button>
            </>
          ) : (
            <>
          <Link href="/dashboard/business-info">
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
              <FiUpload className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium text-neutral-dark mb-1">Upload Logo</h3>
              <p className="text-sm text-neutral-gray">Add your logo</p>
            </Card>
          </Link>
          <Link href="/dashboard/hospital/setup">
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
              <FiLayout className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium text-neutral-dark mb-1">Hospital Setup</h3>
              <p className="text-sm text-neutral-gray">Configure features</p>
            </Card>
          </Link>
          <Link href="/dashboard/business-info">
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
              <FiFileText className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium text-neutral-dark mb-1">Business Info</h3>
              <p className="text-sm text-neutral-gray">Add business info</p>
            </Card>
          </Link>
          {isPublished ? (
            <button
              type="button"
              onClick={() => window.open('/templates/hospital', '_blank', 'noopener,noreferrer')}
              className="p-0 m-0 text-left w-full"
            >
              <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                <FiGlobe className="mx-auto mb-3 text-primary" size={32} />
                <h3 className="font-medium text-neutral-dark mb-1">Publish</h3>
                <p className="text-sm text-neutral-gray">View your live website</p>
              </Card>
            </button>
          ) : (
            <Link href="/dashboard/business-info">
              <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                <FiGlobe className="mx-auto mb-3 text-primary" size={32} />
                <h3 className="font-medium text-neutral-dark mb-1">Publish</h3>
                <p className="text-sm text-neutral-gray">Go live</p>
              </Card>
            </Link>
          )}
            </>
          )}
        </div>
      </Card>

      {/* Pricing Summary - hospital: when features selected; pharmacy: always (0 until purchase) */}
      {showPricingSummary && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-2">Pricing Summary</h2>
              <p className="text-sm sm:text-base text-neutral-gray">
                {pricingDescription}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-primary-light px-4 sm:px-6 py-3 rounded-lg w-full sm:w-auto">
              <FiDollarSign className="text-primary" size={24} />
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {displayPrice.toFixed(2)}
              </span>
            </div>
          </div>
          {userType === 'hospital' && selectedFeatures && (
            <div className="mt-4 pt-4 border-t border-neutral-border">
              <p className="text-sm font-medium text-neutral-dark mb-2">Selected Features:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedFeatures).map(([key, value]) => {
                  if (value && key !== 'departments' && key !== 'bookingSystem' && key !== 'bookingUrl' && key !== 'phone' && key !== 'email' && key !== 'address') {
                    return (
                      <span key={key} className="bg-primary-light text-primary px-3 py-1 rounded-full text-sm">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <p className="text-sm text-neutral-gray mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-neutral-dark mb-2">
              <AnimatedNumber value={stat.value} />
            </p>
            <p className={`text-sm ${stat.change >= 0 ? 'text-success' : 'text-error'}`}>
              {formatChange(stat.change)} from last month
            </p>
          </Card>
        ))}
      </div>

      {/* AI Assistant Preview */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark">AI Assistant</h2>
          <Link href="/dashboard/ai-assistant">
            <Button variant="ghost" className="text-sm sm:text-base">View All</Button>
          </Link>
        </div>
        <div className="bg-neutral-light rounded-lg p-4 sm:p-6 h-40 sm:h-48 flex items-center justify-center">
          <div className="text-center">
            <FiMessageSquare className="mx-auto mb-3 text-ai" size={40} />
            <p className="text-neutral-gray mb-4">Get help with your website</p>
            <Link href="/dashboard/ai-assistant">
              <Button variant="primary">Open AI Assistant</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

