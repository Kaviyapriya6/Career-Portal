import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MapPin, 
  Building2, 
  Users, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Star,
  ArrowRight
} from "lucide-react"

export default function HomePage() {
  const featuredCompanies = [
    { name: "Google", logo: "https://cdn.worldvectorlogo.com/logos/google-1-1.svg", jobs: 245 },
    { name: "Microsoft", logo: "https://cdn.worldvectorlogo.com/logos/microsoft-5.svg", jobs: 189 },
    { name: "Amazon", logo: "https://cdn.worldvectorlogo.com/logos/amazon-4.svg", jobs: 312 },
    { name: "Apple", logo: "https://cdn.worldvectorlogo.com/logos/apple-14.svg", jobs: 156 },
    { name: "Meta", logo: "https://cdn.worldvectorlogo.com/logos/meta-1.svg", jobs: 98 },
    { name: "Tesla", logo: "https://cdn.worldvectorlogo.com/logos/tesla-9.svg", jobs: 87 },
    { name: "Netflix", logo: "https://cdn.worldvectorlogo.com/logos/netflix-3.svg", jobs: 45 },
    { name: "Spotify", logo: "https://cdn.worldvectorlogo.com/logos/spotify-2.svg", jobs: 34 }
  ]

  const trendingRoles = [
    "Software Engineer", "Product Manager", "Data Scientist", "UX Designer", 
    "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer"
  ]

  const jobCategories = [
    { name: "Technology", count: "2,847", icon: "💻", color: "bg-blue-100 text-blue-800" },
    { name: "Finance", count: "1,234", icon: "💰", color: "bg-green-100 text-green-800" },
    { name: "Consulting", count: "856", icon: "📊", color: "bg-purple-100 text-purple-800" },
    { name: "Healthcare", count: "743", icon: "⚕️", color: "bg-red-100 text-red-800" },
    { name: "Automotive", count: "567", icon: "🚗", color: "bg-orange-100 text-orange-800" },
    { name: "Aerospace", count: "234", icon: "✈️", color: "bg-indigo-100 text-indigo-800" }
  ]

  const stats = [
    { label: "Active Jobs", value: "15,847", icon: Users },
    { label: "Companies", value: "500+", icon: Building2 },
    { label: "Countries", value: "50+", icon: MapPin },
    { label: "Success Rate", value: "94%", icon: TrendingUp }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Find Your Dream Job at{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Top Global Companies
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Discover opportunities at 500+ leading MNCs worldwide. Real-time job listings from Google, Microsoft, Amazon, and more. Apply directly to original job postings.
            </p>

            {/* Search Bar */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Job title, company, or keywords..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="City, state, or remote"
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/jobs">
                  Search Jobs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Trending Searches */}
            <div className="mt-8">
              <p className="text-sm text-muted-foreground mb-3">Trending searches:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {trendingRoles.slice(0, 6).map((role) => (
                  <Badge key={role} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Companies Hiring Now
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore opportunities at the world's most innovative companies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {featuredCompanies.map((company) => (
              <Card key={company.name} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-lg border p-2 group-hover:scale-105 transition-transform">
                    <img 
                      src={company.logo} 
                      alt={`${company.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{company.name}</h3>
                  <p className="text-sm text-muted-foreground">{company.jobs} open positions</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/companies">
                View All 500+ Companies
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore by Category
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Find jobs across different industries and sectors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobCategories.map((category) => (
              <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground">{category.count} jobs available</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose JobPortal?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The most comprehensive job search platform for global opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  Jobs are scraped and updated every 6 hours from company career pages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <ExternalLink className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Direct Applications</CardTitle>
                <CardDescription>
                  Apply directly on company websites - no middleman, no extra steps
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Premium Companies</CardTitle>
                <CardDescription>
                  Curated list of top 500 MNCs including Fortune 500 and global leaders
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to find your next opportunity?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream jobs through our platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/jobs">
                Browse All Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/companies">
                Explore Companies
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
