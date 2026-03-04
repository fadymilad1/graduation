'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { FiMapPin, FiCheckCircle, FiGlobe } from 'react-icons/fi'
import { getScopedItem, setScopedItem } from '@/lib/storage'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function BusinessInfoPage() {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('hospital')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    logo: null as File | null,
    about: '',
    address: '',
    workingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    },
    contactPhone: '',
    contactEmail: '',
    website: '',
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        const businessType = user.businessType || user.business_type || 'hospital'
        setUserType(businessType)
      } catch {
        setUserType('hospital')
      }
    }
  }, [])

  // Load saved business info when page mounts so data persists on refresh (user-scoped)
  useEffect(() => {
    try {
      const saved = getScopedItem('businessInfo')
      if (saved) {
        const parsed = JSON.parse(saved)
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          // Never restore logo as a File from storage; keep it null here
          logo: null,
          workingHours: {
            ...prev.workingHours,
            ...(parsed.workingHours || {}),
          },
        }))
        if (parsed.logo) {
          setLogoPreview(parsed.logo)
        }
      }
    } catch {
      // Ignore parse errors and keep defaults
    }
  }, [])

  // Auto-save business info draft whenever the user types (user-scoped)
  useEffect(() => {
    try {
      const { logo, ...rest } = formData
      setScopedItem('businessInfo', JSON.stringify(rest))
    } catch {
      // Ignore storage write errors
    }
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPublishing(true)
    
    // Convert logo File to base64 data URL if present
    let logoDataUrl = null
    if (formData.logo) {
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(formData.logo!)
      })
    }
    
    // Store business info locally for the template to read (user-scoped)
    const businessInfoToSave = {
      ...formData,
      logo: logoDataUrl, // Store as data URL instead of File object
    }
    setScopedItem('businessInfo', JSON.stringify(businessInfoToSave))
    setScopedItem('isPublished', 'true')
    
    setIsPublishing(false)
    setIsPublished(true)
    
    // After publishing, send user to their live website (pharmacy) or dashboard (hospital)
    setTimeout(() => {
      if (userType === 'pharmacy') {
        const selectedTemplate = getScopedItem('selectedTemplate')
        const templateId = selectedTemplate ? parseInt(selectedTemplate) : 1
        router.push(`/templates/pharmacy/${templateId}`)
      } else {
        router.push('/dashboard')
      }
    }, 2000)
  }

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-dark mb-2">Business Information</h1>
        <p className="text-sm sm:text-base text-neutral-gray">Add your business details to complete your website</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Business Name"
                placeholder="Your Hospital or Pharmacy Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <FileUpload
                label="Logo"
                accept="image/*"
                onChange={(file) => {
                  setFormData({ ...formData, logo: file })
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      const dataUrl = reader.result as string
                      setLogoPreview(dataUrl)
                      // Save logo to localStorage so dashboard progress shows "Upload Logo" as complete
                      try {
                        const saved = getScopedItem('businessInfo')
                        const parsed = saved ? JSON.parse(saved) : {}
                        parsed.logo = dataUrl
                        setScopedItem('businessInfo', JSON.stringify(parsed))
                      } catch {
                        // Ignore
                      }
                    }
                    reader.readAsDataURL(file)
                  } else {
                    setLogoPreview(null)
                    try {
                      const saved = getScopedItem('businessInfo')
                      if (saved) {
                        const parsed = JSON.parse(saved)
                        delete parsed.logo
                        setScopedItem('businessInfo', JSON.stringify(parsed))
                      }
                    } catch {
                      // Ignore
                    }
                  }
                }}
              />
              {logoPreview && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm text-neutral-gray">Logo preview:</span>
                  <div className="h-12 w-12 rounded-md border border-neutral-border overflow-hidden flex items-center justify-center bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                  </div>
                </div>
              )}
              <Textarea
                label="About"
                placeholder="Tell us about your business..."
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                rows={5}
              />
            </div>
          </Card>

          {/* Address & Map */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Location</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FiMapPin className="text-primary" />
                <span className="font-medium text-neutral-dark">Address</span>
              </div>
              <Textarea
                placeholder="123 Medical Street, City, State, ZIP Code"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
              {/* Google Map picker */}
              <LocationMapPicker formData={formData} setFormData={setFormData} />
            </div>
          </Card>

          {/* Working Hours */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Working Hours</h2>
            <div className="space-y-3 sm:space-y-4">
              {days.map((day) => {
                const dayData = formData.workingHours[day.key as keyof typeof formData.workingHours]
                return (
                  <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-3 sm:pb-0 border-b border-neutral-border sm:border-b-0 last:border-b-0">
                    <div className="w-full sm:w-24 flex-shrink-0">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!dayData.closed}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                [day.key]: {
                                  ...dayData,
                                  closed: !e.target.checked,
                                },
                              },
                            })
                          }}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-neutral-dark">{day.label}</span>
                      </label>
                    </div>
                    {!dayData.closed ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                        <Input
                          type="time"
                          value={dayData.open}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                [day.key]: { ...dayData, open: e.target.value },
                              },
                            })
                          }}
                          className="w-full sm:flex-1"
                        />
                        <span className="text-neutral-gray text-center sm:text-left hidden sm:inline">to</span>
                        <Input
                          type="time"
                          value={dayData.close}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                [day.key]: { ...dayData, close: e.target.value },
                              },
                            })
                          }}
                          className="w-full sm:flex-1"
                        />
                      </div>
                    ) : (
                      <span className="text-neutral-gray text-sm sm:text-base">Closed</span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                placeholder="+1 (555) 123-4567"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="contact@business.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
              <div className="col-span-2">
                <Input
                  label="Website"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          {isPublished ? (
            <Card className="p-8 text-center">
              <FiCheckCircle className="mx-auto text-success mb-4" size={64} />
              <h3 className="text-2xl font-semibold text-neutral-dark mb-2">
                Website Published Successfully!
              </h3>
              <p className="text-neutral-gray mb-6">
                Your website is now live. Redirecting to dashboard...
              </p>
            </Card>
          ) : (
            <div className="flex justify-end gap-4">
              <Button variant="secondary" type="button">
                Save Draft
              </Button>
              <Button variant="primary" type="submit" disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <FiGlobe className="mr-2" />
                    Publish Website
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

interface LocationMapPickerProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

const NOMINATIM_UA = 'MedifyApp/1.0 (Business Info Location Picker)'

async function nominatimSearch(query: string): Promise<{ lat: string; lon: string; display_name: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'User-Agent': NOMINATIM_UA } }
  )
  const data = await res.json()
  return Array.isArray(data) && data[0] ? data[0] : null
}

