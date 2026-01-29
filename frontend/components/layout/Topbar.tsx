'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FiBell, FiSearch, FiMenu } from 'react-icons/fi'

interface TopbarProps {
  onMenuClick?: () => void
}

type NotificationItem = {
  id: string
  message: string
  timestamp: string
  read: boolean
}

type SearchItem = {
  label: string
  description: string
  keywords: string[]
  userTypes?: Array<'hospital' | 'pharmacy'>
  href?: string
  getHref?: (userType: 'hospital' | 'pharmacy') => string
}

const fallbackNotifications: NotificationItem[] = [
  {
    id: '1',
    message: 'New order received for 12 prescription items.',
    timestamp: '5m ago',
    read: false,
  },
  {
    id: '2',
    message: 'Template customization saved successfully.',
    timestamp: '1h ago',
    read: false,
  },
  {
    id: '3',
    message: 'Your subscription renews in 3 days.',
    timestamp: 'Yesterday',
    read: true,
  },
]

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const router = useRouter()
  const [userName, setUserName] = useState('User')
  const [currentUserType, setCurrentUserType] = useState<'hospital' | 'pharmacy'>('hospital')
  const [notifications, setNotifications] = useState<NotificationItem[]>(fallbackNotifications)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const searchItems: SearchItem[] = [
    {
      label: 'Dashboard',
      description: 'Overview of your workspace',
      href: '/dashboard',
      keywords: ['home', 'overview', 'progress', 'setup progress', 'stats'],
    },
    {
      label: 'My Website',
      description: 'Products & Information hub',
      keywords: ['my website', 'products', 'information', 'products & information', 'catalog', 'content'],
      getHref: (userType) =>
        userType === 'pharmacy' ? '/dashboard/pharmacy/setup' : '/dashboard/hospital/setup',
    },
    {
      label: 'Business Info',
      description: 'Update business details',
      href: '/dashboard/business-info',
      keywords: ['info', 'details', 'profile', 'contact'],
    },
    {
      label: 'Hospital Setup',
      description: 'Configure hospital website',
      href: '/dashboard/hospital/setup',
      keywords: ['hospital', 'setup', 'departments', 'services'],
      userTypes: ['hospital'],
    },
    {
      label: 'Pharmacy Setup',
      description: 'Add pharmacy products',
      href: '/dashboard/pharmacy/setup',
      keywords: ['pharmacy', 'setup', 'products', 'inventory'],
      userTypes: ['pharmacy'],
    },
    {
      label: 'Templates',
      description: 'Choose pharmacy templates',
      href: '/dashboard/pharmacy/templates',
      keywords: ['templates', 'design', 'themes'],
      userTypes: ['pharmacy'],
    },
    { label: 'AI Assistant', description: 'Get AI help', href: '/dashboard/ai-assistant', keywords: ['assistant', 'chatbot'] },
    {
      label: 'Settings',
      description: 'Manage preferences',
      href: '/dashboard/settings',
      keywords: ['settings', 'preferences', 'account'],
    },
  ]

  useEffect(() => {
    // Get user name from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserName(user.name || 'User')
        setCurrentUserType(user.businessType || user.business_type || 'hospital')
      } catch (e) {
        // Handle error
      }
    }
  }, [])

  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications')
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications)
        if (Array.isArray(parsed) && parsed.length) {
          setNotifications(parsed)
        }
      } catch {
        // ignore parse errors, fallback data already set
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node
      const clickedInsideTrigger = dropdownRef.current?.contains(targetNode)
      const clickedInsideMenu = dropdownMenuRef.current?.contains(targetNode)
      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleSearchClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node
      const insideInput = searchRef.current?.contains(targetNode)
      const insideDropdown = searchDropdownRef.current?.contains(targetNode)
      if (!insideInput && !insideDropdown) {
        setIsSearchOpen(false)
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleSearchClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleSearchClickOutside)
    }
  }, [isSearchOpen])

  const unreadCount = notifications.filter((notification) => !notification.read).length


  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      setIsSearchOpen(false)
      return
    }

    const normalized = value.toLowerCase()
    const filtered = searchItems.filter((item) => {
      const matchesUserType = !item.userTypes || item.userTypes.includes(currentUserType)
      if (!matchesUserType) return false

      const labelMatch = item.label.toLowerCase().includes(normalized)
      const descriptionMatch = item.description.toLowerCase().includes(normalized)
      const keywordMatch = item.keywords.some((keyword) => keyword.toLowerCase().includes(normalized))

      return labelMatch || descriptionMatch || keywordMatch
    })

    setSearchResults(filtered)
    setIsSearchOpen(true)
  }

  const resolveHref = (item: SearchItem) => (item.getHref ? item.getHref(currentUserType) : item.href)

  const handleSearchSelect = (item: SearchItem) => {
    const href = resolveHref(item)
    if (!href) return
    router.push(href)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim() || searchResults.length === 0) return
    handleSearchSelect(searchResults[0])
  }

  return (
    <div className="h-16 bg-white border-b border-neutral-border flex items-center justify-between px-4 sm:px-6 overflow-x-hidden w-full max-w-full">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 text-neutral-gray hover:text-neutral-dark transition-colors mr-2"
        aria-label="Open sidebar menu"
        title="Open menu"
      >
        <FiMenu size={24} />
      </button>
      <div className="flex-1 max-w-md hidden sm:block relative" ref={searchRef}>
        <form className="relative" onSubmit={handleSearchSubmit}>
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-gray" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search pages, actions..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {isSearchOpen && (
            <div
              ref={searchDropdownRef}
              className="absolute left-0 right-0 mt-2 bg-white border border-neutral-border rounded-lg shadow-lg z-40"
            >
              {searchResults.length === 0 ? (
                <p className="text-sm text-neutral-gray px-4 py-3">No matches found.</p>
              ) : (
                searchResults.map((result) => {
                  const key = `${resolveHref(result) || result.label}-${result.label}`
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleSearchSelect(result)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-light transition-colors"
                    >
                      <p className="text-sm text-neutral-dark font-medium">{result.label}</p>
                      <p className="text-xs text-neutral-gray">{result.description}</p>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </form>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="relative p-2 text-neutral-gray hover:text-neutral-dark transition-colors"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            )}
          </button>
          {isDropdownOpen && (
            <div
              ref={dropdownMenuRef}
              className="fixed top-16 right-4 w-72 bg-white border border-neutral-border rounded-lg shadow-lg z-50"
            >
              <div className="flex items-center justify-between p-3 border-b border-neutral-border">
                <div>
                  <p className="text-sm font-semibold text-neutral-dark">Notifications</p>
                  <p className="text-xs text-neutral-gray">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>
              <div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-center text-neutral-gray py-6">No notifications yet.</p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-neutral-border last:border-b-0 transition-colors ${
                        notification.read ? 'bg-white' : 'bg-neutral-light/60'
                      }`}
                    >
                      <p className="text-neutral-dark">{notification.message}</p>
                      <span className="text-xs text-neutral-gray">{notification.timestamp}</span>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="w-full text-xs text-error py-2 border-t border-neutral-border hover:bg-neutral-light transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-neutral-dark font-medium text-sm sm:text-base hidden sm:inline">{userName}</span>
        </div>
      </div>
    </div>
  )
}

