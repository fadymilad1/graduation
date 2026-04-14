'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiCheckCircle, FiDroplet, FiSave, FiType } from 'react-icons/fi'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/ToastProvider'
import { businessInfoApi, getAuthToken } from '@/lib/api'
import { pharmacyApi, type PharmacyThemeSettings } from '@/lib/pharmacy'
import { normalizePharmacyThemeSettings, persistPharmacyThemeSettings } from '@/lib/pharmacyTheme'
import { normalizeLogoUrl, setPublicSiteItem, setScopedItem } from '@/lib/storage'

type SectionToggles = NonNullable<PharmacyThemeSettings['sections']>

type FormState = {
  logoFile: File | null
  logoPreview: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  sections: SectionToggles
  pharmacyName: string
  pharmacyDescription: string
  address: string
  phone: string
  workingHours: string
}

const defaultSections: SectionToggles = {
  hero: true,
  featuredProducts: true,
  categories: true,
  offers: true,
  contactInfo: true,
  map: true,
}

const defaultState: FormState = {
  logoFile: null,
  logoPreview: '',
  primaryColor: '#1B76FF',
  secondaryColor: '#0C4EB7',
  fontFamily: 'Poppins',
  sections: defaultSections,
  pharmacyName: '',
  pharmacyDescription: '',
  address: '',
  phone: '',
  workingHours: 'Mon-Sat 09:00-20:00',
}

const fontOptions = [
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Nunito', label: 'Nunito' },
]