async function nominatimReverse(lat: number, lon: number): Promise<string | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { 'User-Agent': NOMINATIM_UA } }
  )
  const data = await res.json()
  return data?.display_name ?? null
}

const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ formData, setFormData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const mapRef = useRef<{ map: L.Map; marker: L.Marker } | null>(null)
  type LeafletMouseEvent = { latlng: { lat: number; lng: number } }
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const defaultCenter: [number, number] = [30.0444, 31.2357]

  const updateAddressFromCoordinates = (lat: number, lng: number) => {
    nominatimReverse(lat, lng).then((addr) => {
      if (addr) {
        setFormData((prev: any) => ({ ...prev, address: addr }))
      }
    })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = (searchInputRef.current?.value ?? searchQuery).trim()
    if (!q) return
    setSearching(true)
    setMapError(null)
    try {
      const result = await nominatimSearch(q)
      if (!result || !mapRef.current) {
        setMapError('Location not found. Try a different address.')
        setSearching(false)
        return
      }
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      mapRef.current.map.setView([lat, lng], 15)
      mapRef.current.marker.setLatLng([lat, lng])
      setFormData((prev: any) => ({
        ...prev,
        location: { lat, lng },
        address: result.display_name,
      }))
      setSearchQuery('')
      if (searchInputRef.current) searchInputRef.current.value = ''
    } catch {
      setMapError('Search failed. Please try again.')
    }
    setSearching(false)
  }

  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined') return
    const L = require('leaflet')
    if (!L) return

    // Fix default marker icon in Next.js (broken paths)
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const marker = L.marker(defaultCenter, { draggable: true }).addTo(map)

    map.on('click', (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setFormData((prev: any) => ({ ...prev, location: { lat, lng } }))
      updateAddressFromCoordinates(lat, lng)
    })

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      const lat = pos.lat
      const lng = pos.lng
      setFormData((prev: any) => ({ ...prev, location: { lat, lng } }))
      updateAddressFromCoordinates(lat, lng)
    })

    mapRef.current = { map, marker }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [setFormData])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location (e.g. city or full address)"
          className="flex-1 min-w-0 px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch(e as unknown as React.FormEvent)
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={searching} onClick={handleSearch}>
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      <div
        ref={mapContainerRef}
        className="h-64 bg-neutral-light rounded-lg z-0"
      />
      {mapError && (
        <p className="text-xs text-error">{mapError}</p>
      )}
      {formData.location && (
        <p className="text-xs text-neutral-gray">
          Selected: {formData.location.lat?.toFixed(5)}, {formData.location.lng?.toFixed(5)}
        </p>
      )}
      <p className="text-xs text-neutral-gray">
        Click the map or drag the marker to set your location. Uses OpenStreetMap (no API key required).
      </p>
    </div>
  )
}


