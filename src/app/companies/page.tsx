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
  Users,
  Building2,
  ExternalLink,
  Star,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Globe,
  TrendingUp
} from "lucide-react"
import { globalCompanies } from "@/data/companies"
import { additionalCompanies } from "@/data/companies-extended"

// Combine all companies data
const allCompanies = [...globalCompanies, ...additionalCompanies]

// Add mock job counts and additional data
const companiesWithStats = allCompanies.map(company => {
  // Convert employee count string to number for filtering
  let employeeCountNum = 50000; // default
  const employeeStr = company.employee_count.toLowerCase();
  if (employeeStr.includes('million') || employeeStr.includes('m')) {
    employeeCountNum = parseFloat(employeeStr) * 1000000;
  } else if (employeeStr.includes('k') || employeeStr.includes('thousand')) {
    employeeCountNum = parseFloat(employeeStr) * 1000;
  } else {
    const num = parseInt(employeeStr.replace(/[^\d]/g, ''));
    if (!isNaN(num)) employeeCountNum = num;
  }

  return {
    ...company,
    logo: company.logo_url,
    career_url: company.career_page_url,
    countries: [company.country],
    employee_count_num: employeeCountNum,
    job_count: Math.floor(Math.random() * 100) + 5,
    is_hiring: Math.random() > 0.3,
    rating: Math.floor(Math.random() * 20) + 35, // 3.5 to 5.0 rating
    review_count: Math.floor(Math.random() * 10000) + 100,
    recent_jobs: Math.floor(Math.random() * 20) + 1,
    trending: Math.random() > 0.8
  }
})

const industries = [
  "All",
  "Technology",
  "Finance",
  "Healthcare",
  "E-commerce",
  "Consulting",
  "Automotive",
  "Entertainment",
  "Energy",
  "Telecommunications"
]

const companySizes = [
  "All",
  "1-50",
  "51-200",
  "201-1000",
  "1001-5000",
  "5000+"
]

const countries = [
  "All",
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Singapore"
]

export default function CompaniesPage() {
  const [filteredCompanies, setFilteredCompanies] = useState(companiesWithStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("All")
  const [selectedSize, setSelectedSize] = useState("All")
  const [selectedCountry, setSelectedCountry] = useState("All")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("trending")

  // Filter and sort companies
  useEffect(() => {
    let filtered = companiesWithStats

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.sector.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Industry filter
    if (selectedIndustry !== "All") {
      filtered = filtered.filter(company => company.sector === selectedIndustry)
    }

    // Size filter
    if (selectedSize !== "All") {
      filtered = filtered.filter(company => {
        const employeeCount = company.employee_count_num
        switch (selectedSize) {
          case "1-50":
            return employeeCount <= 50
          case "51-200":
            return employeeCount > 50 && employeeCount <= 200
          case "201-1000":
            return employeeCount > 200 && employeeCount <= 1000
          case "1001-5000":
            return employeeCount > 1000 && employeeCount <= 5000
          case "5000+":
            return employeeCount > 5000
          default:
            return true
        }
      })
    }

    // Country filter
    if (selectedCountry !== "All") {
      filtered = filtered.filter(company => 
        company.countries.includes(selectedCountry)
      )
    }

    // Sort companies
    switch (sortBy) {
      case "trending":
        filtered.sort((a, b) => {
          if (a.trending && !b.trending) return -1
          if (!a.trending && b.trending) return 1
          return b.job_count - a.job_count
        })
        break
      case "jobs":
        filtered.sort((a, b) => b.job_count - a.job_count)
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "size":
        filtered.sort((a, b) => b.employee_count_num - a.employee_count_num)
        break
      default:
        break
    }

    setFilteredCompanies(filtered)
  }, [searchQuery, selectedIndustry, selectedSize, selectedCountry, sortBy])

  const formatEmployeeCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1)
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Companies</h1>
        <p className="text-muted-foreground">
          Discover your next career opportunity at top companies worldwide
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Industry Filter */}
                <div>
                  <h3 className="font-medium mb-3">Industry</h3>
                  <div className="space-y-2">
                    {industries.map((industry) => (
                      <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="industry"
                          value={industry}
                          checked={selectedIndustry === industry}
                          onChange={(e) => setSelectedIndustry(e.target.value)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Company Size Filter */}
                <div>
                  <h3 className="font-medium mb-3">Company Size</h3>
                  <div className="space-y-2">
                    {companySizes.map((size) => (
                      <label key={size} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="size"
                          value={size}
                          checked={selectedSize === size}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">{size} employees</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Country Filter */}
                <div>
                  <h3 className="font-medium mb-3">Country</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {countries.map((country) => (
                      <label key={country} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="country"
                          value={country}
                          checked={selectedCountry === country}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedIndustry("All")
                    setSelectedSize("All")
                    setSelectedCountry("All")
                    setSearchQuery("")
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar and Controls */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies, industries, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Results Count and Sort */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing {filteredCompanies.length} companies
              </p>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-md px-3 py-1 text-sm"
              >
                <option value="trending">Trending</option>
                <option value="jobs">Most Jobs</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Company Name</option>
                <option value="size">Company Size</option>
              </select>
            </div>
          </div>

          {/* Company Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Card key={company.slug} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white border rounded-lg p-2 flex-shrink-0">
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
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          <Link href={`/companies/${company.slug}`} className="hover:text-primary">
                            {company.name}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{company.sector}</Badge>
                          {company.trending && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {company.description}
                  </p>

                  {/* Company Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{formatEmployeeCount(company.employee_count_num)} employees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{formatRating(company.rating)}</span>
                        <span className="text-muted-foreground">({company.review_count})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-primary">{company.job_count} open jobs</span>
                      </div>
                      {company.is_hiring && (
                        <Badge variant="default" className="text-xs">
                          Actively Hiring
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {company.countries.slice(0, 2).join(", ")}
                        {company.countries.length > 2 && ` +${company.countries.length - 2} more`}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button asChild className="flex-1">
                      <Link href={`/companies/${company.slug}`}>
                        View Jobs
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.career_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {filteredCompanies.length > 0 && filteredCompanies.length >= 20 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Companies
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* No Results */}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or clearing some filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedIndustry("All")
                  setSelectedSize("All")
                  setSelectedCountry("All")
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
