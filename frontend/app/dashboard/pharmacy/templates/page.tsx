'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { FiEye, FiCheck, FiMessageSquare } from 'react-icons/fi'
import { websiteSetupApiV2 } from '@/lib/api'

export default function PharmacyTemplatesPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [templateToPay, setTemplateToPay] = useState<number | null>(null)
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('pharmacy')

  // Check user type and redirect hospital users
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const businessType = user.businessType || user.business_type || 'hospital'
      setUserType(businessType)
      
      // Redirect hospital users to hospital setup
      if (businessType === 'hospital') {
        router.push('/dashboard/hospital/setup')
        return
      }
    }
  }, [router])

  const templates = [
    {
      id: 1,
      name: 'Modern Pharmacy',
      description: 'Clean and modern design',
      image: '/first_temp.png',
      price: 299,
      hasAI: true,
      features: ['Modern design', 'Online ordering', 'Featured products', 'AI chatbot', 'Delivery checkout'],
    },
    {
      id: 2,
      name: 'Classic Pharmacy',
      description: 'Traditional design with professional look',
      image: '/sec_temp.png',
      price: 199,
      hasAI: true,
      features: ['Classic design', 'Service pages', 'Product showcase', 'Location map', 'Simple checkout'],
    },
    {
      id: 3,
      name: 'Minimal Pharmacy',
      description: 'Minimalist design focusing on products',
      image: '/third_temp.png',
      price: 149,
      hasAI: false,
      features: ['Clean layout', 'Product focused', 'Quick setup', 'Easy checkout'],
    },
  ]

  const handlePreview = (templateId: number) => {
    // Open demo preview page (sample data, before buying)
    window.open(`/templates/pharmacy/${templateId}?demo=1`, '_blank', 'noopener,noreferrer')
  }

  const handleSelect = (templateId: number) => {
    setTemplateToPay(templateId)
    setPaymentOpen(true)
  }

  const handlePaymentSuccess = () => {
    if (templateToPay) {
      // Store selected template
      localStorage.setItem('selectedTemplate', templateToPay.toString())
      const selected = templates.find((t) => t.id === templateToPay)
      if (selected) {
        localStorage.setItem('totalPrice', selected.price.toString())
        // Store subscription start date for billing info (1 month period)
        const now = new Date().toISOString()
        localStorage.setItem('templateSubscriptionStartedAt', now)
      }

      // Persist selection to backend (best-effort; user stays unblocked if it fails)
      websiteSetupApiV2.update({
        template_id: templateToPay,
        is_paid: true,
        total_price: selected?.price ?? 0,
      }).catch((err) => {
        console.error('Failed to save template selection:', err)
      })
      // Redirect to pharmacy setup
      router.push(`/dashboard/pharmacy/setup?template=${templateToPay}`)
    }
  }

  // Don't render anything for hospital users (they'll be redirected)
  if (userType === 'hospital') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-gray">Redirecting to hospital setup...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-dark mb-2">Choose a Pharmacy Template</h1>
        <p className="text-sm sm:text-base text-neutral-gray">Select a template that matches your pharmacy's style</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden group cursor-pointer">
            <div className="h-48 sm:h-64 relative overflow-hidden">
              <Image
                src={template.image}
                alt={`${template.name} template preview`}
                fill
                className="object-cover"
              />
              {template.hasAI && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-ai text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium z-20">
                  <FiMessageSquare size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">AI Included</span>
                  <span className="sm:hidden">AI</span>
                </div>
              )}
              {/* Hover overlay with features */}
              <div className="absolute inset-0 z-10 bg-neutral-dark/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col p-3 sm:p-4">
                <h4 className="text-base sm:text-lg font-semibold mb-2">Template Features</h4>
                <ul className="space-y-1 text-xs sm:text-sm overflow-y-auto">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <FiCheck className="text-success" size={12} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-dark">
                  {template.name}
                </h3>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-primary">${template.price}</p>
                  <p className="text-xs text-neutral-gray">one-time</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-neutral-gray mb-4 sm:mb-6">{template.description}</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handlePreview(template.id)}
                >
                  <FiEye className="mr-2" />
                  Preview
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleSelect(template.id)}
                >
                  Select & Pay
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selectedTemplate ? templates[selectedTemplate - 1].name : ''}
        size="xl"
      >
        <div className="space-y-4">
          <div className="h-96 relative rounded-lg overflow-hidden">
            {selectedTemplate && (
              <Image
                src={templates[selectedTemplate - 1].image}
                alt={`${templates[selectedTemplate - 1].name} full preview`}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {selectedTemplate && (
              <Button
                variant="primary"
                onClick={() => {
                  setPreviewOpen(false)
                  handleSelect(selectedTemplate)
                }}
              >
                Select This Template
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {templateToPay && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => {
            setPaymentOpen(false)
            setTemplateToPay(null)
          }}
          amount={templates.find(t => t.id === templateToPay)?.price || 0}
          description={`Payment for ${templates.find(t => t.id === templateToPay)?.name} template`}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
