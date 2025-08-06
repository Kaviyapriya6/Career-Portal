'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface EmailPreferences {
  newJobsFromFavorites: boolean
  companyUpdates: boolean
  weeklyJobSummary: boolean
  jobApplicationStatus: boolean
  marketInsights: boolean
}

export default function EmailPreferencesPage() {
  const { data: session, status } = useSession()
  const [preferences, setPreferences] = useState<EmailPreferences>({
    newJobsFromFavorites: true,
    companyUpdates: true,
    weeklyJobSummary: true,
    jobApplicationStatus: true,
    marketInsights: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      redirect('/auth/signin')
    }
  }, [session, status])

  useEffect(() => {
    if (session?.user) {
      fetchPreferences()
    }
  }, [session])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/email-preferences')
      
      if (response.ok) {
        const data = await response.json()
        if (data.preferences) {
          setPreferences(data.preferences)
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setMessage('')
      
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        setMessage('Email preferences updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to update preferences. Please try again.')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <i className="fas fa-envelope-open-text mr-3 text-blue-600"></i>
                Email Preferences
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your email notifications and updates
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6">
            {/* Success/Error Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('success') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <i className={`mr-2 ${
                    message.includes('success') ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
                  }`}></i>
                  {message}
                </div>
              </div>
            )}

            {/* Email Preferences Form */}
            <div className="space-y-6">
              {/* Job Alerts */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <i className="fas fa-briefcase mr-2 text-blue-600"></i>
                  Job Alerts
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">
                        New jobs from favorite companies
                      </label>
                      <p className="text-sm text-gray-600">
                        Get notified when companies you follow post new job openings
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.newJobsFromFavorites}
                        onChange={(e) => updatePreference('newJobsFromFavorites', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">
                        Weekly job summary
                      </label>
                      <p className="text-sm text-gray-600">
                        Receive a weekly digest of new job opportunities
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.weeklyJobSummary}
                        onChange={(e) => updatePreference('weeklyJobSummary', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Company Updates */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <i className="fas fa-building mr-2 text-green-600"></i>
                  Company Updates
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">
                      Company news and updates
                    </label>
                    <p className="text-sm text-gray-600">
                      Get updates about your favorite companies, including news and culture changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.companyUpdates}
                      onChange={(e) => updatePreference('companyUpdates', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Application Updates */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <i className="fas fa-file-alt mr-2 text-purple-600"></i>
                  Application Status
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">
                      Job application status updates
                    </label>
                    <p className="text-sm text-gray-600">
                      Receive updates when the status of your job applications changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.jobApplicationStatus}
                      onChange={(e) => updatePreference('jobApplicationStatus', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* Market Insights */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <i className="fas fa-chart-line mr-2 text-orange-600"></i>
                  Market Insights
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900">
                      Industry trends and insights
                    </label>
                    <p className="text-sm text-gray-600">
                      Receive weekly reports on job market trends, salary insights, and industry news
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketInsights}
                      onChange={(e) => updatePreference('marketInsights', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            <i className="fas fa-info-circle mr-2"></i>
            Email Delivery Information
          </h3>
          <div className="text-blue-800 space-y-2">
            <p className="flex items-start">
              <i className="fas fa-clock mr-2 mt-1 text-blue-600"></i>
              <span>Job alerts are sent immediately when new positions match your preferences</span>
            </p>
            <p className="flex items-start">
              <i className="fas fa-calendar-week mr-2 mt-1 text-blue-600"></i>
              <span>Weekly summaries are sent every Monday morning at 9:00 AM</span>
            </p>
            <p className="flex items-start">
              <i className="fas fa-shield-alt mr-2 mt-1 text-blue-600"></i>
              <span>You can unsubscribe from any email type at any time by updating these preferences</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
