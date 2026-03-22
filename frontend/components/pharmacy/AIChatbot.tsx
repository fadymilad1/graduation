'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiAlertTriangle } from 'react-icons/fi'

type ChatMessage = {
  id: number
  type: 'ai' | 'user'
  content: string
  timestamp: Date
}

export type AIChatbotVariant = 'pharmacy' | 'hospital'

const PHARMACY_WELCOME_MARKERS = 'medication questions, prescription refills, and pharmacy services'

function hospitalWelcomeMessage(displayName: string): string {
  return `Hello — I'm your guide for ${displayName}: hours, departments, and how our services work. For any health concern or treatment decision, please visit your doctor — we don't diagnose or replace in-person care. How can I help today?`
}

function pharmacyWelcomeMessage(displayName: string): string {
  return `Hello! I'm here to guide you with general pharmacy information at ${displayName}. For your health and medications, you should visit your doctor or pharmacist — we don't diagnose, prescribe, or handle refills here. What would you like to know?`
}

function buildInitialMessages(isHospital: boolean, displayName: string): ChatMessage[] {
  return [
    {
      id: 1,
      type: 'ai',
      content: isHospital ? hospitalWelcomeMessage(displayName) : pharmacyWelcomeMessage(displayName),
      timestamp: new Date(),
    },
  ]
}

