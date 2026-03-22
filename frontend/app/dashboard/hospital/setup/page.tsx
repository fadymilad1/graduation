'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Toggle } from '@/components/ui/Toggle'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { FiDollarSign, FiUser, FiPlus, FiTrash2 } from 'react-icons/fi'
import { setScopedItem, getScopedItem, getSiteItem } from '@/lib/storage'

interface Feature {
  key: string
  label: string
  description: string
  price: number
}

export type DoctorSlot = { dayOfWeek: number; time: string }  // 0=Sun..6=Sat, time="09:00"

interface Doctor {
  name: string
  title: string
  specialization: string
  email: string
  experience: string
  certificates: File[]
  photo: File | null
  slots: DoctorSlot[]
  /** When loaded from storage (base64 data URLs) */
  photoData?: string | null
  certificatesData?: string[]
}

/** Serializable doctor shape for storage (photo/certs as base64 data URLs) */
interface StoredDoctor {
  name: string
  title: string
  specialization: string
  email: string
  experience: string
  certificatesData: string[]
  photoData: string | null
  slots: DoctorSlot[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function doctorToStored(doctor: Doctor): Promise<StoredDoctor> {
  const photoData = doctor.photoData ?? (doctor.photo ? await fileToDataUrl(doctor.photo) : null)
  const certificatesData = doctor.certificatesData ?? await Promise.all(
    (doctor.certificates || []).map((f) => fileToDataUrl(f))
  )
  return {
    name: doctor.name,
    title: doctor.title,
    specialization: doctor.specialization,
    email: doctor.email,
    experience: doctor.experience,
    certificatesData,
    photoData,
    slots: doctor.slots || [],
  }
}

interface Department {
  name: string
  doctors: Doctor[]
}

const FEATURES: Feature[] = [
  { key: 'reviewSystem', label: 'Review System', description: 'Allow patients to leave reviews and ratings', price: 19 },
  { key: 'aiChatbot', label: 'AI Chatbot', description: 'AI-powered chatbot for patient inquiries (monthly subscription)', price: 29 },
  { key: 'ambulanceOrdering', label: 'Order Ambulance', description: 'Enable patients to request ambulance services', price: 29 },
]

export default function HospitalSetupPage() {
  const router = useRouter()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('hospital')
  const [formData, setFormData] = useState({
    // Theme
    theme: 'classic' as 'classic' | 'modern' | 'minimal',
    // Features
    reviewSystem: false,
    aiChatbot: false,
    ambulanceOrdering: false,
    
    // Departments with doctors
    departments: [
      {
        name: '',
        doctors: [
          {
            name: '',
            title: '',
            specialization: '',
            email: '',
            experience: '',
            certificates: [],
            photo: null,
            slots: [],
          },
        ],
      } as Department,
    ],
  })

  // Check user type and redirect pharmacy users
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const businessType = user.businessType || user.business_type || 'hospital'
      setUserType(businessType)
      
      // Redirect pharmacy users to templates page
      if (businessType === 'pharmacy') {
        router.push('/dashboard/pharmacy/templates')
        return
      }
    }
  }, [router])

  // Load saved hospital setup when returning to this page (scoped or global)
  useEffect(() => {
    const raw = getScopedItem('selectedFeatures') ?? getSiteItem('selectedFeatures')
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as {
        theme?: 'classic' | 'modern' | 'minimal'
        reviewSystem?: boolean
        aiChatbot?: boolean
        ambulanceOrdering?: boolean
        departments?: { name: string; doctors: StoredDoctor[] }[]
      }
      if (!saved.departments?.length) return
      const departments = saved.departments.map((d) => ({
        name: d.name || '',
        doctors: d.doctors.map((doc) => ({
          name: doc.name || '',
          title: doc.title || '',
          specialization: doc.specialization || '',
          email: doc.email || '',
          experience: doc.experience || '',
          certificates: [] as File[],
          photo: null as File | null,
          slots: doc.slots || [],
          photoData: doc.photoData ?? null,
          certificatesData: doc.certificatesData ?? [],
        })),
      }))
      setFormData((prev) => ({
        ...prev,
        theme: saved.theme ?? prev.theme,
        reviewSystem: saved.reviewSystem ?? prev.reviewSystem,
        aiChatbot: saved.aiChatbot ?? prev.aiChatbot,
        ambulanceOrdering: saved.ambulanceOrdering ?? prev.ambulanceOrdering,
        departments,
      }))
    } catch {
      // Ignore parse errors
    }
  }, [])

  const handleDepartmentNameChange = (index: number, value: string) => {
    const newDepartments = [...formData.departments] as Department[]
    newDepartments[index] = { ...newDepartments[index], name: value }
    setFormData({ ...formData, departments: newDepartments })
  }

  const addDepartment = () => {
    const newDepartments = [...(formData.departments as Department[]), {
      name: '',
      doctors: [
        {
          name: '',
          title: '',
          specialization: '',
          email: '',
          experience: '',
          certificates: [],
          photo: null,
          slots: [],
        },
      ],
    }]

    setFormData({
      ...formData,
      departments: newDepartments,
    })
  }

  const removeDepartment = (index: number) => {
    const newDepartments = (formData.departments as Department[]).filter((_, i) => i !== index)
    setFormData({ ...formData, departments: newDepartments })
  }

  const handleDoctorChange = (
    deptIndex: number,
    doctorIndex: number,
    field: keyof Doctor,
    value: string | File[] | File | null
  ) => {
    const newDepartments = [...(formData.departments as Department[])]
    const doctors = [...newDepartments[deptIndex].doctors]
    doctors[doctorIndex] = { ...doctors[doctorIndex], [field]: value }
    newDepartments[deptIndex] = { ...newDepartments[deptIndex], doctors }
    setFormData({ ...formData, departments: newDepartments })
  }

  const handleCertificateUpload = (
    deptIndex: number,
    doctorIndex: number,
    files: FileList | null
  ) => {
    if (files) {
      const fileArray = Array.from(files)
      handleDoctorChange(deptIndex, doctorIndex, 'certificates', fileArray)
    }
  }

  const handlePhotoUpload = (
    deptIndex: number,
    doctorIndex: number,
    files: FileList | null
  ) => {
    if (files && files[0]) {
      handleDoctorChange(deptIndex, doctorIndex, 'photo', files[0])
    }
  }

  const addDoctor = (deptIndex: number) => {
    const newDepartments = [...(formData.departments as Department[])]
    newDepartments[deptIndex] = {
      ...newDepartments[deptIndex],
      doctors: [
        ...newDepartments[deptIndex].doctors,
        {
          name: '',
          title: '',
          specialization: '',
          email: '',
          experience: '',
          certificates: [],
          photo: null,
          slots: [],
        },
      ],
    }
    setFormData({ ...formData, departments: newDepartments })
  }

  const addSlot = (deptIndex: number, doctorIndex: number) => {
    const newDepartments = [...(formData.departments as Department[])]
    const doctors = [...newDepartments[deptIndex].doctors]
    const slots = [...(doctors[doctorIndex].slots || []), { dayOfWeek: 1, time: '09:00' }]
    doctors[doctorIndex] = { ...doctors[doctorIndex], slots }
    newDepartments[deptIndex] = { ...newDepartments[deptIndex], doctors }
    setFormData({ ...formData, departments: newDepartments })
  }

  const removeSlot = (deptIndex: number, doctorIndex: number, slotIndex: number) => {
    const newDepartments = [...(formData.departments as Department[])]
    const doctors = [...newDepartments[deptIndex].doctors]
    const slots = (doctors[doctorIndex].slots || []).filter((_, i) => i !== slotIndex)
    doctors[doctorIndex] = { ...doctors[doctorIndex], slots }
    newDepartments[deptIndex] = { ...newDepartments[deptIndex], doctors }
    setFormData({ ...formData, departments: newDepartments })
  }

  const updateSlot = (deptIndex: number, doctorIndex: number, slotIndex: number, field: 'dayOfWeek' | 'time', value: number | string) => {
    const newDepartments = [...(formData.departments as Department[])]
    const doctors = [...newDepartments[deptIndex].doctors]
    const slots = [...(doctors[doctorIndex].slots || [])]
    slots[slotIndex] = { ...slots[slotIndex], [field]: value }
    doctors[doctorIndex] = { ...doctors[doctorIndex], slots }
    newDepartments[deptIndex] = { ...newDepartments[deptIndex], doctors }
    setFormData({ ...formData, departments: newDepartments })
  }

  const removeDoctor = (deptIndex: number, doctorIndex: number) => {
    const newDepartments = [...(formData.departments as Department[])]
    newDepartments[deptIndex] = {
      ...newDepartments[deptIndex],
      doctors: newDepartments[deptIndex].doctors.filter((_, i) => i !== doctorIndex),
    }
    setFormData({ ...formData, departments: newDepartments })
  }

  // Calculate total price dynamically
  const totalPrice = useMemo(() => {
    let total = 0
    FEATURES.forEach(feature => {
      if (formData[feature.key as keyof typeof formData]) {
        total += feature.price
      }
    })
    return total
  }, [formData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Open payment modal
    setPaymentOpen(true)
  }

  const handlePaymentSuccess = async () => {
    try {
      // Convert File objects to base64 so they persist in localStorage
      const departmentsToStore = await Promise.all(
        (formData.departments as Department[]).map(async (dept) => ({
          name: dept.name,
          doctors: await Promise.all(dept.doctors.map((d) => doctorToStored(d))),
        }))
      )
      const toStore = {
        ...formData,
        departments: departmentsToStore,
      }
      setScopedItem('selectedFeatures', JSON.stringify(toStore))
      setScopedItem('totalPrice', totalPrice.toString())
      router.push('/dashboard/business-info?type=hospital')
    } catch (err) {
      console.error('Failed to save doctor photos/certificates', err)
      // Fallback: save without photo/certs
      const departmentsFallback = (formData.departments as Department[]).map((dept) => ({
        name: dept.name,
        doctors: dept.doctors.map((d) => ({
          name: d.name,
          title: d.title,
          specialization: d.specialization,
          email: d.email,
          experience: d.experience,
          certificatesData: [] as string[],
          photoData: null as string | null,
          slots: (d.slots || []) as DoctorSlot[],
        })),
      }))
      setScopedItem('selectedFeatures', JSON.stringify({ ...formData, departments: departmentsFallback }))
      setScopedItem('totalPrice', totalPrice.toString())
      router.push('/dashboard/business-info?type=hospital')
    }
  }

  // Don't render anything for pharmacy users (they'll be redirected)
  if (userType === 'pharmacy') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-gray">Redirecting to templates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">Hospital Website Setup</h1>
        <p className="text-neutral-gray">Configure your hospital website features and information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Theme selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Theme</h2>
            <p className="text-sm text-neutral-gray mb-4">
              Choose the look and feel of your hospital website. You can change this later.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'classic', label: 'Classic', description: 'Clean white layout with soft accents.' },
                { id: 'modern', label: 'Modern', description: 'Bold gradient hero and highlights.' },
                { id: 'minimal', label: 'Minimal', description: 'Simple layout with lots of whitespace.' },
              ].map((theme) => {
                const isActive = formData.theme === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: theme.id as typeof formData.theme })}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      isActive
                        ? 'border-primary bg-primary-light/30'
                        : 'border-neutral-border hover:bg-neutral-light'
                    }`}
                  >
                    <p className="font-medium text-neutral-dark mb-1">{theme.label}</p>
                    <p className="text-xs text-neutral-gray">{theme.description}</p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Features Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-dark">Features</h2>
              <div className="flex items-center gap-2 bg-primary-light px-4 py-2 rounded-lg">
                <FiDollarSign className="text-primary" size={20} />
                <span className="text-2xl font-bold text-primary">${totalPrice}</span>
              </div>
            </div>
            <div className="space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-4 border border-neutral-border rounded-lg">
                  <div className="flex-1">
                    <Toggle
                      label={feature.label}
                      checked={formData[feature.key as keyof typeof formData] as boolean}
                      onChange={(checked) => setFormData({ ...formData, [feature.key]: checked })}
                      description={feature.description}
                    />
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-semibold text-neutral-dark">${feature.price}</p>
                    <p className="text-xs text-neutral-gray">{feature.key === 'aiChatbot' ? '/month' : 'one-time'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Departments & Doctors */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-dark">Departments & Doctors</h2>
                <p className="text-sm text-neutral-gray">
                  Add each department and the doctors that belong to it. This will appear on your hospital website.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={addDepartment}>
                <FiPlus className="mr-2" />
                Add Department
              </Button>
            </div>
            <div className="space-y-6">
              {(formData.departments as Department[]).map((dept, deptIndex) => (
                <div key={deptIndex} className="border border-neutral-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Input
                      label="Department Name"
                      placeholder="e.g. Cardiology, Pediatrics, Radiology"
                      value={dept.name}
                      onChange={(e) => handleDepartmentNameChange(deptIndex, e.target.value)}
                      className="flex-1"
                    />
                    { (formData.departments as Department[]).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDepartment(deptIndex)}
                        className="p-2 text-error hover:bg-neutral-light rounded-lg transition-colors"
                        aria-label="Remove department"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-primary" />
                        <span className="font-medium text-neutral-dark">Doctors in this department</span>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => addDoctor(deptIndex)}>
                        <FiPlus className="mr-1" />
                        Add Doctor
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {dept.doctors.map((doctor, doctorIndex) => (
                        <div
                          key={doctorIndex}
                          className="border border-neutral-border rounded-lg p-3 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-neutral-dark mb-2">
                                Doctor Name {!doctor.name && <span className="text-error text-xs">*</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="Full name"
                                value={doctor.name}
                                onChange={(e) =>
                                  handleDoctorChange(deptIndex, doctorIndex, 'name', e.target.value)
                                }
                                required
                                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-dark mb-2">
                                Title {!doctor.title && <span className="text-error text-xs">*</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Consultant Cardiologist"
                                value={doctor.title}
                                onChange={(e) =>
                                  handleDoctorChange(deptIndex, doctorIndex, 'title', e.target.value)
                                }
                                required
                                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-neutral-dark mb-2">
                                Specialization {!doctor.specialization && <span className="text-error text-xs">*</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Cardiology"
                                value={doctor.specialization}
                                onChange={(e) =>
                                  handleDoctorChange(deptIndex, doctorIndex, 'specialization', e.target.value)
                                }
                                required
                                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-dark mb-2">
                                Experience {!doctor.experience && <span className="text-error text-xs">*</span>}
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 10 years"
                                value={doctor.experience}
                                onChange={(e) =>
                                  handleDoctorChange(deptIndex, doctorIndex, 'experience', e.target.value)
                                }
                                required
                                className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-dark mb-2">
                              Email {!doctor.email && <span className="text-error text-xs">*</span>}
                            </label>
                            <input
                              type="email"
                              placeholder="doctor@example.com"
                              value={doctor.email}
                              onChange={(e) =>
                                handleDoctorChange(deptIndex, doctorIndex, 'email', e.target.value)
                              }
                              required
                              className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor={`doctor-photo-${deptIndex}-${doctorIndex}`} className="block text-sm font-medium text-neutral-dark mb-2">
                                Doctor Photo {!doctor.photo && !doctor.photoData && <span className="text-error text-xs">*</span>}
                              </label>
                              <input
                                id={`doctor-photo-${deptIndex}-${doctorIndex}`}
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => handlePhotoUpload(deptIndex, doctorIndex, e.target.files)}
                                className="block w-full text-sm text-neutral-gray file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary hover:file:text-white transition-colors"
                                required={!doctor.photoData}
                                aria-label="Upload doctor photo"
                              />
                              <p className="text-xs text-neutral-gray mt-1">
                                Upload doctor's photo (JPG, PNG) - Required
                              </p>
                              {doctor.photo && (
                                <div className="mt-2">
                                  <div className="text-xs text-primary bg-primary-light px-2 py-1 rounded inline-block">
                                    📷 {doctor.photo.name}
                                  </div>
                                </div>
                              )}
                              {doctor.photoData && !doctor.photo && (
                                <div className="mt-2 flex items-center gap-2">
                                  <img src={doctor.photoData} alt="Doctor" className="w-12 h-12 object-cover rounded" />
                                  <span className="text-xs text-primary bg-primary-light px-2 py-1 rounded">Photo saved</span>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <label htmlFor={`doctor-certificates-${deptIndex}-${doctorIndex}`} className="block text-sm font-medium text-neutral-dark mb-2">
                                Doctor Certificates <span className="text-neutral-gray text-xs">(Optional)</span>
                              </label>
                              <input
                                id={`doctor-certificates-${deptIndex}-${doctorIndex}`}
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleCertificateUpload(deptIndex, doctorIndex, e.target.files)}
                                className="block w-full text-sm text-neutral-gray file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary hover:file:text-white transition-colors"
                                aria-label="Upload doctor certificates"
                              />
                              <p className="text-xs text-neutral-gray mt-1">
                                Upload certificates (PDF, JPG, PNG). Multiple files allowed.
                              </p>
                              {(doctor.certificates?.length > 0 || (doctor.certificatesData?.length ?? 0) > 0) && (
                                <div className="mt-2">
                                  <p className="text-xs text-neutral-gray mb-1">Uploaded files:</p>
                                  <div className="space-y-1">
                                    {doctor.certificates?.map((file, fileIndex) => (
                                      <div key={fileIndex} className="text-xs text-primary bg-primary-light px-2 py-1 rounded inline-block mr-2">
                                        📄 {file.name}
                                      </div>
                                    ))}
                                    {doctor.certificatesData?.map((_, i) => (
                                      <div key={`cert-${i}`} className="text-xs text-primary bg-primary-light px-2 py-1 rounded inline-block mr-2">
                                        📄 Certificate {i + 1}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-dark mb-2">
                              Available slots (when patients can book)
                            </label>
                            <p className="text-xs text-neutral-gray mb-2">
                              Add recurring weekly slots. Patients will pick from these when reserving.
                            </p>
                            <div className="space-y-2">
                              {(doctor.slots || []).map((slot, slotIdx) => (
                                <div key={slotIdx} className="flex items-center gap-2">
                                  <select
                                    value={slot.dayOfWeek}
                                    onChange={(e) => updateSlot(deptIndex, doctorIndex, slotIdx, 'dayOfWeek', Number(e.target.value))}
                                    className="flex-1 px-3 py-2 border border-neutral-border rounded-lg text-sm"
                                    aria-label="Day of week"
                                  >
                                    {DAYS.map((d, i) => (
                                      <option key={i} value={i}>{d}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="time"
                                    value={slot.time}
                                    onChange={(e) => updateSlot(deptIndex, doctorIndex, slotIdx, 'time', e.target.value)}
                                    className="w-28 px-3 py-2 border border-neutral-border rounded-lg text-sm"
                                    aria-label="Slot time"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeSlot(deptIndex, doctorIndex, slotIdx)}
                                    className="p-2 text-error hover:bg-neutral-light rounded"
                                    aria-label="Remove slot"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <Button type="button" variant="ghost" onClick={() => addSlot(deptIndex, doctorIndex)}>
                                <FiPlus className="mr-1" /> Add slot
                              </Button>
                            </div>
                          </div>

                          {dept.doctors.length > 1 && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeDoctor(deptIndex, doctorIndex)}
                                className="p-2 text-error hover:bg-neutral-light rounded-lg transition-colors"
                                aria-label="Remove doctor"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
              <FiDollarSign className="mr-2" />
              Continue to Payment (${totalPrice})
            </Button>
          </div>
        </div>
      </form>

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={totalPrice}
        description="Payment for selected hospital website features"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
