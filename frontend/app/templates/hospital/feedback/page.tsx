'use client'

/**
 * Post-appointment feedback page.
 * Patients reach this page via a link in the email sent after their appointment.
 * URL params: token (backend validates), doctorName, department
 * Backend will: validate token, save review, associate with doctor.
 */

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiStar, FiCheck } from 'react-icons/fi'

function FeedbackFormContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const doctorName = searchParams?.get('doctorName') ?? ''
  const department = searchParams?.get('department') ?? ''

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // Backend: POST to your feedback API. Example:
      // const res = await fetch('/api/hospital/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, doctorName, department, rating, comment }),
      // })
      // if (!res.ok) throw new Error('Failed')
      await new Promise((r) => setTimeout(r, 800)) // Remove: simulate delay
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-green-600" size={32} />
          </div>
          <h1 className="text-xl font-semibold text-neutral-dark mb-2">Thank you!</h1>
          <p className="text-neutral-gray mb-6">
            Your feedback has been submitted. It will appear on our website shortly.
          </p>
          <Link
            href="/templates/hospital"
            className="inline-block px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark"
          >
            Return to hospital website
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-xl font-semibold text-neutral-dark mb-2">Share your feedback</h1>
        <p className="text-sm text-neutral-gray mb-6">
          How was your visit with{doctorName ? ` Dr. ${decodeURIComponent(doctorName)}` : ' your doctor'}?
          Your review will be shown on our website.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
                  aria-label={`Rate ${n} stars`}
                >
                  <FiStar
                    size={28}
                    className={n <= rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-comment" className="block text-sm font-medium text-neutral-dark mb-2">
              Your feedback (optional)
            </label>
            <textarea
              id="feedback-comment"
              placeholder="Tell us about your experience..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-border text-neutral-dark placeholder:text-neutral-gray focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit feedback'}
          </button>
        </form>

        <p className="text-xs text-neutral-gray mt-6 text-center">
          This form is for patients who had an appointment. Your feedback will be linked to your visit.
        </p>
      </div>
    </div>
  )
}

export default function HospitalFeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <p className="text-neutral-gray">Loading...</p>
      </div>
    }>
      <FeedbackFormContent />
    </Suspense>
  )
}
