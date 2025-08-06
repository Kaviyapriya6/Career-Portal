'use client'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Star,
  Share2,
  BookmarkPlus,
  Globe,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2
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
    website?: string
    careerPage?: string
    description?: string
    sector?: string
    country?: string
    headquarters?: string
    employeeCount?: string
    founded?: number
    techStack?: string[]
    benefits?: string[]
    culture?: string
    locations?: string[]
  }
  location: string
  category: string
  employmentType: string
  workArrangement?: string
  experienceLevel?: string
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
  responsibilities?: string
  benefits?: string
  skillsRequired?: string[]
  featured: boolean
  urgent: boolean
  remote: boolean
  originalUrl: string
  applicationUrl?: string
  applicationInstructions?: string
  relatedJobs: Array<{
    id: number
    title: string
    location: string
    category: string
    employmentType: string
    salary?: string
    postedDate: string
    featured: boolean
    urgent: boolean
    remote: boolean
  }>
  similarJobs: Array<{
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
    postedDate: string
    featured: boolean
    urgent: boolean
    remote: boolean
  }>
}

export default function JobPage() {
  const params = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/jobs/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Job not found')
          }
          throw new Error('Failed to fetch job')
        }
        
        const jobData: Job = await response.json()
        setJob(jobData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchJob()
    }
  }, [params.id])

  const handleShare = async () => {
    if (navigator.share && job) {
      try {
        await navigator.share({
          title: `${job.title} at ${job.company.name}`,
          text: job.description.substring(0, 100) + '...',
          url: window.location.href,
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
    // TODO: Implement bookmark API call
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error === 'Job not found' ? 'Job Not Found' : 'Error Loading Job'}
              </h2>
              <p className="text-gray-600 mb-4">
                {error === 'Job not found' 
                  ? 'The job you are looking for does not exist or has been removed.' 
                  : error}
              </p>
              <div className="space-x-2">
                <Button asChild variant="outline">
                  <Link href="/jobs">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Jobs
                  </Link>
                </Button>
                {error !== 'Job not found' && (
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                )}
              </div>
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
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/jobs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={job.company.logo || '/api/placeholder/64/64'}
                      alt={job.company.name}
                      className="h-16 w-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/64/64'
                      }}
                    />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {job.title}
                      </h1>
                      <Link
                        href={`/companies/${job.company.slug}`}
                        className="text-xl text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {job.company.name}
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
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

                <div className="flex flex-wrap gap-4 text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                    {job.remote && (
                      <Badge variant="secondary" className="ml-2">
                        Remote
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {job.employmentType}
                  </div>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {job.category}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDateRelative(new Date(job.postedDate))}
                  </div>
                </div>

                {job.salary && (
                  <div className="flex items-center text-green-600 font-semibold text-lg">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {job.salary}
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button asChild size="lg" className="flex-1">
                    <Link 
                      href={job.applicationUrl || job.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleBookmark}
                  >
                    <BookmarkPlus className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: job.description.replace(/\n/g, '<br>') 
                    }} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: job.requirements.replace(/\n/g, '<br>') 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: job.responsibilities.replace(/\n/g, '<br>') 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: job.benefits.replace(/\n/g, '<br>') 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills Required */}
            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skillsRequired.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Instructions */}
            {job.applicationInstructions && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">
                    <CheckCircle className="h-5 w-5 mr-2 inline" />
                    Application Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-blue-800">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: job.applicationInstructions.replace(/\n/g, '<br>') 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.company.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.company.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {job.company.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {job.company.sector && (
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Industry:</span>
                      <span className="ml-1 font-medium">{job.company.sector}</span>
                    </div>
                  )}
                  {job.company.employeeCount && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-1 font-medium">{job.company.employeeCount}</span>
                    </div>
                  )}
                  {job.company.founded && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Founded:</span>
                      <span className="ml-1 font-medium">{job.company.founded}</span>
                    </div>
                  )}
                  {job.company.headquarters && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">HQ:</span>
                      <span className="ml-1 font-medium">{job.company.headquarters}</span>
                    </div>
                  )}
                </div>

                {job.company.website && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={job.company.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </Link>
                  </Button>
                )}

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/companies/${job.company.slug}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    View All Jobs
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Tech Stack */}
            {job.company.techStack && job.company.techStack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.company.techStack.map((tech, index) => (
                      <Badge key={index} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Company Benefits */}
            {job.company.benefits && job.company.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.company.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Jobs */}
            {job.relatedJobs && job.relatedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>More Jobs at {job.company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.relatedJobs.slice(0, 3).map((relatedJob) => (
                      <Link
                        key={relatedJob.id}
                        href={`/jobs/${relatedJob.id}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {relatedJob.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {relatedJob.location}
                          {relatedJob.remote && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Remote
                            </Badge>
                          )}
                        </div>
                        {relatedJob.salary && (
                          <p className="text-xs text-green-600 mt-1">{relatedJob.salary}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Jobs */}
            {job.similarJobs && job.similarJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similar Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.similarJobs.slice(0, 3).map((similarJob) => (
                      <Link
                        key={similarJob.id}
                        href={`/jobs/${similarJob.id}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <img
                            src={similarJob.company.logo || '/api/placeholder/24/24'}
                            alt={similarJob.company.name}
                            className="h-6 w-6 rounded object-cover"
                          />
                          <span className="text-xs font-medium text-blue-600">
                            {similarJob.company.name}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {similarJob.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {similarJob.location}
                          {similarJob.remote && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Remote
                            </Badge>
                          )}
                        </div>
                        {similarJob.salary && (
                          <p className="text-xs text-green-600 mt-1">{similarJob.salary}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
