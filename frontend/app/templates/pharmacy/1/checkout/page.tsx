'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { FiClock, FiMapPin, FiPhoneCall, FiShoppingCart, FiCheckCircle, FiArrowLeft } from 'react-icons/fi'
import { AIChatbot } from '@/components/pharmacy/AIChatbot'
import { useSearchParams } from 'next/navigation'
import { getSiteItem, setSiteItem, removeSiteItem, getStoredUser, getSiteOwnerId, getPrefixForUserId, getItemForUser, setItemForUser } from '@/lib/storage'

type Product = {
  id: string
  name: string
  category: string
  description?: string
  price: string
  inStock: boolean
}

type CartItem = {
  product: Product
  quantity: number
}

type DeliveryInfo = {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  deliveryMethod: 'pickup' | 'delivery'
  paymentMethod: 'cash' | 'card'
  specialInstructions: string
}

type CardInfo = {
  cardholderName: string
  cardNumber: string
  expiry: string // MM/YY
  cvc: string
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

type BusinessInfo = {
  name?: string
  logo?: string
  contactPhone?: string
  address?: string
}

type PharmacySetup = {
  phone?: string
  address?: string
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDemo = searchParams?.get('demo') === '1' || searchParams?.get('demo') === 'true'
  const cartKey = isDemo ? 'pharmacy_cart_demo' : 'pharmacy_cart'
  const withDemo = (path: string) => {
    if (!isDemo) return path
    const [base, hash] = path.split('#')
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}demo=1${hash ? `#${hash}` : ''}`
  }

  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [brand, setBrand] = useState<{ name: string; logo: string | null; phone: string; address: string }>({
    name: isDemo ? 'Modern Pharmacy' : '',
    logo: isDemo ? '/mod logo.png' : null,
    phone: isDemo ? '+1 (555) 123-4567' : '',
    address: isDemo ? '123 Main Street, City' : '',
  })

  const [formData, setFormData] = useState<DeliveryInfo>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryMethod: 'delivery',
    paymentMethod: 'cash',
    specialInstructions: '',
  })

  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  })

  const digitsOnly = (value: string) => value.replace(/\D+/g, '')

  const formatCardNumber = (value: string) => {
    const digits = digitsOnly(value).slice(0, 19) // allow up to 19 digits (Amex/others)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (value: string) => {
    const digits = digitsOnly(value).slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  const formatCvc = (value: string) => digitsOnly(value).slice(0, 4)

  useEffect(() => {
    if (isDemo) return
    const businessInfo = safeJsonParse<BusinessInfo>(getSiteItem('businessInfo'))
    const setup = safeJsonParse<PharmacySetup>(getSiteItem('pharmacySetup'))
    setBrand({
      name: businessInfo?.name?.trim() || '',
      logo: businessInfo?.logo || null,
      phone: businessInfo?.contactPhone || setup?.phone || '',
      address: businessInfo?.address || setup?.address || '',
    })
  }, [isDemo])

  useEffect(() => {
    const raw = isDemo ? localStorage.getItem(cartKey) : getSiteItem(cartKey)
    const savedCart = safeJsonParse<CartItem[]>(raw)
    if (savedCart && savedCart.length > 0) {
      setCart(savedCart)
    } else {
      const redirectPath = isDemo ? '/templates/pharmacy/1/medications?demo=1' : '/templates/pharmacy/1/medications'
      router.push(redirectPath)
    }
  }, [router, cartKey, isDemo])

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.product.price.replace('$', '')) || 0
      return sum + price * item.quantity
    }, 0)
  }, [cart])

  const deliveryFee = useMemo(() => {
    return formData.deliveryMethod === 'delivery' ? 5.99 : 0
  }, [formData.deliveryMethod])

  const total = useMemo(() => {
    return subtotal + deliveryFee
  }, [subtotal, deliveryFee])

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId)
      if (!item) return prev

      const newQuantity = item.quantity + delta
      const updated = newQuantity <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity: newQuantity } : i))
      
      if (updated.length > 0) {
        if (isDemo) localStorage.setItem(cartKey, JSON.stringify(updated))
        else setSiteItem(cartKey, JSON.stringify(updated))
      } else {
        if (isDemo) localStorage.removeItem(cartKey)
        else removeSiteItem(cartKey)
        const redirectPath = isDemo ? '/templates/pharmacy/1/medications?demo=1' : '/templates/pharmacy/1/medications'
        setTimeout(() => router.push(redirectPath), 0)
      }
      return updated
    })
  }

  const removeItem = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.product.id !== productId)
      if (updated.length > 0) {
        if (isDemo) localStorage.setItem(cartKey, JSON.stringify(updated))
        else setSiteItem(cartKey, JSON.stringify(updated))
      } else {
        if (isDemo) localStorage.removeItem(cartKey)
        else removeSiteItem(cartKey)
        const redirectPath = isDemo ? '/templates/pharmacy/1/medications?demo=1' : '/templates/pharmacy/1/medications'
        setTimeout(() => router.push(redirectPath), 0)
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic card validation (UI-only; no real payment processing here)
    if (formData.paymentMethod === 'card') {
      const cardNumberDigits = digitsOnly(cardInfo.cardNumber)
      const expiry = cardInfo.expiry.trim()
      const cvc = digitsOnly(cardInfo.cvc)

      const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(expiry)
      const month = expiryMatch ? Number(expiryMatch[1]) : 0
      const year2 = expiryMatch ? Number(expiryMatch[2]) : -1
      const isExpiryValid = Boolean(expiryMatch) && month >= 1 && month <= 12 && year2 >= 0

      const isCardNumberValid = cardNumberDigits.length >= 13 && cardNumberDigits.length <= 19
      const isCvcValid = cvc.length >= 3 && cvc.length <= 4
      const isNameValid = cardInfo.cardholderName.trim().length >= 2

      if (!isNameValid || !isCardNumberValid || !isExpiryValid || !isCvcValid) {
        alert('Please enter valid card details (name, card number, expiry MM/YY, and CVC).')
        return
      }
    }

    setIsSubmitting(true)

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate order number
    const orderNum = `ORD-${Date.now().toString().slice(-8)}`
    setOrderNumber(orderNum)

    // Save order to localStorage (for demo)
    const order = {
      orderNumber: orderNum,
      items: cart,
      deliveryInfo: formData,
      payment: formData.paymentMethod === 'card'
        ? { method: 'card', last4: digitsOnly(cardInfo.cardNumber).slice(-4) }
        : { method: 'cash' },
      total,
      placedAt: new Date().toISOString(),
    }
    const ownerId = !isDemo ? (getStoredUser()?.id ?? getSiteOwnerId()) : null
    if (ownerId) {
      const prefix = getPrefixForUserId(ownerId)
      localStorage.setItem(`${prefix}pharmacy_order_${orderNum}`, JSON.stringify(order))
      try {
        const listRaw = getItemForUser(ownerId, 'pharmacyOrders')
        const list = JSON.parse(listRaw || '[]')
        list.push({
          id: orderNum,
          customerName: formData.fullName?.trim() || 'Customer',
          customerEmail: formData.email?.trim(),
          total,
          status: 'pending',
          createdAt: order.placedAt,
          items: cart.map((i) => `${i.product.name}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`),
        })
        setItemForUser(ownerId, 'pharmacyOrders', JSON.stringify(list))
      } catch {
        // ignore
      }
    } else if (!isDemo) {
      localStorage.setItem(`pharmacy_order_${orderNum}`, JSON.stringify(order))
      try {
        const list = JSON.parse(localStorage.getItem('pharmacyOrders') || '[]')
        list.push({
          id: orderNum,
          customerName: formData.fullName?.trim() || 'Customer',
          customerEmail: formData.email?.trim(),
          total,
          status: 'pending',
          createdAt: order.placedAt,
          items: cart.map((i) => `${i.product.name}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`),
        })
        localStorage.setItem('pharmacyOrders', JSON.stringify(list))
      } catch {
        // ignore
      }
    } else {
      localStorage.setItem(`pharmacy_order_${orderNum}`, JSON.stringify(order))
    }

    // Clear cart
    if (isDemo) localStorage.removeItem(cartKey)
    else removeSiteItem(cartKey)
    setCart([])

    setOrderPlaced(true)
    setIsSubmitting(false)
  }


  if (cart.length === 0 && !orderPlaced) {
    return null // Will redirect
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FiCheckCircle className="mx-auto text-success mb-4" size={64} />
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">Order Placed Successfully!</h1>
          <p className="text-neutral-gray mb-6">
            Thank you for your order. We'll process it and contact you shortly.
          </p>
          <div className="bg-neutral-light rounded-lg p-6 mb-6">
            <p className="text-sm text-neutral-gray mb-2">Order Number</p>
            <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={withDemo("/templates/pharmacy/1/medications")}
              className="px-6 py-3 rounded-lg border border-neutral-border text-neutral-dark hover:bg-neutral-light transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href={withDemo("/templates/pharmacy/1")}
              className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-neutral-dark via-neutral-dark to-neutral-dark/95 text-white">
        <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-sm">
          <div className="flex items-center gap-2">
            <FiClock className="text-primary" />
            <span>{isDemo ? 'Mon–Fri 09:00–17:00' : ''}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {brand.phone && (
              <>
                <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href={`tel:${brand.phone}`}>
                  <FiPhoneCall />
                  <span>{brand.phone}</span>
                </a>
                {brand.address && <span className="hidden sm:inline opacity-60">•</span>}
              </>
            )}
            {brand.address && (
              <div className="inline-flex items-center gap-2">
                <FiMapPin className="text-primary" />
                <span className="truncate max-w-[28rem]">{brand.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-neutral-border/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-3">
          <Link href={withDemo("/templates/pharmacy/1")} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
              {isDemo ? (
                <Image src="/mod logo.png" alt="Logo" width={48} height={48} className="object-cover" />
              ) : brand.logo ? (
                brand.logo.startsWith('data:') ? (
                  <img src={brand.logo} alt={`${brand.name} logo`} className="w-full h-full object-cover" />
                ) : (
                  <Image src={brand.logo} alt={`${brand.name} logo`} width={48} height={48} className="object-cover" />
                )
              ) : (
                <div className="w-full h-full bg-primary-dark flex items-center justify-center text-white font-bold">
                  {brand.name.charAt(0).toUpperCase() || 'P'}
                </div>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-neutral-dark text-lg">{brand.name || (isDemo ? 'Modern Pharmacy' : 'Pharmacy')}</div>
              <div className="text-xs text-neutral-gray">Pharmacy & Wellness</div>
            </div>
          </Link>
          <Link
            href={withDemo("/templates/pharmacy/1/medications")}
            className="text-sm text-neutral-gray hover:text-primary transition-colors flex items-center gap-2 font-medium"
          >
            <FiArrowLeft />
            <span>Back to Medications</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-neutral-dark mb-6">Delivery Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-border p-6 space-y-4">
                <h3 className="font-semibold text-neutral-dark">Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      Full Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      Email <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      Phone <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-border p-6 space-y-4">
                <h3 className="font-semibold text-neutral-dark">Delivery Address</h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Street Address <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      City <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      State <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      ZIP Code <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-border p-6 space-y-4">
                <h3 className="font-semibold text-neutral-dark">Delivery & Payment</h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-3">
                    Delivery Method <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery' })}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.deliveryMethod === 'delivery'
                          ? 'border-primary bg-primary-light'
                          : 'border-neutral-border hover:bg-neutral-light'
                      }`}
                    >
                      <div className="font-medium text-neutral-dark">Home Delivery</div>
                      <div className="text-xs text-neutral-gray mt-1">$5.99 delivery fee</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.deliveryMethod === 'pickup'
                          ? 'border-primary bg-primary-light'
                          : 'border-neutral-border hover:bg-neutral-light'
                      }`}
                    >
                      <div className="font-medium text-neutral-dark">Store Pickup</div>
                      <div className="text-xs text-neutral-gray mt-1">Free pickup</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-3">
                    Payment Method <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.paymentMethod === 'cash'
                          ? 'border-primary bg-primary-light'
                          : 'border-neutral-border hover:bg-neutral-light'
                      }`}
                    >
                      <div className="font-medium text-neutral-dark">Cash on Delivery</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.paymentMethod === 'card'
                          ? 'border-primary bg-primary-light'
                          : 'border-neutral-border hover:bg-neutral-light'
                      }`}
                    >
                      <div className="font-medium text-neutral-dark">Credit/Debit Card</div>
                    </button>
                  </div>
                </div>

                {formData.paymentMethod === 'card' && (
                  <div className="rounded-xl border border-neutral-border bg-neutral-light/40 p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="font-semibold text-neutral-dark">Card Details</div>
                        <div className="text-xs text-neutral-gray">Demo only — no real payment will be processed.</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          Cardholder Name <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cardInfo.cardholderName}
                          onChange={(e) => setCardInfo({ ...cardInfo, cardholderName: e.target.value })}
                          className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Name on card"
                          autoComplete="cc-name"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          Card Number <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cardInfo.cardNumber}
                          onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
                          className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="1234 5678 9012 3456"
                          autoComplete="cc-number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          Expiry (MM/YY) <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cardInfo.expiry}
                          onChange={(e) => setCardInfo({ ...cardInfo, expiry: formatExpiry(e.target.value) })}
                          className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="MM/YY"
                          autoComplete="cc-exp"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-dark mb-2">
                          CVC <span className="text-error">*</span>
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          required
                          value={cardInfo.cvc}
                          onChange={(e) => setCardInfo({ ...cardInfo, cvc: formatCvc(e.target.value) })}
                          className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="123"
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Any special delivery instructions or notes..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-neutral-border p-6 sticky top-4">
              <h3 className="text-xl font-bold text-neutral-dark mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-start justify-between gap-3 pb-4 border-b border-neutral-border last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-neutral-dark text-sm">{item.product.name}</div>
                      <div className="text-xs text-neutral-gray">{item.product.category}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded border border-neutral-border flex items-center justify-center text-xs hover:bg-neutral-light"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded border border-neutral-border flex items-center justify-center text-xs hover:bg-neutral-light"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-2 text-xs text-error hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-neutral-dark">
                        ${(parseFloat(item.product.price.replace('$', '')) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-6 pt-4 border-t border-neutral-border">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-gray">Subtotal</span>
                  <span className="text-neutral-dark">${subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-gray">Delivery Fee</span>
                    <span className="text-neutral-dark">${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-border">
                  <span className="text-neutral-dark">Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
              <Link
                href={withDemo("/templates/pharmacy/1/medications")}
                className="block text-center text-sm text-primary hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <AIChatbot pharmacyName={brand.name || (isDemo ? 'Modern Pharmacy' : 'Pharmacy')} pharmacyPhone={brand.phone || ''} />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}
