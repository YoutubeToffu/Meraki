'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  mapTo?: string
}

interface FormConfig {
  id: string
  name: string
  fields: FormField[]
  settings: {
    submitButtonText?: string
    successMessage?: string
    redirectUrl?: string
  }
  theme: {
    primaryColor?: string
    borderRadius?: string
  }
}

export default function PublicFormClient({ form, isEmbed }: { form: FormConfig; isEmbed: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const primaryColor = form.theme?.primaryColor ?? '#2563eb'
  const borderRadius = form.theme?.borderRadius ?? '8px'
  const submitText = form.settings?.submitButtonText ?? 'Submit'
  const successMessage = form.settings?.successMessage ?? "Thank you! We'll be in touch soon."

  const validate = () => {
    const newErrors: Record<string, string> = {}
    for (const field of form.fields) {
      if (field.required && !values[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`
      }
      if (field.type === 'email' && values[field.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.id])) {
        newErrors[field.id] = 'Please enter a valid email address'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form.id, data: values }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      setSubmitted(true)

      if (form.settings?.redirectUrl) {
        setTimeout(() => { window.location.href = form.settings.redirectUrl! }, 2000)
      }
    } catch (err: any) {
      setSubmitError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const containerClass = isEmbed ? 'p-0' : 'min-h-screen bg-gray-50 flex items-center justify-center p-4'

  return (
    <div className={containerClass}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{successMessage}</h2>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-6">{form.name}</h1>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-shadow min-h-[80px] ${errors[field.id] ? 'border-red-400' : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'}`}
                      style={{ borderRadius }}
                      placeholder={field.placeholder}
                      value={values[field.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className={`w-full rounded-lg border px-3 py-2 text-sm h-10 ${errors[field.id] ? 'border-red-400' : 'border-gray-300'}`}
                      style={{ borderRadius }}
                      value={values[field.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        checked={values[field.id] === 'true'}
                        onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.checked ? 'true' : 'false' }))}
                      />
                      <span className="text-sm text-gray-600">{field.placeholder || field.label}</span>
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      className={`w-full rounded-lg border px-3 py-2 text-sm h-10 outline-none transition-shadow ${errors[field.id] ? 'border-red-400' : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'}`}
                      style={{ borderRadius }}
                      placeholder={field.placeholder}
                      value={values[field.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                      required={field.required}
                    />
                  )}

                  {errors[field.id] && (
                    <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
                  )}
                </div>
              ))}

              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor, borderRadius }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitText}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
