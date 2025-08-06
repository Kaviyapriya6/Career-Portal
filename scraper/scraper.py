"""
Job Portal Scraping Engine
A production-ready web scraping system with proxy rotation, rate limiting, and robust error handling.
"""

import asyncio
import aiohttp
import json
import time
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse
import re
from bs4 import BeautifulSoup
import sqlite3
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Job:
    """Data class representing a job posting"""
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str
    posted_date: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    employment_type: Optional[str] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    scraped_at: str = None
    
    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.now().isoformat()

@dataclass
class Company:
    """Data class representing a company"""
    name: str
    career_url: str
    base_url: str
    selectors: Dict[str, str]
    rate_limit: float = 2.0  # seconds between requests
    last_scraped: Optional[str] = None

@dataclass
class ProxyConfig:
    """Proxy configuration"""
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    protocol: str = 'http'
    
    @property
    def url(self) -> str:
        if self.username and self.password:
            return f"{self.protocol}://{self.username}:{self.password}@{self.host}:{self.port}"
        return f"{self.protocol}://{self.host}:{self.port}"

class ProxyManager:
    """Manages proxy rotation and health checking"""
    
    def __init__(self, proxies: List[ProxyConfig]):
        self.proxies = proxies
        self.active_proxies = set(range(len(proxies)))
        self.failed_proxies = set()
        self.current_proxy = 0
        self.last_rotation = time.time()
        self.rotation_interval = 300  # 5 minutes
        
    def get_next_proxy(self) -> Optional[ProxyConfig]:
        """Get the next available proxy"""
        if not self.active_proxies:
            logger.warning("No active proxies available")
            return None
            
        # Rotate proxy every 5 minutes or after failures
        if (time.time() - self.last_rotation > self.rotation_interval or 
            self.current_proxy not in self.active_proxies):
            self.current_proxy = random.choice(list(self.active_proxies))
            self.last_rotation = time.time()
            
        return self.proxies[self.current_proxy]
    
    def mark_proxy_failed(self, proxy_index: int):
        """Mark a proxy as failed"""
        if proxy_index in self.active_proxies:
            self.active_proxies.remove(proxy_index)
            self.failed_proxies.add(proxy_index)
            logger.warning(f"Proxy {proxy_index} marked as failed")
    
    def reset_failed_proxies(self):
        """Reset failed proxies (for retry logic)"""
        self.active_proxies.update(self.failed_proxies)
        self.failed_proxies.clear()
        logger.info("Reset all failed proxies")

class RateLimiter:
    """Rate limiting to respect website ToS"""
    
    def __init__(self):
        self.request_times = {}
        
    async def wait_if_needed(self, domain: str, min_delay: float = 1.0):
        """Wait if necessary to respect rate limits"""
        current_time = time.time()
        
        if domain in self.request_times:
            time_since_last = current_time - self.request_times[domain]
            if time_since_last < min_delay:
                wait_time = min_delay - time_since_last
                logger.debug(f"Rate limiting: waiting {wait_time:.2f}s for {domain}")
                await asyncio.sleep(wait_time)
        
        self.request_times[domain] = time.time()

