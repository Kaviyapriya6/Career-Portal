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
  Users,
  Calendar,
  Globe,
  Star,
  Briefcase,
  TrendingUp,
  Mail,
  Phone,
  Search,
  Filter,
  Clock,
  DollarSign
} from "lucide-react"
import { globalCompanies } from "@/data/companies"
import { additionalCompanies } from "@/data/companies-extended"
import { Input } from "@/components/ui/input"
import { formatDateRelative, formatSalary } from "@/lib/utils"

// Combine all companies
const allCompanies = [...globalCompanies, ...additionalCompanies]

// Mock jobs data for the company
const generateCompanyJobs = (companyName: string, companySlug: string) => [
  {
    id: `${companySlug}-1`,
    title: "Senior Software Engineer",
    company: { name: companyName, slug: companySlug },
    location: "San Francisco, CA",
    location_type: "Hybrid",
    category: "Engineering",
    level: "Senior",
    employment_type: "Full-time",
    salary_min: 150000,
    salary_max: 250000,
    posted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    is_remote: false,
    is_urgent: false,
    skills: ["React", "TypeScript", "Node.js", "AWS"]
  },
  {
    id: `${companySlug}-2`,
    title: "Product Manager",
    company: { name: companyName, slug: companySlug },
    location: "New York, NY",
    location_type: "Remote",
    category: "Product",
    level: "Mid",
    employment_type: "Full-time",
    salary_min: 120000,
    salary_max: 180000,
    posted_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    is_remote: true,
    is_urgent: true,
    skills: ["Product Strategy", "Analytics", "Agile"]
  },
  {
    id: `${companySlug}-3`,
    title: "UX Designer",
    company: { name: companyName, slug: companySlug },
    location: "Austin, TX",
    location_type: "On-site",
    category: "Design",
    level: "Mid",
    employment_type: "Full-time",
    salary_min: 100000,
    salary_max: 150000,
    posted_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    is_remote: false,
    is_urgent: false,
    skills: ["Figma", "Prototyping", "User Research"]
  },
  {
    id: `${companySlug}-4`,
    title: "Data Scientist",
    company: { name: companyName, slug: companySlug },
    location: "Seattle, WA",
    location_type: "Hybrid",
    category: "Data Science",
    level: "Senior",
    employment_type: "Full-time",
    salary_min: 140000,
    salary_max: 220000,
    posted_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    is_remote: false,
    is_urgent: false,
    skills: ["Python", "Machine Learning", "SQL"]
  },
  {
    id: `${companySlug}-5`,
    title: "DevOps Engineer",
    company: { name: companyName, slug: companySlug },
    location: "Denver, CO",
    location_type: "Remote",
    category: "Engineering",
    level: "Mid",
    employment_type: "Full-time",
    salary_min: 110000,
    salary_max: 160000,
    posted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    is_remote: true,
    is_urgent: false,
    skills: ["AWS", "Kubernetes", "Docker"]
  }
]

export default function CompanyProfilePage() {
  const params = useParams()
  const [company, setCompany] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [filteredJobs, setFilteredJobs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    // Find company by slug
    const foundCompany = allCompanies.find(c => c.slug === params.slug)
    if (foundCompany) {
      // Add additional mock data
      const companyWithExtras = {
        ...foundCompany,
        logo: foundCompany.logo_url,
        career_url: foundCompany.career_page_url,
        employee_count_display: foundCompany.employee_count,
        rating: 4.2 + Math.random() * 0.8, // 4.2 to 5.0
        review_count: Math.floor(Math.random() * 10000) + 500,
        job_count: Math.floor(Math.random() * 50) + 10,
        followers: Math.floor(Math.random() * 100000) + 5000,
        industry_rank: Math.floor(Math.random() * 10) + 1,
        growth_rate: Math.floor(Math.random() * 20) + 5,
        benefits: [
          "Health, Dental & Vision Insurance",
          "401(k) with company matching",
          "Flexible PTO",
          "Remote work options",
          "Professional development budget",
          "Stock options",
          "Wellness programs",
          "Free meals and snacks"
        ],
        tech_stack: ["React", "TypeScript", "Node.js", "Python", "AWS", "Kubernetes", "PostgreSQL"],
        offices: [
          { city: "San Francisco", address: "1 Hacker Way, Menlo Park, CA 94025" },
          { city: "New York", address: "770 Broadway, New York, NY 10003" },
          { city: "Seattle", address: "410 Terry Ave N, Seattle, WA 98109" }
        ]
      }
      setCompany(companyWithExtras)
      
      // Generate jobs for this company
      const companyJobs = generateCompanyJobs(foundCompany.name, foundCompany.slug)
      setJobs(companyJobs)
      setFilteredJobs(companyJobs)
    }
  }, [params.slug])

  // Filter jobs
  useEffect(() => {
    let filtered = jobs

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(job => job.category === selectedCategory)
    }

    setFilteredJobs(filtered)
  }, [searchQuery, selectedCategory, jobs])

  if (!company) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Company not found</h1>
          <Button asChild>
            <Link href="/companies">Browse Companies</Link>
          </Button>
        </div>
      </div>
    )
  }

  const categories = ["All", ...Array.from(new Set(jobs.map(job => job.category)))]

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/companies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
        </Button>
      </div>

      {/* Company Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start space-x-6">
              {/* Company Logo */}
              <div className="w-24 h-24 bg-white border rounded-xl p-4 flex-shrink-0">
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
                    <p className="text-xl text-muted-foreground mb-4">
                      {company.description}
                    </p>
                  </div>
                </div>

                {/* Company Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-primary">{company.job_count}</div>
                    <div className="text-sm text-muted-foreground">Open Jobs</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-2xl font-bold">{company.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{company.review_count} reviews</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold">{company.followers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-green-600">#{company.industry_rank}</div>
                    <div className="text-sm text-muted-foreground">Industry Rank</div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{company.sector}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.employee_count_display} employees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{company.headquarters}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Founded {company.founded_year}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 lg:w-48">
              <Button
                onClick={() => setIsFollowing(!isFollowing)}
                variant={isFollowing ? "outline" : "default"}
                className="w-full"
              >
                <Star className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow Company'}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={company.career_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Career Page
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Open Positions ({filteredJobs.length})</span>
                <Badge variant="secondary">{company.job_count} total jobs</Badge>
              </CardTitle>
              
              {/* Job Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                          <Link href={`/jobs/${job.id}`}>
                            {job.title}
                          </Link>
                        </h3>
                        {job.is_urgent && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                          <Badge variant="outline" className="ml-1">
                            {job.location_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.employment_type} • {job.level}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatSalary(job.salary_min, job.salary_max, "USD")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateRelative(job.posted_date)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 4).map((skill: string) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 4 && (
                          <Badge variant="outline">
                            +{job.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <Button size="sm" asChild>
                        <Link href={`/jobs/${job.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No jobs found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits & Perks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {company.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {company.tech_stack.map((tech: string) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Office Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Office Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.offices.map((office: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">{office.city}</div>
                  <div className="text-muted-foreground">{office.address}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Company Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Company Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Growth Rate</span>
                <span className="font-medium text-green-600">+{company.growth_rate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Employee Satisfaction</span>
                <span className="font-medium">{company.rating.toFixed(1)}/5.0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Industry Rank</span>
                <span className="font-medium">#{company.industry_rank}</span>
              </div>
            </CardContent>
          </Card>

          {/* Job Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Stay Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get notified when {company.name} posts new jobs
              </p>
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Create Job Alert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
