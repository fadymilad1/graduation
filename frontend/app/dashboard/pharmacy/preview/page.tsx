'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiCheckCircle, FiClock, FiExternalLink, FiMonitor, FiTablet, FiSmartphone } from 'react-icons/fi'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/ToastProvider'
import { pharmacyApi } from '@/lib/pharmacy'
import { setPublicSiteItem } from '@/lib/storage'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

const frameWidthByMode: Record<DeviceMode, string> = {
  desktop: 'w-full',
  tablet: 'w-[820px] max-w-full',
  mobile: 'w-[390px] max-w-full',
}

const deviceLabelByMode: Record<DeviceMode, string> = {
  desktop: 'Desktop Preview',
  tablet: 'Tablet Preview',
  mobile: 'Mobile Preview',
}

export default function PharmacyPreviewPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [ownerId, setOwnerId] = useState('')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')

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
      if (user.id) {
        setOwnerId(String(user.id))
      }
    } catch {
      router.push('/dashboard')
      return
    }

    const load = async () => {
      setIsLoading(true)
      const profileRes = await pharmacyApi.getProfile()

      if (profileRes.error) {
        showToast({ type: 'error', title: 'Could not load preview', message: profileRes.error })
      }

      setTemplateId(profileRes.data?.template_id || null)
      setIsPublished(Boolean(profileRes.data?.is_published))
      setIsLoading(false)
    }

    void load()
  }, [router, showToast])

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (templateId && ownerId) params.set('owner', ownerId)
    if (!templateId) params.set('demo', '1')
    const query = params.toString()
    return `/templates/pharmacy/${templateId || 1}${query ? `?${query}` : ''}`
  }, [templateId, ownerId])

  const handlePublish = async () => {
    setIsPublishing(true)
    const publishRes = await pharmacyApi.publish()
    if (publishRes.error) {
      showToast({ type: 'error', title: 'Publish failed', message: publishRes.error })
      setIsPublishing(false)
      return
    }

    setIsPublished(true)
    setPublicSiteItem('isPublished', 'true')
    showToast({ type: 'success', title: 'Website published', message: 'Your pharmacy website is now published.' })
    setIsPublishing(false)
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-light via-white to-neutral-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">Website Preview</h1>
            <p className="text-neutral-gray mt-1">
              {templateId
                ? 'Preview your live pharmacy website across devices.'
                : 'No purchased template is active yet. Showing demo preview until you buy and activate one.'}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-white/80 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-gray">Current View</p>
            <p className="text-lg font-bold text-neutral-dark">{deviceLabelByMode[deviceMode]}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
            isPublished ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'
          }`}>
            {isPublished ? <FiCheckCircle /> : <FiClock />}
            {isPublished ? 'Published' : 'Draft mode'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 font-semibold text-primary">
            Template {templateId || 1}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={previewUrl} target="_blank">
            <Button>
              <FiExternalLink className="mr-2" />
              Open full preview
            </Button>
          </Link>
          {!isPublished ? (
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? 'Publishing...' : 'Publish Website'}
            </Button>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-success/10 px-3 py-2 text-sm font-semibold text-success">
              Published
            </span>
          )}
        </div>
      </section>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              deviceMode === 'desktop' ? 'border-primary bg-primary-light text-primary' : 'border-neutral-border'
            }`}
          >
            <FiMonitor /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              deviceMode === 'tablet' ? 'border-primary bg-primary-light text-primary' : 'border-neutral-border'
            }`}
          >
            <FiTablet /> Tablet
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              deviceMode === 'mobile' ? 'border-primary bg-primary-light text-primary' : 'border-neutral-border'
            }`}
          >
            <FiSmartphone /> Mobile
          </button>
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <Skeleton className="h-[620px] w-full" />
        ) : (
          <div className="flex justify-center overflow-auto rounded-xl bg-neutral-light p-3">
            <div className={`${frameWidthByMode[deviceMode]} overflow-hidden rounded-xl border border-neutral-border bg-white`}>
              <div className="flex items-center justify-between border-b border-neutral-border bg-white px-3 py-2 text-xs text-neutral-gray">
                <span>{deviceLabelByMode[deviceMode]}</span>
                <span>{previewUrl}</span>
              </div>
              <iframe
                src={previewUrl}
                title="Pharmacy website preview"
                className="h-[620px] w-full"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
