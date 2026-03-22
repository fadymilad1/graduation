'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { FiSend, FiMessageSquare, FiLock, FiDollarSign } from 'react-icons/fi'
import { getScopedItem } from '@/lib/storage'

type ChatMessage = {
  id: number
  type: 'ai' | 'user'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [enabled, setEnabled] = useState(true)
  const [message, setMessage] = useState('')
  const [hasAIChatbot, setHasAIChatbot] = useState(false)
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('hospital')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'ai' as const,
      content: userType === 'hospital' 
        ? "Hello — I can guide you with general hospital information. Please visit your doctor for any health decision; we only help you find information here."
        : "Hello! I can guide you with general pharmacy information. Please visit your doctor or pharmacist for your health — we don't replace them.",
      timestamp: new Date(),
    },
  ])

  useEffect(() => {
    // Check if user has paid for AI chatbot feature (user-scoped)
    const selectedFeatures = getScopedItem('selectedFeatures')
    const userData = localStorage.getItem('user')
    
    if (userData) {
      const user = JSON.parse(userData)
      setUserType(user.businessType || user.business_type || 'hospital')
    }

    if (selectedFeatures) {
      const features = JSON.parse(selectedFeatures)
      setHasAIChatbot(features.aiChatbot === true)
    }

    const selectedTemplate = getScopedItem('selectedTemplate')
    if (userType === 'pharmacy' && selectedTemplate) {
      const templateId = parseInt(selectedTemplate)
      // Templates 1 and 2 include AI (Modern and Classic)
      setHasAIChatbot(templateId === 1 || templateId === 2)
    }
  }, [userType])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: message,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setMessage('')

    // Simulate AI response based on user type
    setTimeout(() => {
      let aiContent = ''
      const lowerMessage = message.toLowerCase()
      
      if (userType === 'hospital') {
        aiContent =
          'Thanks for your message. I only guide you with general information — please visit your doctor for symptoms or treatment decisions. Urgent? Use emergency services.'

        if (
          lowerMessage.includes('pain') ||
          lowerMessage.includes('hurt') ||
          lowerMessage.includes('ache') ||
          lowerMessage.includes('symptom') ||
          lowerMessage.includes('diagnos')
        ) {
          aiContent =
            'Please visit your doctor for symptoms or a diagnosis — I only guide you with general hospital information. If it’s urgent, use emergency services.'
        } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
          aiContent =
            'You can use our website or call us to request an appointment. I cannot confirm bookings in this preview — staff will help you with scheduling.'
        }
      } else if (userType === 'pharmacy') {
        aiContent =
          'Thanks for your message. I only guide you here — please visit your doctor or pharmacist for personal health decisions. How else can I help?'

        if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('drug')) {
          aiContent =
            'I can only guide you with general facts about medications. Visit your doctor or pharmacist for advice that fits you.'
        } else if (lowerMessage.includes('refill') || lowerMessage.includes('prescription')) {
          aiContent =
            'I cannot process refills or prescriptions in chat. Please call the pharmacy or use their official refill process.'
        } else if (lowerMessage.includes('side effect') || lowerMessage.includes('interaction')) {
          aiContent =
            'For side effects and interactions that apply to you personally, speak with your pharmacist — I can only give general information here.'
        } else if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('close')) {
          aiContent =
            'Typical hours are often listed on our site — confirm by phone since they can change. I only give general information in this chat.'
        }
      }

      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: aiContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">
          AI Assistant for {userType === 'hospital' ? 'Patients' : 'Customers'}
        </h1>
        <p className="text-neutral-gray">
          Configure the AI chatbot that helps {userType === 'hospital' ? 'patients' : 'customers'} on your website
        </p>
      </div>

      {!hasAIChatbot ? (
        <Card className="p-8 text-center">
          <FiLock className="mx-auto text-neutral-gray mb-4" size={48} />
          <h3 className="text-xl font-semibold text-neutral-dark mb-2">AI Chatbot Not Available</h3>
          <p className="text-neutral-gray mb-6">
            {userType === 'hospital' 
              ? 'You need to subscribe to the AI Chatbot feature ($29/month) to enable patient assistance on your website.'
              : 'AI Chatbot is included with Modern and Classic pharmacy templates. Upgrade your template to enable patient assistance.'
            }
          </p>
          <Button variant="primary">
            <FiDollarSign className="mr-2" />
            {userType === 'hospital' ? 'Subscribe to AI Chatbot ($29/month)' : 'Upgrade Template'}
          </Button>
        </Card>
      ) : (
        <>
          {/* Toggle */}
          <Card className="p-6">
            <Toggle
              label={`Enable AI Assistant for ${userType === 'hospital' ? 'Patients' : 'Customers'}`}
              checked={enabled}
              onChange={setEnabled}
              description={userType === 'hospital' 
                ? "Allow patients to chat for general information and guidance — not diagnosis; urgent issues belong with clinicians or emergency services"
                : "Allow customers to chat for general advice and pharmacy information — not diagnosis, prescriptions, or refills (those go through your staff)"
              }
            />
          </Card>
        </>
      )}

      {/* Chat Interface */}
      {hasAIChatbot && enabled && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ai rounded-full flex items-center justify-center">
                <FiMessageSquare className="text-white" size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-dark">
                  {userType === 'hospital' ? 'Patient' : 'Customer'} AI Assistant
                </h2>
                <p className="text-sm text-neutral-gray">
                  Test the chatbot that {userType === 'hospital' ? 'patients' : 'customers'} will see
                </p>
              </div>
            </div>
            <div className="text-xs text-neutral-gray bg-neutral-light px-3 py-1 rounded-full">
              Preview Mode
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 bg-neutral-light rounded-lg p-4 mb-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-neutral-border'
                  }`}
                >
                  <p className={msg.type === 'user' ? 'text-white' : 'text-neutral-dark'}>
                    {msg.content}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      msg.type === 'user' ? 'text-primary-light' : 'text-neutral-gray'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-3">
            <Input
              placeholder={`Ask a question as a ${userType === 'hospital' ? 'patient' : 'customer'} would...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              <FiSend className="mr-2" />
              Send
            </Button>
          </form>
        </Card>
      )}

      {/* Features */}
      {hasAIChatbot && userType === 'hospital' && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-dark mb-2">General information (no diagnosis)</h3>
            <p className="text-sm text-neutral-gray mb-3">
              The assistant shares services, departments, and how to reach the hospital — it does not diagnose or direct care for symptoms.
            </p>
            <div className="bg-neutral-light rounded-lg p-3 text-xs text-neutral-gray">
              <p className="font-medium mb-1">Example:</p>
              <p className="italic">“What are your visiting hours?” → general hours and contact guidance</p>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-dark mb-2">Appointment Assistance</h3>
            <p className="text-sm text-neutral-gray">
              Point patients to booking options and phone lines; real scheduling stays with your staff
            </p>
          </Card>
        </div>
      )}

      {hasAIChatbot && userType === 'pharmacy' && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-dark mb-2">General medication education</h3>
            <p className="text-sm text-neutral-gray mb-3">
              Educational information only — not personal dosing, diagnosis, or interactions tailored to the customer; your pharmacist handles that.
            </p>
            <div className="bg-neutral-light rounded-lg p-3 text-xs text-neutral-gray">
              <p className="font-medium mb-1">Example:</p>
              <p className="italic">“What is ibuprofen used for?” → general facts; personal advice → speak to pharmacist</p>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-dark mb-2">Prescriptions & refills — staff only</h3>
            <p className="text-sm text-neutral-gray">
              The chatbot does not process refills or prescriptions; customers are directed to your team or official channels
            </p>
          </Card>
        </div>
      )}

      {hasAIChatbot && userType === 'hospital' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-dark mb-2 text-sm sm:text-base">Service Information</h3>
            <p className="text-xs sm:text-sm text-neutral-gray">
              Provide details about medical services, departments, and available specialists
            </p>
          </Card>
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-dark mb-2 text-sm sm:text-base">Doctor Profiles</h3>
            <p className="text-xs sm:text-sm text-neutral-gray">
              Share information about doctors' specialties, experience, and availability
            </p>
          </Card>
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-dark mb-2 text-sm sm:text-base">General Inquiries</h3>
            <p className="text-xs sm:text-sm text-neutral-gray">
              Answer common patient questions about location, hours, and contact information
            </p>
          </Card>
        </div>
      )}

      {hasAIChatbot && userType === 'pharmacy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-dark mb-2 text-sm sm:text-base">Product Information</h3>
            <p className="text-xs sm:text-sm text-neutral-gray">
              Provide details about available medications, health products, and pharmacy services
            </p>
          </Card>
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-dark mb-2 text-sm sm:text-base">Health & Wellness Tips</h3>
            <p className="text-xs sm:text-sm text-neutral-gray">
              Share general health advice, wellness tips, and information about over-the-counter products
            </p>
          </Card>
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-dark mb-2 text-sm sm:text-base">Store Information</h3>
            <p className="text-xs sm:text-sm text-neutral-gray">
              Answer questions about store hours, location, services, and contact information
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

