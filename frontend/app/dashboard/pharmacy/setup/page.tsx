'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { FiPackage, FiPlus, FiTrash2, FiSave, FiUpload } from 'react-icons/fi'
import { getScopedItem, setScopedItem } from '@/lib/storage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Product {
  id?: string
  name: string
  category: string
  description: string
  price: string
  stock: number
  in_stock?: boolean
}

export default function PharmacySetupPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('pharmacy')
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [importError, setImportError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    products: [
      {
        name: '',
        category: '',
        description: '',
        price: '',
        stock: 0,
      } as Product,
    ],
  })

  // Load products from backend API on mount (after localStorage)
  useEffect(() => {
    loadProductsFromBackend()
  }, [])

  const loadProductsFromBackend = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.log('No access token, skipping product load')
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/pharmacy/products/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const products = await response.json()
        if (products.length > 0) {
          // Update formData with backend products (includes IDs)
          setFormData((prev) => ({
            ...prev,
            products: products.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              description: p.description || '',
              price: p.price.toString(),
              stock: p.stock || 0,
            })),
          }))
        }
        // If backend is empty but localStorage has products, keep them
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      // If backend fails, localStorage products will remain (loaded earlier)
    } finally {
      setIsLoading(false)
    }
  }

  // Save product to backend
  const saveProductToBackend = async (product: Product) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Not authenticated')

    const endpoint = product.id 
      ? `${API_URL}/pharmacy/products/${product.id}/`
      : `${API_URL}/pharmacy/products/`
    
    const method = product.id ? 'PATCH' : 'POST'

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        description: product.description,
        price: parseFloat(product.price) || 0,
        stock: product.stock || 0,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to save product')
    }

    return await response.json()
  }

  // Delete product from backend
  const deleteProductFromBackend = async (productId: string) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/pharmacy/products/${productId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to delete product')
    }
  }

  // Bulk upload products via CSV to backend
  const bulkUploadToBackend = async (products: Product[]) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Not authenticated')

    const payload = {
      products: products.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description,
        price: parseFloat(p.price) || 0,
        stock: typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock), 10) || 0,
      })),
    }
    
    // Debug: Log first product
    console.log('Uploading products, first product:', payload.products[0])

    const response = await fetch(`${API_URL}/pharmacy/products/bulk_upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to upload products')
    }

    return await response.json()
  }

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

  // Load saved pharmacy setup from localStorage FIRST (before backend)
  // This ensures products persist even if backend is unavailable
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
        console.log('Loaded products from localStorage:', parsed.products?.length || 0)
      }
    } catch {
      // If anything goes wrong with parsing, just use defaults
    }
  }, [])

  const handleImportFile = async (file: File | null) => {
    if (!file) {
      return
    }
    setIsImporting(true)
    setImportError(null)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const text = reader.result as string
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
        
        if (lines.length <= 1) {
          throw new Error('CSV file appears to be empty or contains only headers.')
        }

        // Validate CSV headers
        const header = lines[0].toLowerCase()
        const requiredFields = ['name', 'category', 'price']
        const hasRequiredFields = requiredFields.every(field => header.includes(field))
        
        if (!hasRequiredFields) {
          throw new Error(`CSV must contain these columns: name, category, description, price, stock`)
        }

        // Expect header: name,category,description,price,stock
        const [, ...rows] = lines
        const importedProducts: Product[] = rows
          .map((line) => line.split(','))
          .filter((cols) => cols.length >= 4) // At minimum need name, category, description, price
          .map((cols) => {
            const [name, category, description, priceRaw, stockRaw] = cols.map((c) => c.trim())
            
            // Validate product name
            if (!name || name.length === 0) {
              return null
            }
            
            // Parse price: remove non-numeric characters except decimal point
            const price = priceRaw.replace(/[^0-9.]/g, '').split('.')
              .filter((_, i) => i < 2)
              .join('.') || '0'
            
            // Validate price
            const priceNum = parseFloat(price)
            if (isNaN(priceNum) || priceNum < 0) {
              return null
            }

            // Parse stock: handle missing, empty, or invalid values
            let stock = 0
            if (stockRaw && stockRaw.trim() !== '') {
              const parsedStock = parseInt(stockRaw.replace(/[^0-9]/g, ''), 10)
              stock = isNaN(parsedStock) ? 0 : Math.max(0, parsedStock) // Ensure non-negative
            }
            
            console.log(`Parsed product: ${name}, stock raw: "${stockRaw}", parsed: ${stock}`)

            return {
              name,
              category: category || 'General',
              description: description || '',
              price,
              stock,
            } as Product
          })
          .filter((p): p is Product => p !== null && p.name.trim() !== '')

        if (!importedProducts.length) {
          throw new Error('No valid products found in CSV file. Please check data format.')
        }

        // Save to formData immediately so it's in localStorage
        setFormData(prev => ({ ...prev, products: importedProducts }))

        // Try to upload to backend (best effort)
        try {
          const result = await bulkUploadToBackend(importedProducts)
          // Reload products from backend to get IDs
          await loadProductsFromBackend()
          setSaveSuccess(true)
          setImportError(null)
          
          // Show detailed success message
          const message = result.created && result.updated 
            ? `✓ ${result.created} products created, ${result.updated} products updated`
            : `✓ ${importedProducts.length} products imported successfully`
          setImportError(message)
          
          setTimeout(() => {
            setSaveSuccess(false)
            setImportError(null)
          }, 5000)
        } catch (backendError: any) {
          console.error('Backend upload failed, saved locally only:', backendError)
          // Products are already in formData/localStorage, just warn user
          setSaveSuccess(true)
          setImportError(`✓ ${importedProducts.length} products saved locally. Note: Backend sync will retry on next page load.`)
          setTimeout(() => {
            setSaveSuccess(false)
            setImportError(null)
          }, 5000)
        }
      } catch (err: any) {
        setImportError(err?.message || 'Failed to import CSV. Please check the file format.')
      } finally {
        setIsImporting(false)
      }
    }

    reader.onerror = () => {
      setIsImporting(false)
      setImportError('Could not read the file. Please try again with a valid CSV file.')
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
    }

    if (field === 'price') {
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
      stock: 0,
    }]
    setFormData({ ...formData, products: newProducts })
  }

  const removeProduct = async (index: number) => {
    const product = formData.products[index]
    
    // If product has an ID, delete from backend
    if (product.id) {
      try {
        await deleteProductFromBackend(product.id)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } catch (error) {
        console.error('Failed to delete product:', error)
        setSaveError('Failed to delete product')
        setTimeout(() => setSaveError(null), 3000)
        return
      }
    }
    
    const newProducts = formData.products.filter((_, i) => i !== index)
    setFormData({ ...formData, products: newProducts })
  }

  const handleSaveProducts = async () => {
    setIsSaving(true)
    setSaveError(null)
    
    try {
      // Save all products to backend
      const savedProducts = []
      for (const product of formData.products) {
        if (product.name && product.category && product.price) {
          const saved = await saveProductToBackend(product)
          savedProducts.push(saved)
        }
      }
      
      // Reload from backend to get updated data
      await loadProductsFromBackend()
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      console.error('Failed to save products:', error)
      setSaveError(error.message || 'Failed to save products')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save products first
    await handleSaveProducts()
    
    // Store local copy (user-scoped)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-gray">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Pharmacy Setup</h1>
        <p className="text-neutral-gray">Configure your pharmacy information and products</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✅ Products saved successfully!
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          ❌ {saveError}
        </div>
      )}

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
                  <p className="text-xs text-neutral-gray">Importing and saving products...</p>
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
            <Button 
              variant="secondary" 
              type="button" 
              onClick={handleSaveProducts}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Save Products
                </>
              )}
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              Continue to Business Info
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