class DatabaseManager:
    """SQLite database manager for storing scraped data"""
    
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                description TEXT,
                url TEXT UNIQUE,
                posted_date TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                employment_type TEXT,
                requirements TEXT,
                benefits TEXT,
                scraped_at TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Scrape logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scrape_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                url TEXT NOT NULL,
                status TEXT NOT NULL,
                jobs_found INTEGER DEFAULT 0,
                error_message TEXT,
                started_at TEXT,
                completed_at TEXT,
                duration_seconds REAL
            )
        """)
        
        # Proxy performance table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS proxy_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proxy_host TEXT NOT NULL,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0,
                last_used TEXT,
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save_job(self, job: Job) -> bool:
        """Save job to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO jobs 
                (id, title, company, location, description, url, posted_date, 
                 salary_min, salary_max, employment_type, requirements, benefits, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                job.id, job.title, job.company, job.location, job.description,
                job.url, job.posted_date, job.salary_min, job.salary_max,
                job.employment_type, 
                json.dumps(job.requirements) if job.requirements else None,
                json.dumps(job.benefits) if job.benefits else None,
                job.scraped_at
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error saving job {job.id}: {e}")
            return False
    
    def log_scrape_session(self, company: str, url: str, status: str, 
                          jobs_found: int = 0, error_message: str = None,
                          started_at: str = None, completed_at: str = None,
                          duration: float = None):
        """Log scraping session"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO scrape_logs 
                (company, url, status, jobs_found, error_message, started_at, completed_at, duration_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (company, url, status, jobs_found, error_message, started_at, completed_at, duration))
            
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error logging scrape session: {e}")

class JobScraper:
    """Main job scraping engine"""
    
    def __init__(self, companies: List[Company], proxies: List[ProxyConfig] = None):
        self.companies = companies
        self.proxy_manager = ProxyManager(proxies) if proxies else None
        self.rate_limiter = RateLimiter()
        self.db_manager = DatabaseManager()
        self.session = None
        self.scraped_urls = set()
        
        # User agents for rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
        ]
    
    async def __aenter__(self):
        """Async context manager entry"""
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        connector = aiohttp.TCPConnector(limit=10, limit_per_host=3)
        self.session = aiohttp.ClientSession(timeout=timeout, connector=connector)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def get_headers(self) -> Dict[str, str]:
        """Generate headers with random user agent"""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    async def fetch_page(self, url: str, company: str) -> Optional[str]:
        """Fetch a page with proxy rotation and error handling"""
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                # Rate limiting
                domain = urlparse(url).netloc
                await self.rate_limiter.wait_if_needed(domain, 2.0)
                
                # Get proxy if available
                proxy = None
                if self.proxy_manager:
                    proxy_config = self.proxy_manager.get_next_proxy()
                    if proxy_config:
                        proxy = proxy_config.url
                
                headers = self.get_headers()
                
                async with self.session.get(url, headers=headers, proxy=proxy) as response:
                    if response.status == 200:
                        content = await response.text()
                        logger.info(f"Successfully fetched {url}")
                        return content
                    elif response.status == 429:  # Rate limited
                        wait_time = 2 ** attempt
                        logger.warning(f"Rate limited for {url}, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        
            except asyncio.TimeoutError:
                logger.warning(f"Timeout for {url} (attempt {attempt + 1})")
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
                
                # Mark proxy as failed if using proxies
                if self.proxy_manager and proxy:
                    proxy_index = self.proxy_manager.current_proxy
                    self.proxy_manager.mark_proxy_failed(proxy_index)
            
            # Exponential backoff
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
        
        return None
    
    def extract_jobs_generic(self, html: str, company: Company) -> List[Job]:
        """Generic job extraction using CSS selectors"""
        jobs = []
        soup = BeautifulSoup(html, 'html.parser')
        
        try:
            # Find job containers
            job_containers = soup.select(company.selectors.get('job_container', '.job, .position, .opening'))
            
            for container in job_containers:
                try:
                    # Extract basic job information
                    title_elem = container.select_one(company.selectors.get('title', 'h1, h2, h3, .title, .job-title'))
                    title = title_elem.get_text(strip=True) if title_elem else "Unknown"
                    
                    location_elem = container.select_one(company.selectors.get('location', '.location, .job-location'))
                    location = location_elem.get_text(strip=True) if location_elem else "Unknown"
                    
                    description_elem = container.select_one(company.selectors.get('description', '.description, .job-description'))
                    description = description_elem.get_text(strip=True) if description_elem else ""
                    
                    # Try to find job URL
                    link_elem = container.select_one('a[href]')
                    job_url = urljoin(company.base_url, link_elem['href']) if link_elem else company.career_url
                    
                    # Generate job ID
                    job_id = f"{company.name.lower().replace(' ', '_')}_{hash(title + location) % 10000}"
                    
                    # Extract salary if available
                    salary_text = ""
                    salary_elem = container.select_one(company.selectors.get('salary', '.salary, .compensation'))
                    if salary_elem:
                        salary_text = salary_elem.get_text(strip=True)
                    
                    salary_min, salary_max = self.extract_salary(salary_text)
                    
                    job = Job(
                        id=job_id,
                        title=title,
                        company=company.name,
                        location=location,
                        description=description[:1000],  # Truncate for storage
                        url=job_url,
                        posted_date=datetime.now().isoformat(),
                        salary_min=salary_min,
                        salary_max=salary_max
                    )
                    
                    jobs.append(job)
                    
                except Exception as e:
                    logger.warning(f"Error extracting job from container: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error parsing jobs for {company.name}: {e}")
        
        return jobs
    
    def extract_salary(self, salary_text: str) -> tuple[Optional[int], Optional[int]]:
        """Extract salary range from text"""
        if not salary_text:
            return None, None
        
        # Common salary patterns
        patterns = [
            r'[\$£€](\d+),?(\d+)?k?\s*-\s*[\$£€]?(\d+),?(\d+)?k?',  # $100k - $150k
            r'(\d+),?(\d+)?\s*-\s*(\d+),?(\d+)?\s*k',  # 100 - 150k
            r'[\$£€](\d+),?(\d+)',  # $100,000
        ]
        
        for pattern in patterns:
            match = re.search(pattern, salary_text, re.IGNORECASE)
            if match:
                try:
                    groups = match.groups()
                    if len(groups) >= 3:  # Range format
                        min_sal = int(groups[0] + (groups[1] or ''))
                        max_sal = int(groups[2] + (groups[3] or ''))
                        
                        # Handle 'k' notation
                        if 'k' in salary_text.lower():
                            min_sal *= 1000
                            max_sal *= 1000
                        
                        return min_sal, max_sal
                    else:  # Single value
                        salary = int(groups[0] + (groups[1] or ''))
                        if 'k' in salary_text.lower():
                            salary *= 1000
                        return salary, salary
                except ValueError:
                    continue
        
        return None, None
    
    async def scrape_company(self, company: Company) -> List[Job]:
        """Scrape jobs from a single company"""
        start_time = time.time()
        jobs = []
        
        try:
            logger.info(f"Starting scrape for {company.name}")
            
            # Fetch main career page
            html = await self.fetch_page(company.career_url, company.name)
            if not html:
                raise Exception("Failed to fetch career page")
            
            # Extract jobs
            jobs = self.extract_jobs_generic(html, company)
            
            # Save jobs to database
            saved_count = 0
            for job in jobs:
                if self.db_manager.save_job(job):
                    saved_count += 1
            
            duration = time.time() - start_time
            
            # Log successful scrape
            self.db_manager.log_scrape_session(
                company=company.name,
                url=company.career_url,
                status="success",
                jobs_found=len(jobs),
                started_at=datetime.fromtimestamp(start_time).isoformat(),
                completed_at=datetime.now().isoformat(),
                duration=duration
            )
            
            logger.info(f"Successfully scraped {len(jobs)} jobs from {company.name} (saved {saved_count})")
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            # Log failed scrape
            self.db_manager.log_scrape_session(
                company=company.name,
                url=company.career_url,
                status="failed",
                error_message=error_msg,
                started_at=datetime.fromtimestamp(start_time).isoformat(),
                completed_at=datetime.now().isoformat(),
                duration=duration
            )
            
            logger.error(f"Failed to scrape {company.name}: {e}")
        
        return jobs
    
    async def scrape_all_companies(self) -> Dict[str, List[Job]]:
        """Scrape jobs from all companies"""
        results = {}
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent scrapes
        
        async def scrape_with_semaphore(company):
            async with semaphore:
                return await self.scrape_company(company)
        
        # Run scraping tasks
        tasks = [scrape_with_semaphore(company) for company in self.companies]
        company_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for company, result in zip(self.companies, company_results):
            if isinstance(result, Exception):
                logger.error(f"Exception for {company.name}: {result}")
                results[company.name] = []
            else:
                results[company.name] = result
        
        return results

def load_companies_from_json(file_path: str) -> List[Company]:
    """Load companies configuration from JSON file"""
    try:
        with open(file_path, 'r') as f:
            companies_data = json.load(f)
        
        companies = []
        for company_data in companies_data:
            company = Company(**company_data)
            companies.append(company)
        
        return companies
    except Exception as e:
        logger.error(f"Error loading companies from {file_path}: {e}")
        return []

def load_proxies_from_json(file_path: str) -> List[ProxyConfig]:
    """Load proxy configuration from JSON file"""
    try:
        with open(file_path, 'r') as f:
            proxies_data = json.load(f)
        
        proxies = []
        for proxy_data in proxies_data:
            proxy = ProxyConfig(**proxy_data)
            proxies.append(proxy)
        
        return proxies
    except Exception as e:
        logger.error(f"Error loading proxies from {file_path}: {e}")
        return []

async def main():
    """Main scraping function"""
    logger.info("Starting job scraper...")
    
    # Sample companies configuration
    companies = [
        Company(
            name="Google",
            career_url="https://careers.google.com/jobs/results/",
            base_url="https://careers.google.com",
            selectors={
                "job_container": ".gc-card",
                "title": "h3",
                "location": ".gc-job-tags span",
                "description": ".gc-job-snippet"
            }
        ),
        Company(
            name="Microsoft",
            career_url="https://careers.microsoft.com/us/en/search-results",
            base_url="https://careers.microsoft.com",
            selectors={
                "job_container": ".job-item",
                "title": ".job-title",
                "location": ".job-location",
                "description": ".job-description"
            }
        )
    ]
    
    # Load additional companies if config file exists
    if os.path.exists('companies.json'):
        companies.extend(load_companies_from_json('companies.json'))
    
    # Load proxies if config file exists
    proxies = []
    if os.path.exists('proxies.json'):
        proxies = load_proxies_from_json('proxies.json')
    
    # Initialize and run scraper
    async with JobScraper(companies, proxies) as scraper:
        results = await scraper.scrape_all_companies()
        
        total_jobs = sum(len(jobs) for jobs in results.values())
        logger.info(f"Scraping completed. Total jobs found: {total_jobs}")
        
        # Print summary
        for company_name, jobs in results.items():
            print(f"{company_name}: {len(jobs)} jobs")

if __name__ == "__main__":
    asyncio.run(main())
