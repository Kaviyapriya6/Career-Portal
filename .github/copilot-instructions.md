# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a full-stack job portal application built with:

## Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes + Express.js for scraping service
- **Database**: PostgreSQL with Prisma ORM
- **Scraping**: Python with Playwright, BeautifulSoup, rotating proxies
- **Deployment**: Vercel (frontend) + Render/Fly.io (scraper)

## Key Features
- Real job scraping from 500+ global MNC career pages
- Advanced search and filtering (location, company, role, date)
- Proxy rotation to avoid IP bans
- Company profiles with logos and job counts
- Admin dashboard for scraper management
- Mobile-responsive design with dark mode

## Code Guidelines
- Use TypeScript for all new code
- Follow Next.js 15 App Router patterns
- Implement proper error handling and loading states
- Use Tailwind CSS for styling with consistent design system
- Write clean, production-ready code with proper types
- Include comprehensive error boundaries and validation
- Optimize for performance and SEO

## Database Schema
- Jobs: id, title, company, location, category, posted_date, original_url, description, scraped_at
- Companies: id, name, logo_url, career_page_url, sector, country, is_active
- Scrape_logs: id, company_id, status, jobs_found, last_scraped

## Security & Performance
- Implement rate limiting for APIs
- Use environment variables for sensitive data
- Optimize database queries with proper indexing
- Implement caching strategies for job listings
- Add proper CORS and security headers
