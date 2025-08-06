"""
Job Scraper Scheduler - Automated scheduling system for job scraping
Uses asyncio for scheduling without external dependencies
"""

import asyncio
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Set
import json
import os

# Import our scraper components
from scraper import JobScraper, Company, load_companies_from_json, load_proxies_from_json, DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SimpleScheduler:
    """Simple scheduler without external dependencies"""
    
    def __init__(self):
        self.jobs = []
        self.running = False
    
    def every(self, interval: int):
        return ScheduleBuilder(interval, self)
    
    def add_job(self, job_func, interval_type: str, interval: int, at_time: str = None):
        job = {
            'func': job_func,
            'interval_type': interval_type,
            'interval': interval,
            'at_time': at_time,
            'last_run': None,
            'next_run': self._calculate_next_run(interval_type, interval, at_time)
        }
        self.jobs.append(job)
    
    def _calculate_next_run(self, interval_type: str, interval: int, at_time: str = None):
        now = datetime.now()
        
        if interval_type == 'hours':
            return now + timedelta(hours=interval)
        elif interval_type == 'day':
            if at_time:
                hour, minute = map(int, at_time.split(':'))
                next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if next_run <= now:
                    next_run += timedelta(days=1)
                return next_run
            else:
                return now + timedelta(days=1)
        elif interval_type == 'hour':
            return now + timedelta(hours=1)
        else:
            return now + timedelta(seconds=interval)
    
    def run_pending(self):
        now = datetime.now()
        for job in self.jobs:
            if job['next_run'] and now >= job['next_run']:
                try:
                    if asyncio.iscoroutinefunction(job['func']):
                        asyncio.create_task(job['func']())
                    else:
                        job['func']()
                    job['last_run'] = now
                    job['next_run'] = self._calculate_next_run(
                        job['interval_type'], 
                        job['interval'], 
                        job['at_time']
                    )
                    logger.info(f"Executed scheduled job: {job['func'].__name__}")
                except Exception as e:
                    logger.error(f"Error executing scheduled job {job['func'].__name__}: {e}")

class ScheduleBuilder:
    """Builder for creating scheduled jobs"""
    
    def __init__(self, interval: int, scheduler: SimpleScheduler):
        self.interval = interval
        self.scheduler = scheduler
    
    @property
    def hours(self):
        return ScheduleTimeUnit('hours', self.interval, self.scheduler)
    
    @property
    def hour(self):
        return ScheduleTimeUnit('hour', 1, self.scheduler)
    
    @property
    def day(self):
        return ScheduleTimeUnit('day', 1, self.scheduler)

class ScheduleTimeUnit:
    """Time unit for scheduled jobs"""
    
    def __init__(self, unit_type: str, interval: int, scheduler: SimpleScheduler):
        self.unit_type = unit_type
        self.interval = interval
        self.scheduler = scheduler
    
    def do(self, job_func):
        self.scheduler.add_job(job_func, self.unit_type, self.interval)
        return self
    
    def at(self, time_str: str):
        return ScheduleAtTime(self.unit_type, self.interval, self.scheduler, time_str)

class ScheduleAtTime:
    """Scheduled job with specific time"""
    
    def __init__(self, unit_type: str, interval: int, scheduler: SimpleScheduler, at_time: str):
        self.unit_type = unit_type
        self.interval = interval
        self.scheduler = scheduler
        self.at_time = at_time
    
    def do(self, job_func):
        self.scheduler.add_job(job_func, self.unit_type, self.interval, self.at_time)
        return self

# Create global scheduler instance
schedule = SimpleScheduler()