interface AIChatbotProps {
  /** Display name of the business (pharmacy or hospital). */
  pharmacyName?: string
  pharmacyPhone?: string
  /** Omit or use route detection: `/templates/hospital` uses hospital mode unless `variant="pharmacy"`. */
  variant?: AIChatbotVariant
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  pharmacyName,
  pharmacyPhone = '+1 (555) 123-4567',
  variant,
}) => {
  const pathname = usePathname() ?? ''
  const onHospitalSite = pathname.includes('/templates/hospital')
  const isHospital =
    variant === 'hospital' || (variant !== 'pharmacy' && onHospitalSite)
  const displayName = pharmacyName ?? (isHospital ? 'Your Hospital' : 'Modern Pharmacy')

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialMessages(isHospital, displayName))
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isHospital) return
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].type !== 'ai') return prev
      if (!prev[0].content.includes(PHARMACY_WELCOME_MARKERS)) return prev
      return [{ ...prev[0], content: hospitalWelcomeMessage(displayName), timestamp: new Date() }]
    })
  }, [isHospital, displayName])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let aiContent = ''
      const lowerMessage = message.toLowerCase()

      if (isHospital) {
        if (
          lowerMessage.includes('diagnos') ||
          lowerMessage.includes('symptom') ||
          lowerMessage.includes('what do i have') ||
          lowerMessage.includes('is this cancer') ||
          lowerMessage.includes('test results')
        ) {
          aiContent =
            'I cannot interpret symptoms or test results — please visit your doctor for that. We only guide you with general hospital information; use emergency services if urgent.'
        } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
          aiContent = `You can request an appointment through our Doctors page when online booking is available, or call the hospital at ${pharmacyPhone} for scheduling. I cannot confirm medical appointments myself — staff will follow up with you.`
        } else if (lowerMessage.includes('department') || lowerMessage.includes('doctor') || lowerMessage.includes('special')) {
          aiContent =
            'Browse our Doctors & Departments page for specialties and profiles. I can only give general guidance here — for clinical questions, please speak with our medical staff.'
        } else if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('close') || lowerMessage.includes('when')) {
          aiContent =
            'Typical hours are listed on our site; for the latest schedule or holiday changes, please call the front desk. I can only share general information here.'
        } else if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
          aiContent = `For directions and parking, see our contact information or call ${pharmacyPhone}.`
        } else if (lowerMessage.includes('emergency') || lowerMessage.includes('911') || lowerMessage.includes('urgent')) {
          aiContent =
            'For life-threatening emergencies, call your local emergency number (e.g. 911) immediately. This chat is not monitored for emergencies.'
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          aiContent =
            'Hello — I can guide you with general hospital information. For your health, please visit your doctor; we only help you find information here.'
        } else {
          aiContent =
            'Thanks for your message. I can guide you with general information about our hospital — not personal medical advice. Please visit your doctor for care decisions. What would you like to know?'
        }
      } else if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('drug')) {
        aiContent =
          'I can only guide you with general education about medications. You should visit your doctor or pharmacist for advice that fits you personally — we don’t replace them.'
      } else if (lowerMessage.includes('refill') || lowerMessage.includes('prescription')) {
        aiContent = `I can't handle refills here — I only guide you with general info. Please call ${pharmacyPhone} or your doctor/pharmacy team for prescriptions and refills.`
      } else if (lowerMessage.includes('side effect') || lowerMessage.includes('interaction')) {
        aiContent =
          'For medication side effects and drug interactions, I recommend speaking directly with our pharmacist for personalized advice. They can review your complete medication list for safety. Would you like our phone number?'
      } else if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('close') || lowerMessage.includes('when')) {
        aiContent =
          'Typical hours are often Monday–Friday 9AM–8PM, Saturday 9AM–6PM, Sunday 10AM–4PM — confirm on our site or by calling us, since hours can change. I only give general information here.'
      } else if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
        aiContent = `You can find us at our main location. For the exact address, please call us at ${pharmacyPhone} or check our contact page. We also offer delivery services!`
      } else if (lowerMessage.includes('delivery') || lowerMessage.includes('deliver') || lowerMessage.includes('ship')) {
        aiContent =
          "Yes! We offer home delivery services. You can place an order through our website or call us. Delivery is available for most medications and products. Is there something specific you'd like delivered?"
      } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
        aiContent =
          'Pricing varies by medication and insurance coverage. For accurate pricing, please call us at ' +
          pharmacyPhone +
          ' with your prescription details, or visit our medications page to see product prices.'
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        aiContent =
          'Hello — I can guide you with general pharmacy information. Please visit your doctor or pharmacist for health decisions; we only help point you in the right direction here.'
      } else {
        aiContent =
          'Thanks for your message. I only guide you with general information — please visit your doctor or pharmacist for personal health and medication decisions. How else can I help?'
      }

      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 500) // Simulate thinking time
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50 group"
        aria-label={isHospital ? 'Open hospital assistant' : 'Open AI Chatbot'}
      >
        <FiMessageSquare size={24} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white animate-pulse"></span>
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-neutral-dark text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isHospital ? 'Hospital assistant' : 'Chat with us!'}
        </span>
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-neutral-border z-50 flex flex-col transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <FiMessageSquare size={20} />
          </div>
          <div>
            <div className="font-semibold">
              {isHospital ? `${displayName} — Hospital Assistant` : `${displayName} Assistant`}
            </div>
            <div className="text-xs text-white/80">
              {isHospital
                ? 'We guide you — see your doctor for care'
                : 'We guide you — see your doctor or pharmacist'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            <FiMinimize2 size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div
            className="shrink-0 mx-3 mt-3 rounded-xl border-2 border-red-600 bg-red-50 px-3 py-2.5 shadow-md ring-2 ring-red-200/80"
            role="alert"
          >
            <div className="flex gap-2 items-start">
              <FiAlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} aria-hidden />
              <div className="text-xs leading-snug">
                <p className="font-bold uppercase tracking-wide text-red-800">Guidance only — visit your doctor</p>
                {isHospital ? (
                  <p className="text-red-900 mt-1 font-medium">
                    We do not diagnose or treat. You should visit your doctor (or emergency services if urgent) for
                    symptoms, results, or any medical decision. We are only here to guide you with general hospital
                    information — not to replace your clinician.
                  </p>
                ) : (
                  <p className="text-red-900 mt-1 font-medium">
                    We do not diagnose, prescribe, or handle refills in this chat. You should visit your doctor or speak
                    with your pharmacist for personal health and medication decisions. We only guide you with general
                    information (hours, products, how the pharmacy works).
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-light/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary-dark text-white'
                      : 'bg-white border border-neutral-border text-neutral-dark shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-white/70' : 'text-neutral-gray'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-gray rounded-full animate-bounce [animation-delay:0ms]"></div>
                    <div className="w-2 h-2 bg-neutral-gray rounded-full animate-bounce [animation-delay:150ms]"></div>
                    <div className="w-2 h-2 bg-neutral-gray rounded-full animate-bounce [animation-delay:300ms]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-neutral-border bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isHospital
                    ? 'Ask about services, departments, visiting hours…'
                    : 'Ask about hours, products, or general questions…'
                }
                className="flex-1 px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <FiSend size={18} />
              </button>
            </div>
            <p className="text-xs text-neutral-gray mt-2 text-center">
              {isHospital
                ? 'We guide you only — visit your doctor for care • Emergencies: local emergency number'
                : 'We guide you only — visit your doctor or pharmacist for health decisions • Emergencies: local number'}
            </p>
          </form>
        </>
      )}
    </div>
  )
}
