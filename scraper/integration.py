#!/usr/bin/env python3
"""
Database Integration Script - Sync scraped jobs with main PostgreSQL database
"""

import asyncio
import os
import sys
import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper import DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('integration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseIntegrator:
    """
    Integrates scraped job data from SQLite with the main PostgreSQL database
    """
    
    def __init__(self):
        self.sqlite_db = DatabaseManager()
        self.postgres_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': os.getenv('POSTGRES_PORT', '5432'),
            'database': os.getenv('POSTGRES_DB', 'jobportal'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password')
        }
        
        # Company mapping for consistency
        self.company_mapping = {}
        
        # Load company data for mapping
        self.load_company_mapping()
    
    def load_company_mapping(self):
        """Load company mapping from Next.js data"""
        try:
            # Try to load from the main project's company data
            company_data_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'src', 'data', 'companies.ts'
            )
            
            if os.path.exists(company_data_path):
                logger.info("Found company data from main project")
                # For now, we'll use a simple mapping
                # In a real implementation, you'd parse the TypeScript file
                self.company_mapping = {
                    'Google': 'google',
                    'Microsoft': 'microsoft',
                    'Apple': 'apple',
                    'Amazon': 'amazon',
                    'Meta': 'meta',
                    'Netflix': 'netflix',
                    'Spotify': 'spotify',
                    'Uber': 'uber',
                    'Airbnb': 'airbnb',
                    'LinkedIn': 'linkedin'
                }
            else:
                logger.warning("Company data not found, using default mapping")
                
        except Exception as e:
            logger.warning(f"Could not load company mapping: {e}")
    
    def get_sqlite_jobs(self, since_hours: int = 24) -> List[Dict]:
        """Get jobs from SQLite database"""
        try:
            conn = sqlite3.connect(self.sqlite_db.db_path)
            conn.row_factory = sqlite3.Row  # Enable row access by column name
            cursor = conn.cursor()
            
            # Get jobs from the last N hours
            since_time = (datetime.now() - timedelta(hours=since_hours)).isoformat()
            
            cursor.execute("""
                SELECT * FROM jobs 
                WHERE scraped_at > ? 
                ORDER BY scraped_at DESC
            """, (since_time,))
            
            jobs = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            logger.info(f"Retrieved {len(jobs)} jobs from SQLite (last {since_hours} hours)")
            return jobs
            
        except Exception as e:
            logger.error(f"Error retrieving SQLite jobs: {e}")
            return []
    
    def transform_job_data(self, job: Dict) -> Dict:
        """Transform SQLite job data to match PostgreSQL schema"""
        try:
            # Generate a unique ID for the job
            job_id = str(uuid.uuid4())
            
            # Map company name to slug
            company_slug = self.company_mapping.get(job['company'], job['company'].lower().replace(' ', '-'))
            
            # Transform the job data
            transformed = {
                'id': job_id,
                'title': job['title'] or 'Unknown Position',
                'company': job['company'],
                'companySlug': company_slug,
                'location': job['location'] or 'Remote',
                'department': job['department'] or 'Engineering',
                'type': 'Full-time',  # Default type
                'level': 'Mid-level',  # Default level
                'description': job['description'] or 'No description available.',
                'requirements': job['requirements'] or 'Requirements not specified.',
                'benefits': [
                    'Competitive salary',
                    'Health insurance',
                    'Remote work options'
                ],
                'skills': self.extract_skills(job['description'] or '', job['requirements'] or ''),
                'salary': {
                    'min': 80000,
                    'max': 150000,
                    'currency': 'USD'
                },
                'applicationUrl': job.get('job_url', '#'),
                'postedDate': job['scraped_at'],
                'externalId': job['id'],  # Keep reference to original scraper ID
                'sourceUrl': job.get('source_url', '')
            }
            
            return transformed
            
        except Exception as e:
            logger.error(f"Error transforming job data: {e}")
            return None
    
    def extract_skills(self, description: str, requirements: str) -> List[str]:
        """Extract skills from job description and requirements"""
        # Common tech skills to look for
        common_skills = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
            'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MongoDB',
            'Git', 'CI/CD', 'Agile', 'Scrum', 'REST', 'GraphQL', 'HTML',
            'CSS', 'Vue.js', 'Angular', 'C++', 'C#', 'Go', 'Rust',
            'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Linux'
        ]
        
        text = f"{description} {requirements}".lower()
        found_skills = []
        
        for skill in common_skills:
            if skill.lower() in text:
                found_skills.append(skill)
        
        # Return top 10 skills to avoid overwhelming
        return found_skills[:10] if found_skills else ['General']
    
    async def sync_to_postgres(self, jobs: List[Dict]) -> int:
        """Sync jobs to PostgreSQL database (simulated for now)"""
        if not jobs:
            return 0
        
        # For this demo, we'll save to a JSON file that could be imported
        # In a real implementation, you'd use a PostgreSQL client like psycopg2
        
        try:
            # Transform jobs
            transformed_jobs = []
            for job in jobs:
                transformed = self.transform_job_data(job)
                if transformed:
                    transformed_jobs.append(transformed)
            
            # Save to JSON file for import
            output_file = f"jobs_for_import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(output_file, 'w') as f:
                json.dump(transformed_jobs, f, indent=2, default=str)
            
            logger.info(f"✅ Transformed and saved {len(transformed_jobs)} jobs to {output_file}")
            logger.info(f"📄 You can import this file into your PostgreSQL database")
            
            # Also create SQL insert statements
            sql_file = f"jobs_import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
            self.generate_sql_inserts(transformed_jobs, sql_file)
            
            return len(transformed_jobs)
            
        except Exception as e:
            logger.error(f"Error syncing to PostgreSQL: {e}")
            return 0
    
    def generate_sql_inserts(self, jobs: List[Dict], filename: str):
        """Generate SQL INSERT statements for PostgreSQL"""
        try:
            with open(filename, 'w') as f:
                f.write("-- Job Portal - Scraped Jobs Import\n")
                f.write("-- Generated on " + datetime.now().isoformat() + "\n\n")
                
                for job in jobs:
                    # Escape single quotes in strings
                    def escape_sql(value):
                        if isinstance(value, str):
                            return value.replace("'", "''")
                        return value
                    
                    sql = f"""
INSERT INTO "Job" (
    id, title, company, "companySlug", location, department, type, level,
    description, requirements, benefits, skills, salary, "applicationUrl",
    "postedDate", "externalId", "sourceUrl"
) VALUES (
    '{job['id']}',
    '{escape_sql(job['title'])}',
    '{escape_sql(job['company'])}',
    '{job['companySlug']}',
    '{escape_sql(job['location'])}',
    '{escape_sql(job['department'])}',
    '{job['type']}',
    '{job['level']}',
    '{escape_sql(job['description'][:500])}...',
    '{escape_sql(job['requirements'][:500])}...',
    '{json.dumps(job['benefits'])}',
    '{json.dumps(job['skills'])}',
    '{json.dumps(job['salary'])}',
    '{job['applicationUrl']}',
    '{job['postedDate']}',
    '{job['externalId']}',
    '{job['sourceUrl']}'
) ON CONFLICT (id) DO NOTHING;
"""
                    f.write(sql)
                
                f.write(f"\n-- Total jobs: {len(jobs)}\n")
            
            logger.info(f"📄 Generated SQL insert statements in {filename}")
            
        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
    
    async def run_integration(self, hours: int = 24) -> Dict:
        """Run the integration process"""
        logger.info(f"🔄 Starting database integration (last {hours} hours)")
        
        try:
            # Get jobs from SQLite
            sqlite_jobs = self.get_sqlite_jobs(hours)
            
            if not sqlite_jobs:
                logger.info("ℹ️ No new jobs found to sync")
                return {
                    'success': True,
                    'jobs_processed': 0,
                    'jobs_synced': 0,
                    'message': 'No new jobs to sync'
                }
            
            # Sync to PostgreSQL
            synced_count = await self.sync_to_postgres(sqlite_jobs)
            
            result = {
                'success': True,
                'jobs_processed': len(sqlite_jobs),
                'jobs_synced': synced_count,
                'message': f'Successfully processed {synced_count} jobs'
            }
            
            logger.info(f"✅ Integration completed: {result['message']}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Integration failed: {e}")
            return {
                'success': False,
                'jobs_processed': 0,
                'jobs_synced': 0,
                'error': str(e)
            }

async def main():
    """Main integration function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Database Integration Tool")
    parser.add_argument('--hours', type=int, default=24, help='Sync jobs from last N hours')
    parser.add_argument('--test', action='store_true', help='Run in test mode')
    
    args = parser.parse_args()
    
    integrator = DatabaseIntegrator()
    
    if args.test:
        logger.info("🧪 Running in test mode")
        # Create some test data
        test_job = {
            'id': 'test_123',
            'title': 'Senior Software Engineer',
            'company': 'Google',
            'location': 'Mountain View, CA',
            'department': 'Engineering',
            'description': 'Work on cutting-edge technology...',
            'requirements': 'BS/MS in Computer Science, 5+ years experience...',
            'job_url': 'https://careers.google.com/jobs/123',
            'scraped_at': datetime.now().isoformat(),
            'source_url': 'https://careers.google.com'
        }
        
        result = await integrator.sync_to_postgres([test_job])
        print(f"Test result: {result} job(s) processed")
    else:
        result = await integrator.run_integration(args.hours)
        print(f"Integration result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
