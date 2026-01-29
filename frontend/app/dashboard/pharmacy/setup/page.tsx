'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { FileUpload } from '@/components/ui/FileUpload'
import { FiPackage, FiPlus, FiTrash2 } from 'react-icons/fi'

interface Product {
  name: string
  category: string
  description: string
  price: string
  inStock: boolean
}

export default function PharmacySetupPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('pharmacy')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Contact Information
    phone: '',
    email: '',
    address: '',
    
    // Products
    products: [
      {
        name: '',
        category: '',
        description: '',
        price: '',
        inStock: true,
      } as Product,
    ],
  })

  // Automatically save draft whenever form data changes so refresh doesn't lose data
  useEffect(() => {
    try {
      localStorage.setItem('pharmacySetup', JSON.stringify(formData))
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

  // Load saved pharmacy setup when page mounts so data persists on refresh
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('pharmacySetup')
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        // Merge with defaults to avoid missing fields
        setFormData((prev) => ({
          ...prev,
          ...parsed,
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

        // Expect header: name,category,description,price,inStock
        const [, ...rows] = lines
        const importedProducts: Product[] = rows
          .map((line) => line.split(','))
          .filter((cols) => cols.length >= 4) // name, category, description, price (inStock optional)
          .map((cols) => {
            const [name, category, description, price, inStockRaw] = cols.map((c) => c.trim())
            const inStockValue = (inStockRaw || 'true').toLowerCase()
            const inStock =
              inStockValue === 'true' ||
              inStockValue === '1' ||
              inStockValue === 'yes' ||
              inStockValue === 'y' ||
              inStockValue === 'in stock'
            return {
              name,
              category,
              description,
              price,
              inStock,
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
    value: string | boolean
  ) => {
    const newProducts = [...formData.products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setFormData({ ...formData, products: newProducts })
  }

  const addProduct = () => {
    const newProducts = [...formData.products, {
      name: '',
      category: '',
      description: '',
      price: '',
      inStock: true,
    }]
    setFormData({ ...formData, products: newProducts })
  }

  const removeProduct = (index: number) => {
    const newProducts = formData.products.filter((_, i) => i !== index)
    setFormData({ ...formData, products: newProducts })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Store pharmacy setup data
    localStorage.setItem('pharmacySetup', JSON.stringify(formData))
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
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-neutral-dark mb-6">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="contact@pharmacy.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <div className="col-span-2">
                <Textarea
                  label="Address"
                  placeholder="123 Main Street, City, State, ZIP"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </Card>

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
                    name, category, description, price, inStock
                  </span>
                  . You can download a sample file from{' '}
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
                      <input
                        type="text"
                        placeholder="e.g. $9.99"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor={`product-availability-${index}`} className="block text-sm font-medium text-neutral-dark mb-2">
                        Availability
                      </label>
                      <select
                        id={`product-availability-${index}`}
                        value={product.inStock ? 'in-stock' : 'out-of-stock'}
                        onChange={(e) => handleProductChange(index, 'inStock', e.target.value === 'in-stock')}
                        className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        aria-label="Product availability status"
                      >
                        <option value="in-stock">In Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </select>
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
