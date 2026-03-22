'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useMemo, useState, Suspense } from 'react'
import { FiClock, FiMapPin, FiPhoneCall, FiShoppingBag, FiShield, FiTruck, FiCheck, FiArrowRight, FiShoppingCart } from 'react-icons/fi'
import { AIChatbot } from '@/components/pharmacy/AIChatbot'
import { useSearchParams } from 'next/navigation'
import { getSiteItem, setSiteItem, removeSiteItem, getStoredUser, setSiteOwnerId } from '@/lib/storage'

type PharmacySetup = {
  phone?: string
  email?: string
  address?: string
  products?: Array<{
    name: string
    category?: string
    description?: string
    price?: string
    inStock?: boolean
  }>
}

type BusinessInfo = {
  name?: string
  logo?: string // Base64 data URL
  about?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
  workingHours?: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  >
}

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

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function PharmacyTemplate1PageContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams?.get('demo') === '1' || searchParams?.get('demo') === 'true'
  const cartKey = isDemo ? 'pharmacy_cart_demo' : 'pharmacy_cart'
  const withDemo = (path: string) => {
    if (!isDemo) return path
    const [base, hash] = path.split('#')
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}demo=1${hash ? `#${hash}` : ''}`
  }

  const [pharmacySetup, setPharmacySetup] = useState<PharmacySetup | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isDemo) return
    const user = getStoredUser()
    if (user?.id) setSiteOwnerId(user.id)
    setPharmacySetup(safeJsonParse<PharmacySetup>(getSiteItem('pharmacySetup')))
    setBusinessInfo(safeJsonParse<BusinessInfo>(getSiteItem('businessInfo')))
  }, [isDemo])

  useEffect(() => {
    const raw = isDemo ? typeof window !== 'undefined' ? localStorage.getItem(cartKey) : null : getSiteItem(cartKey)
    const savedCart = safeJsonParse<CartItem[]>(raw)
    if (savedCart) {
      setCart(savedCart)
      const newSet = new Set<string>()
      savedCart.forEach(item => newSet.add(item.product.id))
      setAddedToCart(newSet)
    }
  }, [cartKey, isDemo])

  useEffect(() => {
    if (cart.length > 0) {
      if (isDemo) localStorage.setItem(cartKey, JSON.stringify(cart))
      else setSiteItem(cartKey, JSON.stringify(cart))
    } else {
      if (isDemo) localStorage.removeItem(cartKey)
      else removeSiteItem(cartKey)
    }
  }, [cart, cartKey, isDemo])

  const brand = useMemo(() => {
    if (isDemo) {
      return {
        name: 'Modern Pharmacy',
        logo: '/mod logo.png',
        about: 'Your trusted neighborhood pharmacy for prescriptions, wellness products, and friendly advice.',
        phone: '+1 (555) 123-4567',
        address: '123 Main Street, City',
        openHours: 'Mon–Fri 09:00–17:00',
      }
    }
    const name = businessInfo?.name?.trim() || ''
    const logo = businessInfo?.logo || null
    const about = businessInfo?.about?.trim() || ''
    const phone = businessInfo?.contactPhone || pharmacySetup?.phone || ''
    const address = businessInfo?.address || pharmacySetup?.address || ''
    
    const hours = businessInfo?.workingHours
    let openHours = ''
    if (hours?.monday?.closed) openHours = 'Hours vary'
    else if (hours?.monday?.open && hours?.monday?.close) openHours = `Mon ${hours.monday.open}–${hours.monday.close}`
    
    return { name, logo, about, phone, address, openHours }
  }, [businessInfo, pharmacySetup, isDemo])

  const products = useMemo(() => {
    if (isDemo) {
      return [
        { id: '1', name: 'Ibuprofen 200mg', category: 'Pain Relief', description: 'Fast pain relief for headaches & fever.', price: '$9.99', inStock: true },
        { id: '2', name: 'Vitamin C 1000mg', category: 'Vitamins', description: 'Daily immune support.', price: '$12.50', inStock: true },
        { id: '3', name: 'Digital Thermometer', category: 'Wellness', description: 'Accurate readings in seconds.', price: '$7.99', inStock: true },
      ]
    }
    
    const list = pharmacySetup?.products?.filter((p) => p.name?.trim()) ?? []
    const productList = list.map((p, idx) => ({
      id: `user-${idx}`,
      name: p.name,
      category: p.category || 'General',
      description: p.description,
      price: p.price || '$0.00',
      inStock: p.inStock !== false,
    }))
    
    return productList.slice(0, 3)
  }, [pharmacySetup, isDemo])

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  const addToCart = (product: Product) => {
    if (!product.inStock) return

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      const updated = existing
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { product, quantity: 1 }]
      
      setAddedToCart((prevSet) => {
        const newSet = new Set<string>()
        prevSet.forEach(id => newSet.add(id))
        newSet.add(product.id)
        return newSet
      })
      return updated
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light/30 via-white to-primary-light/10">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-neutral-dark via-neutral-dark to-neutral-dark/95 text-white">
        <div className="mx-auto max-w-6xl px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-sm">
          <div className="flex items-center gap-2">
            <FiClock className="text-primary" />
            <span>{brand.openHours || ''}</span>
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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-border/50 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <Link href={withDemo("/templates/pharmacy/1")} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
              {isDemo ? (
                <Image src="/mod logo.png" alt="Logo" width={48} height={48} className="object-cover" />
              ) : brand.logo ? (
                brand.logo.startsWith('data:') ? (
                  <img src={brand.logo} alt={`${brand.name || 'Pharmacy'} logo`} className="w-full h-full object-cover" />
                ) : (
                  <Image src={brand.logo} alt={`${brand.name || 'Pharmacy'} logo`} width={48} height={48} className="object-cover" />
                )
              ) : (
                <div className="w-full h-full bg-primary-dark flex items-center justify-center text-white font-bold">
                  {(brand.name || 'P').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-neutral-dark text-lg">{brand.name || (isDemo ? 'Modern Pharmacy' : 'Pharmacy')}</div>
              <div className="text-xs text-neutral-gray">Pharmacy & Wellness</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a className="text-neutral-gray hover:text-primary transition-colors font-medium" href="#services">Services</a>
            <Link className="text-neutral-gray hover:text-primary transition-colors font-medium" href={withDemo("/templates/pharmacy/1/medications")}>Medications</Link>
            <a className="text-neutral-gray hover:text-primary transition-colors font-medium" href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={withDemo("/templates/pharmacy/1/medications")}
              className="px-4 py-2 rounded-lg border border-neutral-border text-neutral-dark hover:bg-gradient-to-r hover:from-primary-light hover:to-primary-light/50 transition-all text-sm font-medium"
            >
              Browse Medications
            </Link>
            <Link
              href={withDemo("/templates/pharmacy/1/checkout")}
              className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg transition-all text-sm font-medium flex items-center gap-2"
            >
              <FiShoppingCart />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {isDemo ? (
            <>
              <Image
                src="/hero-pharmacy.jpg"
                alt="Modern pharmacy hero"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-dark/75 via-neutral-dark/65 to-primary/40" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%)]" />
            </>
          ) : brand.logo ? (
            <>
              {brand.logo.startsWith('data:') ? (
                <img
                  src={brand.logo}
                  alt={`${brand.name} hero background`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={brand.logo}
                  alt={`${brand.name} hero background`}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-dark/75 via-neutral-dark/65 to-primary/40" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/60 via-primary-dark/70 to-neutral-dark/80" />
          )}
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm border border-white/20">
                <FiShield className="text-primary-light" />
                <span className="font-medium">Licensed pharmacists • Trusted care</span>
              </div>
              <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold leading-tight">
                {brand.name || (isDemo ? 'Modern Pharmacy' : 'Welcome to Our Pharmacy')}
              </h1>
              <p className="mt-6 text-white/95 text-lg sm:text-xl leading-relaxed">
                {brand.about || (isDemo ? 'Fast prescriptions. Friendly guidance. Modern experience.' : 'Your trusted pharmacy for all your healthcare needs.')}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href={withDemo("/templates/pharmacy/1/medications")}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-2xl hover:scale-105 transition-all font-semibold text-lg"
                >
                  <FiShoppingBag />
                  Shop Medications
                </Link>
                {brand.phone && (
                  <a
                    href={`tel:${brand.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all font-semibold text-lg"
                  >
                    <FiPhoneCall />
                    Call the Pharmacy
                  </a>
                )}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-light/20 to-primary/30 flex items-center justify-center">
              {isDemo ? (
                <>
                  <Image
                    src="/hero-pharmacy.jpg"
                    alt="Modern pharmacy interior"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark/20 to-transparent" />
                </>
              ) : brand.logo ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  {brand.logo.startsWith('data:') ? (
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      width={400}
                      height={400}
                      className="object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-primary-light/30 to-primary/40">
                  <div className="text-center text-neutral-dark/60">
                    <FiShield className="w-24 h-24 mx-auto mb-4" />
                    <p className="text-lg font-medium">Add your logo in dashboard</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-14 bg-white/50">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-dark">Services built for busy days</h2>
            <p className="mt-2 text-neutral-gray max-w-2xl">
              A clean, modern layout for pharmacies that want trust + speed.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group rounded-2xl border border-neutral-border bg-white p-6 hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <FiTruck size={24} />
            </div>
            <h3 className="mt-5 font-bold text-lg text-neutral-dark">Delivery & Pickup</h3>
            <p className="mt-3 text-sm text-neutral-gray leading-relaxed">
              Same‑day pickup and delivery options with real-time tracking and flexible scheduling.
            </p>
          </div>
          <div className="group rounded-2xl border border-neutral-border bg-white p-6 hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <FiShield size={24} />
            </div>
            <h3 className="mt-5 font-bold text-lg text-neutral-dark">Medication Safety</h3>
            <p className="mt-3 text-sm text-neutral-gray leading-relaxed">
              Expert consultations, drug interaction checks, and comprehensive safety guidance.
            </p>
          </div>
          <div className="group rounded-2xl border border-neutral-border bg-white p-6 hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <FiClock size={24} />
            </div>
            <h3 className="mt-5 font-bold text-lg text-neutral-dark">Refills in Minutes</h3>
            <p className="mt-3 text-sm text-neutral-gray leading-relaxed">
              Quick prescription refills through our online portal or mobile app.
            </p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="bg-gradient-to-b from-white via-neutral-light/30 to-white border-y border-neutral-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-dark bg-gradient-to-r from-neutral-dark to-neutral-dark/80 bg-clip-text">
                Featured Products
              </h2>
              <p className="mt-3 text-neutral-gray max-w-2xl text-lg">
                Shop our most popular medications and wellness products. Add to cart directly or browse our full catalog.
              </p>
            </div>
          </div>

          {products.length === 0 && !isDemo ? (
            <div className="rounded-2xl border border-dashed border-neutral-border bg-white p-8 text-center text-neutral-gray">
              No products yet. Add products in your dashboard (Pharmacy Setup) and publish again.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const isInCart = addedToCart.has(product.id)
                  const cartItem = cart.find((item) => item.product.id === product.id)
                  
                  return (
                    <div key={product.id} className="group rounded-2xl bg-white border-2 border-neutral-border p-6 hover:border-primary/50 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-primary uppercase tracking-wide">{product.category || 'General'}</div>
                          <div className="mt-2 font-bold text-lg text-neutral-dark">{product.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-xl text-primary">{product.price || '—'}</div>
                          <div className={`text-xs font-medium mt-1 ${product.inStock === false ? 'text-error' : 'text-success'}`}>
                            {product.inStock === false ? 'Out of stock' : 'In stock'}
                          </div>
                        </div>
                      </div>
                      {product.description ? (
                        <p className="text-sm text-neutral-gray line-clamp-3 leading-relaxed mb-5">{product.description}</p>
                      ) : (
                        <p className="text-sm text-neutral-gray mb-5">
                          Add a short description in the dashboard to show it here.
                        </p>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock || isInCart}
                        className={`w-full px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                          isInCart
                            ? 'bg-gradient-to-r from-success to-success/90 text-white cursor-default shadow-lg'
                            : product.inStock
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-xl hover:scale-105'
                            : 'bg-neutral-light text-neutral-gray cursor-not-allowed'
                        }`}
                      >
                        {isInCart ? (
                          <span className="flex items-center justify-center gap-2">
                            <FiCheck size={18} />
                            Added to Cart {cartItem && `(${cartItem.quantity})`}
                          </span>
                        ) : product.inStock ? (
                          'Add to Cart'
                        ) : (
                          'Out of Stock'
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* View All Products Button */}
              <div className="mt-12 text-center">
                <Link
                  href={withDemo("/templates/pharmacy/1/medications")}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-primary text-primary hover:bg-gradient-to-r hover:from-primary-light hover:to-primary-light/50 transition-all font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FiShoppingBag size={20} />
                  View All Products
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-6xl px-4 py-16 bg-gradient-to-b from-white to-neutral-light/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-neutral-border p-6">
            <h2 className="text-2xl font-bold text-neutral-dark">Contact & refills</h2>
            <p className="mt-2 text-neutral-gray">
              This is Template 1 (Modern Pharmacy). We'll later connect this to a real checkout/refill flow.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {brand.phone && (
                <div className="flex items-center gap-2 text-neutral-dark">
                  <FiPhoneCall className="text-primary" />
                  <a className="hover:underline" href={`tel:${brand.phone}`}>{brand.phone}</a>
                </div>
              )}
              {brand.address && (
                <div className="flex items-center gap-2 text-neutral-dark">
                  <FiMapPin className="text-primary" />
                  <span>{brand.address}</span>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-neutral-light p-4 text-xs text-neutral-gray">
              Tip: Fill "Pharmacy Setup" and "Business Info" in the dashboard, then refresh this page to see your data.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-border p-6">
            <h3 className="font-semibold text-neutral-dark">Quick message</h3>
            <p className="mt-1 text-sm text-neutral-gray">Demo form (no backend yet)</p>
            <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Full name"
              />
              <input
                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Phone or email"
              />
              <textarea
                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={5}
                placeholder="Message / Refill request details..."
              />
              <button
                className="w-full px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                type="submit"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-border bg-gradient-to-b from-white to-neutral-light/30">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-gray flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} {brand.name || (isDemo ? 'Modern Pharmacy' : 'Pharmacy')}. All rights reserved.</div>
          <div className="opacity-80">Template 1 • Modern Pharmacy</div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChatbot pharmacyName={brand.name || (isDemo ? 'Modern Pharmacy' : 'Pharmacy')} pharmacyPhone={brand.phone || ''} />
    </div>
  )
}

export default function PharmacyTemplate1Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PharmacyTemplate1PageContent />
    </Suspense>
  )
}
