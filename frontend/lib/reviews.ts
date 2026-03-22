/**
 * Doctor reviews - stored in user-scoped localStorage.
 * Used when Review System feature is enabled. Backend can replace this later.
 */

import { getScopedItem, setScopedItem, getItemForUser, setItemForUser } from './storage'

export type DoctorReview = {
  id: string
  doctorName: string
  department: string
  reviewerName: string
  rating: number
  comment: string
  createdAt: string
}

const REVIEWS_KEY = 'doctorReviews'

function doctorKey(doctorName: string, department: string): string {
  return `${doctorName}|${department}`
}

function getStorage(userId?: string | null) {
  const get = (key: string) =>
    userId ? getItemForUser(userId, key) : getScopedItem(key)
  const set = (key: string, value: string) =>
    userId ? setItemForUser(userId, key, value) : setScopedItem(key, value)
  return { get, set }
}

function getAllReviews(userId?: string | null): DoctorReview[] {
  const { get } = getStorage(userId)
  try {
    const raw = get(REVIEWS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function getDoctorReviews(
  doctorName: string,
  department: string,
  siteOwnerId?: string | null
): DoctorReview[] {
  const all = getAllReviews(siteOwnerId)
  const key = doctorKey(doctorName, department)
  return all
    .filter((r) => doctorKey(r.doctorName, r.department) === key)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function addDoctorReview(
  data: {
    doctorName: string
    department: string
    reviewerName: string
    rating: number
    comment: string
  },
  siteOwnerId?: string | null
): DoctorReview {
  const storage = getStorage(siteOwnerId)
  const all = getAllReviews(siteOwnerId)
  const id = `REV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const review: DoctorReview = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  }
  all.push(review)
  storage.set(REVIEWS_KEY, JSON.stringify(all))
  return review
}

export function getDoctorRatingStats(
  doctorName: string,
  department: string,
  siteOwnerId?: string | null
): { average: number; count: number } {
  const reviews = getDoctorReviews(doctorName, department, siteOwnerId)
  if (reviews.length === 0) return { average: 0, count: 0 }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}
