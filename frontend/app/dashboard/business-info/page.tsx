'use client'

import React, { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { Select } from '@/components/ui/Select'
import { FiMapPin, FiClock, FiPlus, FiX, FiCheckCircle, FiGlobe } from 'react-icons/fi'

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

  // Load saved business info when page mounts so data persists on refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem('businessInfo')
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
      }
    } catch {
      // Ignore parse errors and keep defaults
    }
  }, [])

  // Auto-save business info draft whenever the user types
  useEffect(() => {
    try {
      const { logo, ...rest } = formData
      localStorage.setItem('businessInfo', JSON.stringify(rest))
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
    
    // Store business info locally for the template to read
    const businessInfoToSave = {
      ...formData,
      logo: logoDataUrl, // Store as data URL instead of File object
    }
    localStorage.setItem('businessInfo', JSON.stringify(businessInfoToSave))
    localStorage.setItem('isPublished', 'true')
    
    setIsPublishing(false)
    setIsPublished(true)
    
    // After publishing, send user to their live website (pharmacy) or dashboard (hospital)
    setTimeout(() => {
      if (userType === 'pharmacy') {
        const selectedTemplate = localStorage.getItem('selectedTemplate')
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
      {/* Google Maps script with Places library (requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}&libraries=places`}
        strategy="lazyOnload"
      />

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
                      setLogoPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  } else {
                    setLogoPreview(null)
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

// Google Maps type declarations
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options?: any) => any
        Marker: new (options?: any) => any
        LatLng: new (lat: number, lng: number) => any
        event: {
          addListener: (instance: any, event: string, handler: (e: any) => void) => void
        }
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: any) => {
            getPlace: () => any
            addListener: (event: string, handler: () => void) => void
          }
        }
        Geocoder: new () => {
          geocode: (request: any, callback: (results: any[], status: string) => void) => void
        }
        MapMouseEvent: {
          latLng: {
            lat: () => number
            lng: () => number
          } | null
        }
      }
    }
  }
}

const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ formData, setFormData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)

  // Function to update address from coordinates (reverse geocoding)
  const updateAddressFromCoordinates = (lat: number, lng: number) => {
    if (!geocoderRef.current) return
    
    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        if (status === 'OK' && results && results[0]) {
          setFormData((prev: any) => ({
            ...prev,
            address: results[0].formatted_address,
          }))
        }
      }
    )
  }

  useEffect(() => {
    if (!mapContainerRef.current || !searchInputRef.current) return
    if (!window.google) return
    const google = window.google

    if (!mapRef.current) {
      const center = new google.maps.LatLng(30.0444, 31.2357) // Default Cairo center
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
      })

      markerRef.current = new google.maps.Marker({
        position: center,
        map: mapRef.current,
        draggable: true,
      })

      geocoderRef.current = new google.maps.Geocoder()

      // Initialize Places Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['address'],
        fields: ['geometry', 'formatted_address'],
      })

      // When a place is selected from autocomplete
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (!place?.geometry?.location) return

        const location = place.geometry.location
        const lat = location.lat()
        const lng = location.lng()

        // Update map center and marker
        mapRef.current?.setCenter(location)
        mapRef.current?.setZoom(15)
        if (markerRef.current) {
          markerRef.current.setPosition(location)
        }

        // Update form data
        setFormData((prev: any) => ({
          ...prev,
          location: { lat, lng },
          address: place.formatted_address || prev.address,
        }))
      })

      // When map is clicked
      google.maps.event.addListener(mapRef.current, 'click', (e: any) => {
        if (!e.latLng) return
        const position = e.latLng
        const lat = position.lat()
        const lng = position.lng()

        if (markerRef.current) {
          markerRef.current.setPosition(position)
        }
        
        setFormData((prev: any) => ({
          ...prev,
          location: { lat, lng },
        }))

        // Update address from coordinates
        updateAddressFromCoordinates(lat, lng)
      })

      // When marker is dragged
      google.maps.event.addListener(markerRef.current, 'dragend', (e: any) => {
        if (!e.latLng) return
        const position = e.latLng
        const lat = position.lat()
        const lng = position.lng()

        setFormData((prev: any) => ({
          ...prev,
          location: { lat, lng },
        }))

        // Update address from coordinates
        updateAddressFromCoordinates(lat, lng)
      })
    }
  }, [setFormData])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={searchInputRef}
          placeholder="Search for a location..."
          className="w-full"
        />
      </div>
      <div
        ref={mapContainerRef}
        className="h-64 bg-neutral-light rounded-lg"
      />
      {formData.location && (
        <p className="text-xs text-neutral-gray">
          Selected coordinates: {formData.location.lat?.toFixed(5)}, {formData.location.lng?.toFixed(5)}
        </p>
      )}
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="bg-warning/10 border border-warning rounded-lg p-3 text-xs text-warning">
          <p className="font-semibold mb-1">API Key Missing</p>
          <p>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file and restart the dev server.</p>
        </div>
      )}
    </div>
  )
}


