'use client'

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MapPin,
  Building2,
  Users,
  ExternalLink,
  Star,
  Briefcase,
  Clock,
  DollarSign,
  Filter,
  ChevronRight,
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react"
import { formatDateRelative, formatSalary } from "@/lib/utils"

interface Job {
  id: number
  title: string
  company: {
    id: number
    name: string
    slug: string
    logo: string
  }
  location: string
  category: string
  employmentType: string
  salary?: string
  salaryRange?: {
    min: number
    max: number
    currency: string
  }
  postedDate: string
  expiryDate?: string
  description: string
  requirements?: string
  benefits?: string
  featured: boolean
  urgent: boolean
  remote: boolean
  originalUrl: string
}

interface Company {
  id: number
  name: string
  slug: string
  logo: string
  website?: string
  careerPage?: string
  description?: string
  sector?: string
  country?: string
  headquarters?: string
  employeeCount?: string
  foundedYear?: number
  featured: boolean
  trending: boolean
  jobCount: number
  techStack?: string[]
  benefits?: string[]
  culture?: string
  locations?: string[]
}

interface SearchResponse {
  jobs: Job[]
  companies: Company[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    search: string
    type: 'all' | 'jobs' | 'companies'
  }
  aggregations: {
    categories: { name: string; count: number }[]
    locations: { name: string; count: number }[]
    employmentTypes: { name: string; count: number }[]
    sectors: { name: string; count: number }[]
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [searchType, setSearchType] = useState<'all' | 'jobs' | 'companies'>(
    (searchParams.get('type') as 'all' | 'jobs' | 'companies') || 'all'
  )
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '')
  const [selectedEmploymentType, setSelectedEmploymentType] = useState(searchParams.get('employmentType') || '')
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get('remote') === 'true')
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === 'true')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('limit') || '20'))

  // Perform search
  const performSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        search: searchQuery,
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })
      
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLocation) params.append('location', selectedLocation)
      if (selectedEmploymentType) params.append('employmentType', selectedEmploymentType)
      if (remoteOnly) params.append('remote', 'true')
      if (featuredOnly) params.append('featured', 'true')
      
      // Search both jobs and companies
      const [jobsResponse, companiesResponse] = await Promise.all([
        searchType === 'companies' ? Promise.resolve({ json: () => ({ jobs: [], pagination: { total: 0 }, aggregations: {} }) }) : 
        fetch(`/api/jobs?${params.toString()}`),
        searchType === 'jobs' ? Promise.resolve({ json: () => ({ companies: [], pagination: { total: 0 }, aggregations: {} }) }) :
        fetch(`/api/companies?${params.toString()}`)
      ])
      
      const [jobsData, companiesData] = await Promise.all([
        jobsResponse.json(),
        companiesResponse.json()
      ])
      
      // Combine results
      const combinedResults: SearchResponse = {
        jobs: jobsData.jobs || [],
        companies: companiesData.companies || [],
        pagination: {
          page: currentPage,
          limit: pageSize,
          total: (jobsData.pagination?.total || 0) + (companiesData.pagination?.total || 0),
          totalPages: Math.max(jobsData.pagination?.totalPages || 0, companiesData.pagination?.totalPages || 0)
        },
        filters: {
          search: searchQuery,
          type: searchType
        },
        aggregations: {
          categories: jobsData.aggregations?.categories || [],
          locations: [...(jobsData.aggregations?.locations || []), ...(companiesData.aggregations?.countries || [])],
          employmentTypes: jobsData.aggregations?.employmentTypes || [],
          sectors: companiesData.aggregations?.sectors || []
        }
      }
      
      setSearchResults(combinedResults)
      
      // Update URL
      const newParams = new URLSearchParams()
      newParams.set('q', searchQuery)
      newParams.set('type', searchType)
      if (selectedCategory) newParams.set('category', selectedCategory)
      if (selectedLocation) newParams.set('location', selectedLocation)
      if (selectedEmploymentType) newParams.set('employmentType', selectedEmploymentType)
      if (remoteOnly) newParams.set('remote', 'true')
      if (featuredOnly) newParams.set('featured', 'true')
      if (currentPage > 1) newParams.set('page', currentPage.toString())
      
      router.push(`/search?${newParams.toString()}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    performSearch()
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedLocation('')
    setSelectedEmploymentType('')
    setRemoteOnly(false)
    setFeaturedOnly(false)
    setCurrentPage(1)
  }

  // Perform search on mount if there's a query
  useEffect(() => {
    if (searchQuery) {
      performSearch()
    }
  }, [])

  // Handle filter changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1)
      performSearch()
    }
  }, [searchType, selectedCategory, selectedLocation, selectedEmploymentType, remoteOnly, featuredOnly])

  const jobResults = searchResults?.jobs || []
  const companyResults = searchResults?.companies || []
  const totalResults = searchResults?.pagination.total || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Search Jobs & Companies
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find your next opportunity from thousands of real job openings and companies
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search for jobs, companies, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>
            </form>

            {/* Search Type Tabs */}
            <div className="flex space-x-1 mt-4 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setSearchType('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Results
              </button>
              <button
                onClick={() => setSearchType('jobs')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'jobs'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jobs Only
              </button>
              <button
                onClick={() => setSearchType('companies')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'companies'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Companies Only
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={featuredOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setFeaturedOnly(!featuredOnly)}
              >
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Button>
              <Button
                variant={remoteOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setRemoteOnly(!remoteOnly)}
              >
                Remote Only
              </Button>
              {(selectedCategory || selectedLocation || selectedEmploymentType || remoteOnly || featuredOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {(searchType === 'all' || searchType === 'jobs') && searchResults && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Job Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Categories</option>
                    {searchResults.aggregations.categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Locations</option>
                    {searchResults.aggregations.locations.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Employment Type</label>
                  <select
                    value={selectedEmploymentType}
                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Types</option>
                    {searchResults.aggregations.employmentTypes.map((type) => (
                      <option key={type.name} value={type.name}>
                        {type.name} ({type.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={performSearch} variant="outline">
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        ) : searchQuery && searchResults ? (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {totalResults} Results for "{searchQuery}"
              </h2>
              <p className="text-gray-600">
                {jobResults.length} jobs and {companyResults.length} companies found
              </p>
            </div>

            {/* Results Content */}
            <div className="space-y-8">
              {/* Job Results */}
              {(searchType === 'all' || searchType === 'jobs') && jobResults.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Job Opportunities ({jobResults.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {jobResults.map((job) => (
                      <Card key={job.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={job.company.logo || '/api/placeholder/48/48'}
                                alt={job.company.name}
                                className="h-12 w-12 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/48/48'
                                }}
                              />
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900 leading-tight">
                                  {job.title}
                                </h4>
                                <Link
                                  href={`/companies/${job.company.slug}`}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {job.company.name}
                                </Link>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {job.featured && (
                                <Badge variant="default" className="bg-yellow-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {job.urgent && (
                                <Badge variant="destructive">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <div className="flex items-center text-gray-600 text-sm">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location}
                                {job.remote && (
                                  <Badge variant="secondary" className="ml-2">
                                    Remote
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center text-gray-600 text-sm">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {job.employmentType}
                              </div>
                              <div className="flex items-center text-gray-600 text-sm">
                                <Building2 className="h-4 w-4 mr-1" />
                                {job.category}
                              </div>
                            </div>

                            {job.salary && (
                              <div className="flex items-center text-green-600 font-medium">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {job.salary}
                              </div>
                            )}

                            <p className="text-gray-600 text-sm line-clamp-2">
                              {job.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-gray-500 text-sm">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDateRelative(new Date(job.postedDate))}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={job.originalUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Apply
                                  </Link>
                                </Button>
                                <Button asChild size="sm">
                                  <Link href={`/jobs/${job.id}`}>
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                    Details
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Results */}
              {(searchType === 'all' || searchType === 'companies') && companyResults.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Companies ({companyResults.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companyResults.map((company) => (
                      <Card key={company.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={company.logo || '/api/placeholder/48/48'}
                                alt={company.name}
                                className="h-12 w-12 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/48/48'
                                }}
                              />
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {company.name}
                                </h4>
                                {company.sector && (
                                  <p className="text-sm text-gray-600">{company.sector}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {company.featured && (
                                <Badge variant="default" className="bg-yellow-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {company.trending && (
                                <Badge variant="secondary">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {company.description && (
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {company.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                              {company.headquarters && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {company.headquarters}
                                </div>
                              )}
                              {company.employeeCount && (
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {company.employeeCount}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-blue-600 font-medium text-sm">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {company.jobCount} open positions
                              </div>
                              <div className="flex items-center space-x-2">
                                {company.website && (
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={company.website} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Website
                                    </Link>
                                  </Button>
                                )}
                                <Button asChild size="sm">
                                  <Link href={`/companies/${company.slug}`}>
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                    View Jobs
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {totalResults === 0 && (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600">
              Enter keywords to find jobs and companies
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
