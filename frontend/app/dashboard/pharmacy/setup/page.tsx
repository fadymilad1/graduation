'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { FiPackage, FiPlus, FiTrash2 } from 'react-icons/fi'
import { getScopedItem, setScopedItem } from '@/lib/storage'

interface Product {
  name: string
  category: string
  description: string
  price: string
  inStock: boolean
  stock?: number
}

export default function PharmacySetupPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('pharmacy')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    products: [
      {
        name: '',
        category: '',
        description: '',
        price: '',
        inStock: true,
        stock: 0,
      } as Product,
    ],
  })

  // Automatically save draft whenever form data changes (user-scoped)
  useEffect(() => {
    try {
      setScopedItem('pharmacySetup', JSON.stringify(formData))
    } catch {
      // Ignore write errors (e.g. storage disabled)
    }
  }, [formData])

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

  // Load saved pharmacy setup when page mounts (user-scoped)
  useEffect(() => {
    try {
      const savedDraft = getScopedItem('pharmacySetup')
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        // Merge with defaults to avoid missing fields
        setFormData((prev) => ({
          ...prev,
          products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : prev.products,
        }))
      }
    } catch {
      // If anything goes wrong with parsing, just use defaults
    }
  }, [])

  const handleImportFile = (file: File | null) => {
    if (!file) {
      return
    }
    setIsImporting(true)
    setImportError(null)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
        if (lines.length <= 1) {
          throw new Error('File appears to be empty.')
        }

        // Expect header: name,category,description,price,stock (or legacy inStock)
        const [, ...rows] = lines
        const importedProducts: Product[] = rows
          .map((line) => line.split(','))
          .filter((cols) => cols.length >= 4) // name, category, description, price, (stock/inStock optional)
          .map((cols) => {
            const [name, category, description, priceRaw, stockOrInStockRaw] = cols.map((c) => c.trim())
            const price = priceRaw.replace(/[^0-9.]/g, '').split('.')
              .filter((_, i) => i < 2)
              .join('.') || ''

            let stock: number | undefined
            let inStock = true

            if (stockOrInStockRaw) {
              const numeric = Number(stockOrInStockRaw)
              if (!Number.isNaN(numeric) && numeric >= 0) {
                stock = Math.floor(numeric)
                inStock = stock > 0
              } else {
                const inStockValue = stockOrInStockRaw.toLowerCase()
                inStock =
                  inStockValue === 'true' ||
                  inStockValue === '1' ||
                  inStockValue === 'yes' ||
                  inStockValue === 'y' ||
                  inStockValue === 'in stock'
                stock = inStock ? undefined : 0
              }
            }

            return {
              name,
              category,
              description,
              price,
              inStock,
              stock,
            } as Product
          })
          .filter((p) => p.name && p.category && p.price)

        if (!importedProducts.length) {
          throw new Error('No valid products found in file.')
        }

        setFormData((prev) => ({
          ...prev,
          products: importedProducts,
        }))
      } catch (err: any) {
        setImportError(err?.message || 'Failed to import products. Please check the file format.')
      } finally {
        setIsImporting(false)
      }
    }

    reader.onerror = () => {
      setIsImporting(false)
      setImportError('Could not read the file. Please try again.')
    }

    reader.readAsText(file)
  }

  const handleProductChange = (
    index: number,
    field: keyof Product,
    value: string | boolean | number
  ) => {
    const newProducts = [...formData.products]
    let updatedProduct = { ...newProducts[index], [field]: value }

    if (field === 'stock') {
      const numeric = typeof value === 'number' ? value : parseInt(String(value), 10)
      const safeStock = Number.isNaN(numeric) || numeric < 0 ? 0 : numeric
      updatedProduct.stock = safeStock
      updatedProduct.inStock = safeStock > 0
    }

    if (field === 'price') {
      // Store only digits and one decimal point; strip currency symbols
      const raw = String(value).replace(/[^0-9.]/g, '')
      const parts = raw.split('.')
      const normalized = parts.length > 1
        ? `${parts[0] || '0'}.${parts.slice(1).join('')}`
        : raw
      updatedProduct.price = normalized
    }

    newProducts[index] = updatedProduct
    setFormData({ ...formData, products: newProducts })
  }

  const addProduct = () => {
    const newProducts = [...formData.products, {
      name: '',
      category: '',
      description: '',
      price: '',
      inStock: true,
      stock: 0,
    }]
    setFormData({ ...formData, products: newProducts })
  }

  const removeProduct = (index: number) => {
    const newProducts = formData.products.filter((_, i) => i !== index)
    setFormData({ ...formData, products: newProducts })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Store pharmacy setup data (user-scoped)
    setScopedItem('pharmacySetup', JSON.stringify(formData))
    // Redirect to business info
    router.push('/dashboard/business-info?type=pharmacy')
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Pharmacy Setup</h1>
        <p className="text-neutral-gray">Configure your pharmacy information and products</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Products & Information */}
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold text-neutral-dark">Products & Information</h2>
                <p className="text-sm text-neutral-gray">
                  You can add products one by one or import many at once from a CSV file.
                </p>
                <p className="text-xs text-neutral-gray mt-2">
                  CSV format:&nbsp;
                  <span className="font-mono">
                    name, category, description, price, stock
                  </span>
                  &nbsp;(you can also use legacy <span className="font-mono">inStock</span> values like
                  &nbsp;true/false). You can download a sample file from{' '}
                  <a
                    href="/sample-pharmacy-products.csv"
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                  .
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <Button type="button" variant="secondary" onClick={addProduct}>
                  <FiPlus className="mr-2" />
                  Add Product
                </Button>
                <FileUpload
                  label="Import products (CSV)"
                  accept=".csv"
                  onChange={handleImportFile}
                  error={importError || undefined}
                />
                {isImporting && (
                  <p className="text-xs text-neutral-gray">Importing products...</p>
                )}
              </div>
            </div>
            <div className="space-y-6">
              {formData.products.map((product, index) => (
                <div key={index} className="border border-neutral-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FiPackage className="text-primary" />
                      <span className="font-medium text-neutral-dark">Product {index + 1}</span>
                    </div>
                    {formData.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-2 text-error hover:bg-neutral-light rounded-lg transition-colors"
                        aria-label="Remove product"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        Product Name {!product.name && <span className="text-error text-xs">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ibuprofen 200mg"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        Category {!product.category && <span className="text-error text-xs">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pain Relief, Vitamins, Prescription"
                        value={product.category}
                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-2">
                        Price {!product.price && <span className="text-error text-xs">*</span>}
                      </label>
                      <div className="flex items-center border border-neutral-border rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                        <span className="pl-4 py-2 text-neutral-gray font-medium" aria-hidden="true">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="9.99"
                          value={product.price}
                          onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                          required
                          className="flex-1 min-w-0 py-2 pr-4 border-0 rounded-r-lg focus:ring-0 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`product-stock-${index}`} className="block text-sm font-medium text-neutral-dark mb-2">
                        Stock quantity
                      </label>
                      <input
                        id={`product-stock-${index}`}
                        type="number"
                        min={0}
                        placeholder="e.g. 25"
                        value={product.stock ?? ''}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            'stock',
                            e.target.value === '' ? 0 : Number(e.target.value),
                          )
                        }
                        className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <p className="text-xs text-neutral-gray mt-1">
                        Enter how many units of this product are available in stock.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Brief description of the product..."
                      value={product.description}
                      onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="secondary" type="button">
              Save Draft
            </Button>
            <Button variant="primary" type="submit">
              Continue to Business Info
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
