'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface FavoriteCompany {
  id: string
  createdAt: string
  company: {
    id: string
    name: string
    logo: string | null
    website: string | null
    location: string | null
    description: string | null
    _count: {
      jobs: number
    }
  }
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<FavoriteCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      redirect('/auth/signin')
    }
  }, [session, status])

  useEffect(() => {
    if (session?.user) {
      fetchFavorites()
    }
  }, [session])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/favorites')
      
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (companyId: string) => {
    try {
      setRemoving(companyId)
      
      const response = await fetch(`/api/user/favorites?companyId=${companyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.company.id !== companyId))
      } else {
        alert('Failed to remove favorite. Please try again.')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <i className="fas fa-heart mr-3 text-red-500"></i>
                Favorite Companies
              </h1>
              <p className="mt-2 text-gray-600">
                Companies you're following for job updates
              </p>
            </div>
            <Link
              href="/companies"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-search mr-2"></i>
              Browse Companies
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <i className="fas fa-heart text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No favorite companies yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start following companies you're interested in to get notified about new job openings
            </p>
            <Link
              href="/companies"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-search mr-2"></i>
              Discover Companies
            </Link>
          </div>
        ) : (
          /* Favorites List */
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Company Logo */}
                      <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {favorite.company.logo ? (
                          <img
                            src={favorite.company.logo}
                            alt={favorite.company.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <i className="fas fa-building text-2xl text-gray-400"></i>
                        )}
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {favorite.company.name}
                        </h3>
                        
                        {favorite.company.location && (
                          <p className="text-sm text-gray-600 mb-2">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {favorite.company.location}
                          </p>
                        )}

                        {favorite.company.description && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {favorite.company.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            <i className="fas fa-briefcase mr-1"></i>
                            {favorite.company._count.jobs} open positions
                          </span>
                          <span>
                            <i className="fas fa-calendar mr-1"></i>
                            Following since {formatDate(favorite.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {favorite.company.website && (
                        <a
                          href={favorite.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visit website"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                      )}

                      <Link
                        href={`/companies/${favorite.company.id}`}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View company profile"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>

                      <button
                        onClick={() => removeFavorite(favorite.company.id)}
                        disabled={removing === favorite.company.id}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from favorites"
                      >
                        {removing === favorite.company.id ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-heart-broken"></i>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {favorite.company._count.jobs > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link
                        href={`/jobs?company=${favorite.company.id}`}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <i className="fas fa-arrow-right mr-2"></i>
                        View all {favorite.company._count.jobs} job openings
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email Notification Info */}
        {favorites.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              <i className="fas fa-envelope mr-2"></i>
              Stay Updated
            </h3>
            <p className="text-blue-800 mb-4">
              You'll receive email notifications when these companies post new job openings.
            </p>
            <Link
              href="/account/preferences"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <i className="fas fa-cog mr-2"></i>
              Manage email preferences
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