export default function PharmacyCustomizePage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<FormState>(defaultState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const userRaw = localStorage.getItem('user')
    if (!userRaw) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userRaw)
      if ((user.businessType || user.business_type) !== 'pharmacy') {
        router.push('/dashboard')
        return
      }
    } catch {
      router.push('/dashboard')
      return
    }

    const load = async () => {
      setIsLoading(true)
      const [profileRes, businessRes] = await Promise.all([pharmacyApi.getProfile(), businessInfoApi.get()])

      if (profileRes.error) {
        showToast({ type: 'error', title: 'Could not load customization settings', message: profileRes.error })
      }

      const theme = (profileRes.data?.theme_settings || {}) as PharmacyThemeSettings & {
        workingHours?: string
      }
      const businessData = (businessRes.data || {}) as {
        name?: string
        about?: string
        address?: string
        contact_phone?: string
        logo_url?: string
      }
      const loadedTheme = normalizePharmacyThemeSettings({
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        fontFamily: theme.fontFamily,
        sections: theme.sections,
      })
      const sections = { ...defaultSections, ...loadedTheme.sections }

      persistPharmacyThemeSettings(loadedTheme)

      setForm((prev) => ({
        ...prev,
        logoPreview: profileRes.data?.logo_url || businessData.logo_url || '',
        primaryColor: loadedTheme.primaryColor || prev.primaryColor,
        secondaryColor: loadedTheme.secondaryColor || prev.secondaryColor,
        fontFamily: loadedTheme.fontFamily || prev.fontFamily,
        sections,
        pharmacyName: businessData.name || profileRes.data?.name || prev.pharmacyName,
        pharmacyDescription: businessData.about || profileRes.data?.description || prev.pharmacyDescription,
        address: businessData.address || prev.address,
        phone: businessData.contact_phone || prev.phone,
        workingHours: theme.workingHours || prev.workingHours,
      }))

      setIsLoading(false)
    }

    void load()
  }, [router, showToast])

  const sectionEntries = useMemo(
    () => [
      { key: 'hero', label: 'Hero section' },
      { key: 'featuredProducts', label: 'Featured products' },
      { key: 'categories', label: 'Categories' },
      { key: 'offers', label: 'Offers / discounts' },
      { key: 'contactInfo', label: 'Contact info' },
      { key: 'map', label: 'Map' },
    ] as const,
    [],
  )

  const enabledSectionsCount = useMemo(
    () => Object.values(form.sections).filter(Boolean).length,
    [form.sections],
  )
  const normalizedLogoPreview = useMemo(() => normalizeLogoUrl(form.logoPreview), [form.logoPreview])

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!form.pharmacyName.trim()) {
      nextErrors.pharmacyName = 'Pharmacy name is required.'
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Address is required.'
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone number is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveBusinessInfo = async (): Promise<string | null> => {
    const token = getAuthToken()
    if (!token) return null

    const payload = new FormData()
    payload.append('name', form.pharmacyName)
    payload.append('about', form.pharmacyDescription)
    payload.append('address', form.address)
    payload.append('contact_phone', form.phone)
    payload.append(
      'working_hours',
      JSON.stringify({
        monday: { open: '09:00', close: '20:00', closed: false },
      }),
    )

    if (form.logoFile) {
      payload.append('logo', form.logoFile)
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const res = await fetch(`${baseUrl}/business-info/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    })

    if (!res.ok && res.status === 404) {
      const createRes = await fetch(`${baseUrl}/business-info/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      if (!createRes.ok) {
        throw new Error('Could not save business content.')
      }

      const createdPayload = await createRes.json()
      return createdPayload?.logo_url || null
    }

    if (!res.ok) {
      throw new Error('Could not save business content.')
    }

    const updatedPayload = await res.json()
    return updatedPayload?.logo_url || null
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSaving(true)

    try {
      const themeSettings: PharmacyThemeSettings & { workingHours?: string } = {
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        fontFamily: form.fontFamily,
        sections: form.sections,
        workingHours: form.workingHours,
      }
      const normalizedThemeSettings = normalizePharmacyThemeSettings(themeSettings)

      const profilePayload = {
        name: form.pharmacyName,
        description: form.pharmacyDescription,
        theme_settings: themeSettings,
        logo: form.logoFile,
      }

      const profileRes = await pharmacyApi.saveProfile(profilePayload, 'PATCH')
      if (profileRes.error) {
        throw new Error(profileRes.error)
      }

      const businessLogo = await saveBusinessInfo()

      const savedLogo = businessLogo || profileRes.data?.logo_url || form.logoPreview
      const businessSnapshot = {
        name: form.pharmacyName,
        about: form.pharmacyDescription,
        address: form.address,
        contactPhone: form.phone,
        logo: savedLogo,
        themeSettings: normalizedThemeSettings,
      }

      persistPharmacyThemeSettings(normalizedThemeSettings)

      setScopedItem(
        'businessInfo',
        JSON.stringify(businessSnapshot),
      )
      setPublicSiteItem('businessInfo', JSON.stringify(businessSnapshot))
      setForm((prev) => ({ ...prev, logoPreview: savedLogo }))

      showToast({
        type: 'success',
        title: 'Customization saved',
        message: 'Your pharmacy branding and content have been updated.',
      })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Failed to save customization.'
      showToast({ type: 'error', title: 'Save failed', message: errorText })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-light via-white to-neutral-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">Website Customization</h1>
            <p className="text-neutral-gray mt-1">Control branding, page sections, and pharmacy content.</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-white/80 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-gray">Sections Enabled</p>
            <p className="text-lg font-bold text-neutral-dark">{enabledSectionsCount}/6</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
          <p className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-neutral-dark"><FiCheckCircle className="text-primary" /> Theme and content save together</p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-neutral-dark"><FiType className="text-primary" /> Font: {form.fontFamily}</p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-neutral-dark"><FiDroplet className="text-primary" /> Colors: {form.primaryColor} / {form.secondaryColor}</p>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-neutral-dark">
            <FiDroplet />
            <h2 className="text-xl font-semibold">Branding</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FileUpload
                label="Logo upload"
                accept="image/*"
                onChange={(file) => {
                  setForm((prev) => ({
                    ...prev,
                    logoFile: file,
                    logoPreview: file ? URL.createObjectURL(file) : prev.logoPreview,
                  }))
                }}
              />
              {normalizedLogoPreview ? (
                <img
                  src={normalizedLogoPreview}
                  alt="Pharmacy logo preview"
                  className="mt-3 h-20 w-20 rounded-lg border border-neutral-border object-cover"
                />
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-neutral-dark">
                Primary color
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(event) => setForm((prev) => ({ ...prev, primaryColor: event.target.value }))}
                  className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-neutral-border"
                />
              </label>
              <label className="text-sm font-medium text-neutral-dark">
                Secondary color
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(event) => setForm((prev) => ({ ...prev, secondaryColor: event.target.value }))}
                  className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-neutral-border"
                />
              </label>
              <label className="sm:col-span-2 text-sm font-medium text-neutral-dark">
                <span className="inline-flex items-center gap-2">
                  <FiType />
                  Font family
                </span>
                <select
                  value={form.fontFamily}
                  onChange={(event) => setForm((prev) => ({ ...prev, fontFamily: event.target.value }))}
                  className="input-field mt-2"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-border bg-neutral-light/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-gray">Live style preview</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: form.primaryColor }}>
                Primary Button
              </span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: form.secondaryColor, color: form.secondaryColor }}>
                Secondary Accent
              </span>
              <p className="text-sm text-neutral-dark" style={{ fontFamily: form.fontFamily }}>
                {form.pharmacyName || 'Your pharmacy brand text preview'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-neutral-dark">Sections Toggle</h2>
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">{enabledSectionsCount} enabled</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sectionEntries.map((section) => (
              <label
                key={section.key}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                  form.sections[section.key]
                    ? 'border-primary/30 bg-primary-light/30'
                    : 'border-neutral-border bg-white'
                }`}
              >
                <span className="text-sm font-medium text-neutral-dark">{section.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.sections[section.key])}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        [section.key]: event.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-dark">Content Editing</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Pharmacy name"
              value={form.pharmacyName}
              error={errors.pharmacyName}
              onChange={(event) => setForm((prev) => ({ ...prev, pharmacyName: event.target.value }))}
              placeholder="Medify Pharmacy"
            />
            <Input
              label="Phone"
              value={form.phone}
              error={errors.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="+20 100 123 4567"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                value={form.pharmacyDescription}
                onChange={(event) => setForm((prev) => ({ ...prev, pharmacyDescription: event.target.value }))}
                placeholder="Describe what makes your pharmacy unique."
                rows={4}
              />
            </div>
            <Input
              label="Address"
              value={form.address}
              error={errors.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="123 Health Street, Cairo"
            />
            <Input
              label="Working hours"
              value={form.workingHours}
              onChange={(event) => setForm((prev) => ({ ...prev, workingHours: event.target.value }))}
              placeholder="Mon-Sat 09:00-20:00"
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <FiSave className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Customization'}
          </Button>
        </div>
      </form>
    </div>
  )
}
