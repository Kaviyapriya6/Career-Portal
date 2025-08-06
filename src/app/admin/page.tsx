'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface DashboardStats {
  users: {
    total: number
    active: number
    registrationTrend: any[]
  }
  jobs: {
    total: number
    active: number
    postingTrend: any[]
  }
  companies: {
    total: number
    top: Array<{
      id: string
      name: string
      logo: string
      jobCount: number
    }>
  }
  applications: {
    total: number
  }
  emails: {
    pending: number
    failed: number
  }
  recentActivity: Array<{
    id: string
    action: string
    entityType: string
    entityId: string
    metadata: any
    createdAt: string
    user: {
      id: string
      email: string
      name: string
    }
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin) {
      redirect('/')
    }
  }, [session, status])

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return '🔑'
      case 'register': return '👤'
      case 'favorite_company': return '⭐'
      case 'unfavorite_company': return '💔'
      case 'job_view': return '👁️'
      case 'job_apply': return '📝'
      case 'admin_user_update': return '⚙️'
      case 'admin_user_delete': return '🗑️'
      case 'admin_job_update': return '✏️'
      case 'admin_job_delete': return '❌'
      default: return '📋'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <i className="fas fa-chart-line mr-3 text-blue-600"></i>
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor and manage your job portal
              </p>
            </div>
            <div className="flex space-x-4">
              <a
                href="/admin/users"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-users mr-2"></i>
                Manage Users
              </a>
              <a
                href="/admin/jobs"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-briefcase mr-2"></i>
                Manage Jobs
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.users.active} active (30d)
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Jobs Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.jobs.total.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.jobs.active} active
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-briefcase text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Companies Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-3xl font-bold text-gray-900">{stats.companies.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Registered companies
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-building text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Applications Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.applications.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Total submitted
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Queue Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="fas fa-envelope mr-2 text-blue-600"></i>
              Email Queue
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="text-orange-600 font-semibold">{stats.emails.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed</span>
                <span className="text-red-600 font-semibold">{stats.emails.failed}</span>
              </div>
            </div>
            {stats.emails.failed > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {stats.emails.failed} failed emails need attention
                </p>
              </div>
            )}
          </div>

          {/* Top Companies */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="fas fa-trophy mr-2 text-yellow-600"></i>
              Top Companies
            </h3>
            <div className="space-y-3">
              {stats.companies.top.map((company, index) => (
                <div key={company.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.name}
                          className="h-6 w-6 rounded"
                        />
                      ) : (
                        <i className="fas fa-building text-gray-400"></i>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {company.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {company.jobCount} jobs
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="fas fa-clock mr-2 text-green-600"></i>
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="text-lg">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user.name || activity.user.email}</span>
                      {' '}
                      {activity.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
