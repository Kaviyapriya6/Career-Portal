'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Briefcase,
  DollarSign,
  Users,
  Star,
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

interface JobsResponse {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    search: string
    category: string
    location: string
    employmentType: string
    salaryMin: number
    salaryMax: number
    remote: boolean
    featured: boolean
  }
  aggregations: {
    categories: { name: string; count: number }[]
    locations: { name: string; count: number }[]
    employmentTypes: { name: string; count: number }[]
    companies: { name: string; count: number }[]
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("")
  const [salaryMin, setSalaryMin] = useState<number | undefined>()
  const [salaryMax, setSalaryMax] = useState<number | undefined>()
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })
      
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLocation) params.append('location', selectedLocation)
      if (selectedEmploymentType) params.append('employmentType', selectedEmploymentType)
      if (salaryMin) params.append('salaryMin', salaryMin.toString())
      if (salaryMax) params.append('salaryMax', salaryMax.toString())
      if (remoteOnly) params.append('remote', 'true')
      if (featuredOnly) params.append('featured', 'true')
      
      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      const data: JobsResponse = await response.json()
      setJobsData(data)
      setJobs(data.jobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch jobs on component mount and filter changes
  useEffect(() => {
    fetchJobs()
  }, [
    currentPage, 
    pageSize, 
    searchQuery, 
    selectedCategory, 
    selectedLocation, 
    selectedEmploymentType,
    salaryMin,
    salaryMax,
    remoteOnly,
    featuredOnly
  ])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page
    fetchJobs()
  }

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1) // Reset to first page
    fetchJobs()
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setLocationQuery("")
    setSelectedCategory("")
    setSelectedLocation("")
    setSelectedEmploymentType("")
    setSalaryMin(undefined)
    setSalaryMax(undefined)
    setRemoteOnly(false)
    setFeaturedOnly(false)
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Jobs</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchJobs} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover opportunities from {jobsData?.pagination.total || 'thousands of'} real job openings at leading companies worldwide
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Location (e.g., San Francisco, Remote)"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8">
                  <Search className="h-4 w-4 mr-2" />
                  Search Jobs
                </Button>
              </div>
            </form>

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3 w-3 mr-1" />
                More Filters
              </Button>
              {(searchQuery || selectedCategory || selectedLocation || selectedEmploymentType || salaryMin || salaryMax || remoteOnly || featuredOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All Categories</option>
                    {jobsData?.aggregations.categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
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
                    {jobsData?.aggregations.employmentTypes.map((type) => (
                      <option key={type.name} value={type.name}>
                        {type.name} ({type.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Min Salary</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={salaryMin || ''}
                    onChange={(e) => setSalaryMin(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Max Salary</label>
                  <Input
                    type="number"
                    placeholder="200000"
                    value={salaryMax || ''}
                    onChange={(e) => setSalaryMax(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {loading ? 'Loading...' : `${jobsData?.pagination.total || 0} Jobs Found`}
            </h2>
            {jobsData && (
              <p className="text-gray-600">
                Page {jobsData.pagination.page} of {jobsData.pagination.totalPages}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
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
                        <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                          {job.title}
                        </h3>
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
        )}

        {/* Pagination */}
        {jobsData && jobsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, jobsData.pagination.totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(jobsData.pagination.totalPages, currentPage + 1))}
              disabled={currentPage === jobsData.pagination.totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
