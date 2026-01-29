'use client'

import Link from 'next/link'
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi'

type Product = {
  id: string
  name: string
  category: string
  description?: string
  price: string
  inStock: boolean
}

type CartItem = { product: Product; quantity: number }

type PharmacySetup = {
  products?: Array<{ name: string; category?: string; description?: string; price?: string; inStock?: boolean }>
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const demoProducts: Product[] = [
  { id: 'd1', name: 'Paracetamol 500mg', category: 'Pain Relief', description: 'Tablets for everyday pain relief.', price: '$4.99', inStock: true },
  { id: 'd2', name: 'Ibuprofen 200mg', category: 'Pain Relief', description: 'Anti-inflammatory pain reliever.', price: '$6.49', inStock: true },
  { id: 'd3', name: 'Vitamin C 1000mg', category: 'Vitamins', description: 'Immune system support.', price: '$9.99', inStock: true },
  { id: 'd4', name: 'Allergy Relief 24h', category: 'Allergy', description: 'Non-drowsy allergy tablets.', price: '$13.99', inStock: true },
  { id: 'd5', name: 'Saline Nasal Spray', category: 'Cold & Flu', description: 'Gentle nasal spray.', price: '$3.99', inStock: true },
]

function Template3MedicationsContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams?.get('demo') === '1' || searchParams?.get('demo') === 'true'
  const cartKey = isDemo ? 'pharmacy3_cart_demo' : 'pharmacy3_cart'

  const withDemo = (path: string) => {
    if (!isDemo) return path
    const [base, hash] = path.split('#')
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}demo=1${hash ? `#${hash}` : ''}`
  }

  const [cart, setCart] = useState<CartItem[]>([])
  const [pharmacyProducts, setPharmacyProducts] = useState<Product[]>([])

  useEffect(() => {
    if (isDemo) return
    const setup = safeJsonParse<PharmacySetup>(localStorage.getItem('pharmacySetup'))
    const list = setup?.products?.filter((p) => p.name?.trim()) ?? []
    setPharmacyProducts(
      list.map((p, idx) => ({
        id: `user-${idx}`,
        name: p.name,
        category: p.category || 'General',
        description: p.description,
        price: p.price || '$0.00',
        inStock: p.inStock !== false,
      })),
    )
  }, [isDemo])

  useEffect(() => {
    const saved = safeJsonParse<CartItem[]>(localStorage.getItem(cartKey))
    setCart(saved || [])
  }, [cartKey])

  useEffect(() => {
    if (cart.length > 0) localStorage.setItem(cartKey, JSON.stringify(cart))
    else localStorage.removeItem(cartKey)
  }, [cart, cartKey])

  const allProducts = useMemo(() => (isDemo ? demoProducts : pharmacyProducts), [isDemo, pharmacyProducts])

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  )

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId)
      if (!item) return prev
      const newQuantity = item.quantity + delta
      const updated =
        newQuantity <= 0
          ? prev.filter((i) => i.product.id !== productId)
          : prev.map((i) =>
              i.product.id === productId ? { ...i, quantity: newQuantity } : i,
            )
      return updated
    })
  }

  const addToCart = (product: Product) => {
    if (!product.inStock) return
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      return existing
        ? prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { product, quantity: 1 }]
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <Link href={withDemo('/templates/pharmacy/3')} className="text-sm font-semibold">
            Minimal Pharmacy
          </Link>
          <Link
            href={withDemo('/templates/pharmacy/3/checkout')}
            className="relative inline-flex items-center gap-2 rounded-full border border-neutral-border px-4 py-2 text-sm hover:bg-neutral-light transition-colors"
          >
            <FiShoppingCart />
            <span className="hidden sm:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-white text-xs px-2 py-0.5">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Products grid */}
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h1 className="text-lg sm:text-xl font-semibold">All Products</h1>
            <p className="text-xs sm:text-sm text-neutral-gray">
              {allProducts.length} {allProducts.length === 1 ? 'item' : 'items'} found
            </p>
          </div>

          {allProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-border bg-white p-8 text-center text-neutral-gray text-sm">
              No products found. Try a different search or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProducts.map((product) => {
                const cartItem = cart.find((item) => item.product.id === product.id)
                const quantity = cartItem?.quantity || 0
                return (
                  <div
                    key={product.id}
                    className="rounded-lg border border-neutral-border bg-white p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs text-neutral-gray mb-1">{product.category}</div>
                      <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
                      {product.description && (
                        <p className="mt-2 text-xs text-neutral-gray line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-neutral-dark text-sm">
                          {product.price}
                        </div>
                        <div
                          className={`text-xs ${
                            product.inStock ? 'text-success' : 'text-error'
                          }`}
                        >
                          {product.inStock ? 'In stock' : 'Out of stock'}
                        </div>
                      </div>
                      {quantity > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 rounded-full border border-neutral-border flex items-center justify-center text-xs hover:bg-neutral-light"
                          >
                            <FiMinus size={12} />
                          </button>
                          <span className="min-w-[1.75rem] text-center text-sm font-medium">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            disabled={!product.inStock}
                            aria-label="Increase quantity"
                            className="w-7 h-7 rounded-full border border-neutral-border flex items-center justify-center text-xs hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={!product.inStock}
                          className="px-3 py-2 rounded-full border border-neutral-border text-xs sm:text-sm hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {product.inStock ? 'Add to cart' : 'Out of stock'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default function Template3MedicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Template3MedicationsContent />
    </Suspense>
  )
}

