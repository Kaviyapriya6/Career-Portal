import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateRelative(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function formatSalary(min?: number, max?: number, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  
  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }
  if (min) {
    return `${formatter.format(min)}+`
  }
  if (max) {
    return `Up to ${formatter.format(max)}`
  }
  return 'Not specified'
}

export function getCompanyLogoUrl(companyName: string) {
  // Fallback logic for company logos
  const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

export function isValidUrl(string: string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function generateMetaTitle(title: string, siteName = 'JobPortal') {
  return `${title} | ${siteName}`
}

export function generateMetaDescription(description: string, maxLength = 160) {
  return truncate(description, maxLength)
}

// Rate limiting helper
export function createRateLimiter(limit: number, windowMs: number) {
  const requests = new Map<string, number[]>()
  
  return (identifier: string): boolean => {
    const now = Date.now()
    const userRequests = requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= limit) {
      return false
    }
    
    validRequests.push(now)
    requests.set(identifier, validRequests)
    return true
  }
}

// Search and filter utilities
export function createSearchFilter(query: string) {
  const terms = query.toLowerCase().split(' ').filter(Boolean)
  
  return (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return terms.every(term => lowerText.includes(term))
  }
}

export function createLocationFilter(allowedLocations: string[]) {
  const normalizedLocations = allowedLocations.map(loc => loc.toLowerCase())
  
  return (location: string): boolean => {
    const normalizedLocation = location.toLowerCase()
    return normalizedLocations.some(allowed => 
      normalizedLocation.includes(allowed) || allowed.includes(normalizedLocation)
    )
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
}

// Error handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

// Async utilities
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < attempts - 1) {
        await delay(delayMs * Math.pow(2, i)) // Exponential backoff
      }
    }
  }
  
  throw lastError!
}