class ScrapingScheduler:
    """
    Automated scheduling system for job scraping with priority-based intervals
    """
    
    def __init__(self):
        self.companies = []
        self.proxies = []
        self.db = DatabaseManager()
        self.running = False
        self.last_health_check = None
        self.scraping_in_progress = False
        
        # Company priority configuration
        self.company_priorities = {
            'high': ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix'],
            'medium': ['Spotify', 'Uber', 'Airbnb', 'LinkedIn', 'Twitter', 'Salesforce'],
            'low': []  # Will be populated with remaining companies
        }
        
        # Scraping intervals (in hours)
        self.scraping_intervals = {
            'high': 2,    # Every 2 hours
            'medium': 6,  # Every 6 hours
            'low': 24     # Daily
        }
        
        self.stats = {
            'total_scrapes': 0,
            'successful_scrapes': 0,
            'failed_scrapes': 0,
            'last_scrape_time': None,
            'jobs_scraped_today': 0
        }
        
    async def initialize(self):
        """Initialize the scheduler with company and proxy configurations"""
        try:
            # Load companies
            self.companies = load_companies_from_json('companies.json')
            if not self.companies:
                logger.error("No companies found in companies.json")
                return False
            
            # Categorize companies by priority
            high_priority = set(self.company_priorities['high'])
            medium_priority = set(self.company_priorities['medium'])
            
            for company in self.companies:
                if company.name not in high_priority and company.name not in medium_priority:
                    self.company_priorities['low'].append(company.name)
            
            # Load proxies (optional)
            self.proxies = load_proxies_from_json('proxies.json')
            if self.proxies:
                logger.info(f"Loaded {len(self.proxies)} proxy configurations")
            else:
                logger.warning("No proxies found, will scrape without proxy rotation")
            
            logger.info(f"Initialized scheduler with {len(self.companies)} companies")
            logger.info(f"Priority breakdown - High: {len(self.company_priorities['high'])}, "
                       f"Medium: {len(self.company_priorities['medium'])}, "
                       f"Low: {len(self.company_priorities['low'])}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize scheduler: {e}")
            return False
    
    def setup_schedule(self):
        """Setup the automated schedule for different priority companies"""
        
        # High priority companies - every 2 hours
        schedule.every(2).hours.do(
            self.scrape_priority_companies, 'high'
        )
        
        # Medium priority companies - every 6 hours
        schedule.every(6).hours.do(
            self.scrape_priority_companies, 'medium'
        )
        
        # Low priority companies - daily at 2 AM
        schedule.every().day.at("02:00").do(
            self.scrape_priority_companies, 'low'
        )
        
        # Health check - every hour
        schedule.every().hour.do(self.health_check)
        
        # Daily cleanup - at 3 AM
        schedule.every().day.at("03:00").do(self.cleanup_old_data)
        
        logger.info("Automated schedule configured successfully")
    
    async def scrape_priority_companies(self, priority: str):
        """Scrape companies of a specific priority level"""
        if self.scraping_in_progress:
            logger.warning(f"Scraping already in progress, skipping {priority} priority scrape")
            return
        
        self.scraping_in_progress = True
        company_names = self.company_priorities.get(priority, [])
        
        if not company_names:
            logger.warning(f"No companies found for priority: {priority}")
            self.scraping_in_progress = False
            return
        
        logger.info(f"Starting {priority} priority scraping for {len(company_names)} companies")
        
        try:
            # Filter companies by priority
            priority_companies = [c for c in self.companies if c.name in company_names]
            
            if not priority_companies:
                logger.warning(f"No company objects found for {priority} priority")
                return
            
            # Run scraping
            async with JobScraper(priority_companies, self.proxies) as scraper:
                results = await scraper.scrape_all_companies()
            
            # Update statistics
            total_jobs = sum(len(jobs) for jobs in results.values())
            self.stats['total_scrapes'] += 1
            self.stats['last_scrape_time'] = datetime.now()
            self.stats['jobs_scraped_today'] += total_jobs
            
            if total_jobs > 0:
                self.stats['successful_scrapes'] += 1
                logger.info(f"✅ {priority.capitalize()} priority scraping completed: {total_jobs} jobs found")
            else:
                logger.warning(f"⚠️ {priority.capitalize()} priority scraping completed but no jobs found")
            
            # Log per-company results
            for company_name, jobs in results.items():
                job_count = len(jobs)
                status = "✅" if job_count > 0 else "⚠️"
                logger.info(f"  {status} {company_name}: {job_count} jobs")
        
        except Exception as e:
            self.stats['failed_scrapes'] += 1
            logger.error(f"❌ {priority.capitalize()} priority scraping failed: {e}")
        
        finally:
            self.scraping_in_progress = False
    
    def health_check(self):
        """Perform health check on the scraping system"""
        try:
            logger.info("🔍 Performing health check...")
            
            # Check database connectivity
            import sqlite3
            conn = sqlite3.connect(self.db.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM jobs")
            total_jobs = cursor.fetchone()[0]
            
            # Check recent activity
            cursor.execute("SELECT COUNT(*) FROM jobs WHERE scraped_at > datetime('now', '-24 hours')")
            jobs_last_24h = cursor.fetchone()[0]
            
            conn.close()
            
            # Update health check timestamp
            self.last_health_check = datetime.now()
            
            # Log health status
            success_rate = (self.stats['successful_scrapes'] / max(self.stats['total_scrapes'], 1)) * 100
            
            logger.info(f"💓 Health Check Results:")
            logger.info(f"  📊 Total jobs in database: {total_jobs:,}")
            logger.info(f"  🆕 Jobs scraped (24h): {jobs_last_24h:,}")
            logger.info(f"  📈 Total scrapes: {self.stats['total_scrapes']}")
            logger.info(f"  ✅ Success rate: {success_rate:.1f}%")
            logger.info(f"  🔄 Scraping in progress: {'Yes' if self.scraping_in_progress else 'No'}")
            
            # Alert if success rate is low
            if self.stats['total_scrapes'] > 0 and success_rate < 50:
                logger.warning(f"⚠️ Low success rate detected: {success_rate:.1f}%")
            
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
    
    def cleanup_old_data(self):
        """Clean up old job data and logs"""
        try:
            logger.info("🧹 Starting daily cleanup...")
            
            import sqlite3
            from datetime import timedelta
            
            conn = sqlite3.connect(self.db.db_path)
            cursor = conn.cursor()
            
            # Remove jobs older than 90 days
            cutoff_date = (datetime.now() - timedelta(days=90)).isoformat()
            
            cursor.execute("SELECT COUNT(*) FROM jobs WHERE scraped_at < ?", (cutoff_date,))
            jobs_to_delete = cursor.fetchone()[0]
            
            cursor.execute("DELETE FROM jobs WHERE scraped_at < ?", (cutoff_date,))
            
            # Remove old scrape logs
            cursor.execute("SELECT COUNT(*) FROM scrape_logs WHERE started_at < ?", (cutoff_date,))
            logs_to_delete = cursor.fetchone()[0]
            
            cursor.execute("DELETE FROM scrape_logs WHERE started_at < ?", (cutoff_date,))
            
            conn.commit()
            conn.close()
            
            # Reset daily stats
            self.stats['jobs_scraped_today'] = 0
            
            logger.info(f"✅ Cleanup completed:")
            logger.info(f"  🗑️ Deleted {jobs_to_delete} old jobs")
            logger.info(f"  📝 Deleted {logs_to_delete} old logs")
            
        except Exception as e:
            logger.error(f"❌ Cleanup failed: {e}")
    
    async def run(self):
        """Run the scheduler continuously"""
        if not await self.initialize():
            logger.error("Failed to initialize scheduler")
            return
        
        self.setup_schedule()
        self.running = True
        
        logger.info("🚀 Scraping scheduler started")
        logger.info("📅 Schedule:")
        logger.info(f"  ⭐ High priority ({len(self.company_priorities['high'])} companies): Every 2 hours")
        logger.info(f"  ⚡ Medium priority ({len(self.company_priorities['medium'])} companies): Every 6 hours")
        logger.info(f"  📅 Low priority ({len(self.company_priorities['low'])} companies): Daily at 2:00 AM")
        logger.info(f"  🔍 Health checks: Every hour")
        logger.info(f"  🧹 Cleanup: Daily at 3:00 AM")
        
        try:
            while self.running:
                schedule.run_pending()
                await asyncio.sleep(30)  # Check every 30 seconds
                
        except KeyboardInterrupt:
            logger.info("⏹️ Scheduler stopped by user")
        except Exception as e:
            logger.error(f"❌ Scheduler error: {e}")
        finally:
            self.running = False
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("🛑 Scheduler stop requested")
    
    def get_status(self) -> Dict:
        """Get current scheduler status"""
        return {
            'running': self.running,
            'scraping_in_progress': self.scraping_in_progress,
            'last_health_check': self.last_health_check.isoformat() if self.last_health_check else None,
            'stats': self.stats.copy(),
            'company_counts': {
                priority: len(companies) 
                for priority, companies in self.company_priorities.items()
            }
        }

async def main():
    """Main function to run the scheduler"""
    scheduler = ScrapingScheduler()
    
    try:
        await scheduler.run()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down scheduler...")
        scheduler.stop()

if __name__ == "__main__":
    # Handle graceful shutdown
    import signal
    
    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run the scheduler
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scheduler shutdown complete")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        exit(1)

import asyncio
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List
import json
import os
from scraper import JobScraper, Company, ProxyConfig, load_companies_from_json, load_proxies_from_json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScrapingScheduler:
    """Automated job scraping scheduler"""
    
    def __init__(self, config_file: str = "scheduler_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.is_running = False
        self.last_scrape_times = {}
        
    def load_config(self) -> Dict:
        """Load scheduler configuration"""
        default_config = {
            "scraping_intervals": {
                "high_priority_companies": "every 2 hours",
                "medium_priority_companies": "every 6 hours", 
                "low_priority_companies": "daily"
            },
            "company_priorities": {
                "Google": "high",
                "Microsoft": "high",
                "Apple": "high",
                "Meta": "high",
                "Amazon": "high",
                "Netflix": "medium",
                "Tesla": "medium",
                "Salesforce": "medium",
                "Adobe": "low",
                "Spotify": "low"
            },
            "max_concurrent_scrapes": 3,
            "retry_failed_after_hours": 4,
            "enable_proxy_rotation": True,
            "rate_limits": {
                "requests_per_minute": 30,
                "requests_per_hour": 1000
            }
        }
        
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                # Merge with defaults
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
            else:
                # Create default config file
                with open(self.config_file, 'w') as f:
                    json.dump(default_config, f, indent=2)
                return default_config
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return default_config
    
    def get_companies_by_priority(self, priority: str) -> List[Company]:
        """Get companies filtered by priority level"""
        all_companies = load_companies_from_json('companies.json')
        priority_companies = []
        
        for company in all_companies:
            company_priority = self.config["company_priorities"].get(company.name, "low")
            if company_priority == priority:
                priority_companies.append(company)
        
        return priority_companies
    
    async def scrape_companies_by_priority(self, priority: str):
        """Scrape companies of a specific priority level"""
        try:
            logger.info(f"Starting {priority} priority scraping session")
            
            companies = self.get_companies_by_priority(priority)
            if not companies:
                logger.info(f"No {priority} priority companies found")
                return
            
            # Load proxies
            proxies = load_proxies_from_json('proxies.json') if self.config["enable_proxy_rotation"] else []
            
            # Run scraping
            async with JobScraper(companies, proxies) as scraper:
                results = await scraper.scrape_all_companies()
                
                total_jobs = sum(len(jobs) for jobs in results.values())
                logger.info(f"{priority.capitalize()} priority scraping completed. Total jobs: {total_jobs}")
                
                # Update last scrape times
                current_time = datetime.now().isoformat()
                for company_name in results.keys():
                    self.last_scrape_times[company_name] = current_time
                
                # Save updated times
                self.save_scrape_times()
                
        except Exception as e:
            logger.error(f"Error in {priority} priority scraping: {e}")
    
    def save_scrape_times(self):
        """Save last scrape times to file"""
        try:
            with open('last_scrape_times.json', 'w') as f:
                json.dump(self.last_scrape_times, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving scrape times: {e}")
    
    def load_scrape_times(self):
        """Load last scrape times from file"""
        try:
            if os.path.exists('last_scrape_times.json'):
                with open('last_scrape_times.json', 'r') as f:
                    self.last_scrape_times = json.load(f)
        except Exception as e:
            logger.error(f"Error loading scrape times: {e}")
    
    def setup_schedule(self):
        """Setup scraping schedule based on configuration"""
        # High priority companies - every 2 hours
        schedule.every(2).hours.do(
            lambda: asyncio.create_task(self.scrape_companies_by_priority("high"))
        )
        
        # Medium priority companies - every 6 hours  
        schedule.every(6).hours.do(
            lambda: asyncio.create_task(self.scrape_companies_by_priority("medium"))
        )
        
        # Low priority companies - daily
        schedule.every().day.at("02:00").do(
            lambda: asyncio.create_task(self.scrape_companies_by_priority("low"))
        )
        
        # Health check - every hour
        schedule.every().hour.do(self.health_check)
        
        # Cleanup old data - daily
        schedule.every().day.at("03:00").do(self.cleanup_old_data)
        
        logger.info("Scraping schedule configured")
    
    def health_check(self):
        """Perform health check and retry failed scrapes"""
        try:
            logger.info("Performing health check...")
            
            # Check database connectivity
            from scraper import DatabaseManager
            db = DatabaseManager()
            
            # Check for companies that haven't been scraped recently
            retry_threshold = datetime.now() - timedelta(hours=self.config["retry_failed_after_hours"])
            
            companies_to_retry = []
            for company_name, last_scrape in self.last_scrape_times.items():
                last_scrape_time = datetime.fromisoformat(last_scrape)
                if last_scrape_time < retry_threshold:
                    companies_to_retry.append(company_name)
            
            if companies_to_retry:
                logger.info(f"Found {len(companies_to_retry)} companies to retry: {companies_to_retry}")
                # Schedule immediate retry for failed companies
                asyncio.create_task(self.retry_failed_companies(companies_to_retry))
            
            logger.info("Health check completed")
            
        except Exception as e:
            logger.error(f"Error in health check: {e}")
    
    async def retry_failed_companies(self, company_names: List[str]):
        """Retry scraping for specific companies"""
        try:
            all_companies = load_companies_from_json('companies.json')
            retry_companies = [c for c in all_companies if c.name in company_names]
            
            if retry_companies:
                proxies = load_proxies_from_json('proxies.json') if self.config["enable_proxy_rotation"] else []
                
                async with JobScraper(retry_companies, proxies) as scraper:
                    results = await scraper.scrape_all_companies()
                    
                    total_jobs = sum(len(jobs) for jobs in results.values())
                    logger.info(f"Retry scraping completed. Total jobs: {total_jobs}")
                    
                    # Update last scrape times
                    current_time = datetime.now().isoformat()
                    for company_name in results.keys():
                        self.last_scrape_times[company_name] = current_time
                    
                    self.save_scrape_times()
                    
        except Exception as e:
            logger.error(f"Error in retry scraping: {e}")
    
    def cleanup_old_data(self):
        """Clean up old job data and logs"""
        try:
            logger.info("Starting data cleanup...")
            
            from scraper import DatabaseManager
            db = DatabaseManager()
            
            # Remove jobs older than 90 days
            cutoff_date = (datetime.now() - timedelta(days=90)).isoformat()
            
            conn = db.get_connection() if hasattr(db, 'get_connection') else None
            if conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM jobs WHERE scraped_at < ?", (cutoff_date,))
                deleted_jobs = cursor.rowcount
                
                # Remove old scrape logs (older than 30 days)
                log_cutoff = (datetime.now() - timedelta(days=30)).isoformat()
                cursor.execute("DELETE FROM scrape_logs WHERE started_at < ?", (log_cutoff,))
                deleted_logs = cursor.rowcount
                
                conn.commit()
                conn.close()
                
                logger.info(f"Cleanup completed: {deleted_jobs} old jobs, {deleted_logs} old logs removed")
            
        except Exception as e:
            logger.error(f"Error in data cleanup: {e}")
    
    async def run_scheduler(self):
        """Main scheduler loop"""
        logger.info("Starting job scraping scheduler...")
        
        # Load previous scrape times
        self.load_scrape_times()
        
        # Setup schedule
        self.setup_schedule()
        
        # Initial scrape for high priority companies
        await self.scrape_companies_by_priority("high")
        
        self.is_running = True
        
        try:
            while self.is_running:
                schedule.run_pending()
                await asyncio.sleep(60)  # Check every minute
                
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
        finally:
            self.is_running = False
    
    def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping scheduler...")
        self.is_running = False

async def main():
    """Main function"""
    scheduler = ScrapingScheduler()
    
    try:
        await scheduler.run_scheduler()
    except KeyboardInterrupt:
        logger.info("Scheduler interrupted")
    finally:
        scheduler.stop()

if __name__ == "__main__":
    asyncio.run(main())
