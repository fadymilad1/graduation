'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  FiHome,
  FiGlobe,
  FiLayout,
  FiInfo,
  FiMessageSquare,
  FiSettings,
  FiLogOut,
  FiX,
  FiShoppingCart,
} from 'react-icons/fi'

interface SidebarItem {
  label: string
  icon: React.ReactNode
  href: string
}

interface SidebarProps {
  userType?: 'hospital' | 'pharmacy'
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ userType, isOpen = true, onClose }) => {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUserType, setCurrentUserType] = useState<'hospital' | 'pharmacy'>('hospital')

  useEffect(() => {
    // Get user type from localStorage (same method as dashboard)
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUserType(user.businessType || user.business_type || 'hospital')
      } catch (e) {
        // Fallback to hospital if parsing fails
        setCurrentUserType('hospital')
      }
    } else if (userType) {
      // Use prop if provided
      setCurrentUserType(userType)
    }
  }, [userType])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('website_setup_id')
    router.push('/login')
  }

  const menuItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <FiHome />, href: '/dashboard' },
    { 
      label: 'My Website', 
      icon: <FiGlobe />, 
      href: currentUserType === 'pharmacy' ? '/dashboard/pharmacy/setup' : '/dashboard/hospital/setup' 
    },
    ...(currentUserType === 'pharmacy'
      ? [{ label: 'Templates', icon: <FiLayout />, href: '/dashboard/pharmacy/templates' }]
      : []),
    { label: 'Business Info', icon: <FiInfo />, href: '/dashboard/business-info' },
    {
      label: currentUserType === 'pharmacy' ? 'Orders' : 'Appointments',
      icon: <FiShoppingCart />,
      href: '/dashboard/orders',
    },
    { label: 'AI Assistant', icon: <FiMessageSquare />, href: '/dashboard/ai-assistant' },
    { label: 'Settings', icon: <FiSettings />, href: '/dashboard/settings' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`w-64 bg-white border-r border-neutral-border h-screen fixed left-0 top-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="p-4 sm:p-6 border-b border-neutral-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3" onClick={onClose}>
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <Image
                src="/mod logo.png"
                alt="Medify logo"
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-primary">Medify</span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-2 text-neutral-gray hover:text-neutral-dark"
            aria-label="Close sidebar menu"
          >
            <FiX size={24} />
          </button>
        </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive(item.href)
                ? 'bg-primary-light text-primary font-medium'
                : 'text-neutral-gray hover:bg-neutral-light'
            }`}
          >
            {item.icon}
            <span className="text-sm sm:text-base">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-neutral-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-error hover:bg-neutral-light w-full transition-colors text-sm sm:text-base"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
    </>
  )
}

