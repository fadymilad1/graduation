'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FiLogOut } from 'react-icons/fi'

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  })

  const [subscriptionPlan, setSubscriptionPlan] = useState<{
    templateName: string
    price: number
    startedAt: string
    renewAt: string
  } | null>(null)
  const [domain, setDomain] = useState('myhospital.medify.com')

  // Load signed-in user info from localStorage so real name/email appear
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return

      const user = JSON.parse(userData)
      const name = user.name || ''
      const email = user.email || user.username || ''

      setProfileData((prev) => ({
        ...prev,
        name,
        email,
      }))
    } catch {
      // If parsing fails, keep defaults
    }
  }, [])

  // Load pharmacy template subscription info (if any) from localStorage
  useEffect(() => {
    try {
      const templateIdRaw = localStorage.getItem('selectedTemplate')
      const priceRaw = localStorage.getItem('totalPrice')
      const startedRaw = localStorage.getItem('templateSubscriptionStartedAt')

      if (!templateIdRaw || !priceRaw || !startedRaw) {
        setSubscriptionPlan(null)
        return
      }

      const templateId = Number(templateIdRaw)
      const price = Number(priceRaw)
      const startedDate = new Date(startedRaw)
      if (Number.isNaN(startedDate.getTime())) {
        setSubscriptionPlan(null)
        return
      }

      // One-month renewal period
      const renewDate = new Date(startedDate)
      renewDate.setMonth(renewDate.getMonth() + 1)

      const formatDate = (d: Date) =>
        d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

      const templateName =
        templateId === 1
          ? 'Modern Pharmacy'
          : templateId === 2
          ? 'Classic Pharmacy'
          : templateId === 3
          ? 'Minimal Pharmacy'
          : `Template #${templateId}`

      setSubscriptionPlan({
        templateName,
        price,
        startedAt: formatDate(startedDate),
        renewAt: formatDate(renewDate),
      })
    } catch {
      setSubscriptionPlan(null)
    }
  }, [])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle profile update
    console.log('Profile updated:', profileData)
  }

  const handleLogout = () => {
    // Handle logout
    window.location.href = '/login'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Settings</h1>
        <p className="text-neutral-gray">Manage your account and website settings</p>
      </div>

      {/* Profile Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-dark mb-6">Profile Settings</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          />
        </form>
      </Card>

      {/* Subscription Plan */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-dark mb-6">Subscription Plan</h2>
        <div className="space-y-4">
          {subscriptionPlan ? (
            <>
              <div className="flex items-center justify-between p-4 bg-neutral-light rounded-lg">
                <div>
                  <h3 className="font-semibold text-neutral-dark">
                    {subscriptionPlan.templateName}
                  </h3>
                  <p className="text-sm text-neutral-gray">
                    ${subscriptionPlan.price.toFixed(2)} / month
                  </p>
                </div>
              </div>
              <div className="text-sm text-neutral-gray">
                <p>Subscribed on: {subscriptionPlan.startedAt}</p>
                <p>Next renewal date: {subscriptionPlan.renewAt}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-gray">
              You don&apos;t have an active pharmacy template subscription yet. Choose a template
              from the Pharmacy Templates page.
            </p>
          )}
        </div>
      </Card>

      {/* Domain Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-dark mb-6">Domain Settings</h2>
        <div className="space-y-4">
          <Input
            label="Current Domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled
          />
          <p className="text-sm text-neutral-gray">
            To use a custom domain, please contact support or upgrade to Enterprise plan.
          </p>
          <Button variant="secondary">Configure Custom Domain</Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-2 border-error">
        <h2 className="text-xl font-semibold text-error mb-6">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-dark">Logout</h3>
              <p className="text-sm text-neutral-gray">Sign out of your account</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <FiLogOut className="mr-2" />
              Logout
            </Button>
          </div>
          <div className="border-t border-neutral-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-error">Delete Account</h3>
                <p className="text-sm text-neutral-gray">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="secondary" className="border-error text-error hover:bg-error hover:text-white">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

