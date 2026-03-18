'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FiShoppingCart } from 'react-icons/fi'
import { setScopedItem } from '@/lib/storage'
import { getPharmacyOrders, type Order, type OrderStatus } from '@/lib/orders'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'hospital' | 'pharmacy'>('pharmacy')

  const loadOrders = useCallback(() => {
    setOrders(getPharmacyOrders())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserType(user.businessType || user.business_type || 'hospital')
      } catch {
        setUserType('hospital')
      }
    }
  }, [])

  const isHospital = userType === 'hospital'

  const updateStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      try {
        setScopedItem('pharmacyOrders', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-neutral-gray">
          {isHospital ? 'Loading appointments…' : 'Loading orders…'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden px-0 sm:px-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-dark mb-1 sm:mb-2">
          {isHospital ? 'Appointments' : 'Orders'}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-gray">
          {isHospital
            ? 'Patient appointments from your hospital website. Manage them here.'
            : 'Customer orders from your pharmacy website. Handle them here.'}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <FiShoppingCart className="mx-auto mb-3 sm:mb-4 text-neutral-gray" size={40} />
          <p className="text-sm sm:text-base text-neutral-gray">
            {isHospital ? 'No appointments yet.' : 'No orders yet.'}
          </p>
          <p className="text-xs sm:text-sm text-neutral-gray mt-1">
            {isHospital
              ? 'Appointments scheduled through your website will appear here as cards.'
              : 'Orders placed on your website will appear here as cards.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {orders.map((order) => {
            const isPending = order.status === 'pending'
            const isCompleted = order.status === 'completed'
            const isCancelled = order.status === 'cancelled'
            const statusBg = isCompleted
              ? 'bg-green-100 text-green-800'
              : isCancelled
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'

            return (
              <Card
                key={order.id}
                className="p-4 sm:p-5 border border-neutral-border hover:shadow-md transition-shadow flex flex-col min-w-0"
              >
                <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3 min-w-0">
                  <span className="font-semibold text-neutral-dark text-sm sm:text-base truncate">
                    {order.id}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 sm:py-1 rounded flex-shrink-0 ${statusBg}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm font-medium text-neutral-dark truncate">{order.customerName}</p>
                {order.customerEmail && (
                  <p className="text-xs text-neutral-gray truncate">{order.customerEmail}</p>
                )}
                <p className="text-base sm:text-lg font-bold text-primary mt-1 sm:mt-2">
                  ${order.total.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-gray mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                {order.items && order.items.length > 0 && (
                  <ul className="text-xs text-neutral-dark mt-2 sm:mt-3 list-disc list-inside space-y-0.5 line-clamp-3">
                    {order.items.slice(0, 5).map((item, i) => (
                      <li key={i} className="truncate">
                        {item}
                      </li>
                    ))}
                    {order.items.length > 5 && (
                      <li className="text-neutral-gray">+{order.items.length - 5} more</li>
                    )}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 border-t border-neutral-border">
                  {isPending && (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        className="text-xs sm:text-sm py-2 px-3 min-h-[36px] sm:min-h-[40px]"
                        onClick={() => updateStatus(order.id, 'completed')}
                      >
                        Mark completed
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs sm:text-sm py-2 px-3 min-h-[36px] sm:min-h-[40px]"
                        onClick={() => updateStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
