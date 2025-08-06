#!/usr/bin/env python3
"""
Job Scraper CLI - Command line interface for the job scraping engine
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from typing import List, Optional

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper import JobScraper, Company, ProxyConfig, load_companies_from_json, load_proxies_from_json, DatabaseManager

def create_parser():
    """Create command line argument parser"""
    parser = argparse.ArgumentParser(
        description="Job Portal Scraping Engine CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py scrape --companies Google Microsoft
  python cli.py scrape --all --with-proxies
  python cli.py status
  python cli.py clean --days 30
  python cli.py export --format json --output jobs.json
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Scrape command
    scrape_parser = subparsers.add_parser('scrape', help='Start scraping jobs')
    scrape_parser.add_argument('--companies', nargs='+', help='Specific companies to scrape')
    scrape_parser.add_argument('--all', action='store_true', help='Scrape all configured companies')
    scrape_parser.add_argument('--with-proxies', action='store_true', help='Use proxy rotation')
    scrape_parser.add_argument('--max-concurrent', type=int, default=3, help='Max concurrent scrapes')
    scrape_parser.add_argument('--output', help='Output file for results')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show scraping status and statistics')
    status_parser.add_argument('--detailed', action='store_true', help='Show detailed statistics')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List configured companies')
    list_parser.add_argument('--format', choices=['table', 'json'], default='table', help='Output format')
    
    # Clean command
    clean_parser = subparsers.add_parser('clean', help='Clean old data')
    clean_parser.add_argument('--days', type=int, default=90, help='Remove jobs older than N days')
    clean_parser.add_argument('--logs', action='store_true', help='Also clean scrape logs')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export jobs data')
    export_parser.add_argument('--format', choices=['json', 'csv'], default='json', help='Export format')
    export_parser.add_argument('--output', required=True, help='Output file')
    export_parser.add_argument('--company', help='Filter by company')
    export_parser.add_argument('--days', type=int, help='Jobs from last N days')
    
    # Config command
    config_parser = subparsers.add_parser('config', help='Manage configuration')
    config_parser.add_argument('--show', action='store_true', help='Show current configuration')
    config_parser.add_argument('--validate', action='store_true', help='Validate configuration files')
    
    return parser

async def scrape_command(args):
    """Handle scrape command"""
    print("🕸️  Starting job scraping...")
    
    # Load companies
    if args.all:
        companies = load_companies_from_json('companies.json')
        if not companies:
            print("❌ No companies found in companies.json")
            return 1
    elif args.companies:
        all_companies = load_companies_from_json('companies.json')
        companies = [c for c in all_companies if c.name in args.companies]
        if not companies:
            print(f"❌ No matching companies found for: {args.companies}")
            return 1
    else:
        print("❌ Please specify --all or --companies")
        return 1
    
    # Load proxies if requested
    proxies = []
    if args.with_proxies:
        proxies = load_proxies_from_json('proxies.json')
        if proxies:
            print(f"🔄 Loaded {len(proxies)} proxy configurations")
        else:
            print("⚠️  No proxies found, proceeding without proxy rotation")
    
    print(f"🎯 Scraping {len(companies)} companies...")
    
    # Run scraping
    results = {}
    try:
        async with JobScraper(companies, proxies) as scraper:
            results = await scraper.scrape_all_companies()
        
        # Display results
        total_jobs = 0
        for company_name, jobs in results.items():
            job_count = len(jobs)
            total_jobs += job_count
            status = "✅" if job_count > 0 else "⚠️"
            print(f"{status} {company_name}: {job_count} jobs")
        
        print(f"\n🎉 Scraping completed! Total jobs found: {total_jobs}")
        
        # Save results if output specified
        if args.output:
            all_jobs = []
            for jobs in results.values():
                all_jobs.extend([job.__dict__ for job in jobs])
            
            with open(args.output, 'w') as f:
                json.dump(all_jobs, f, indent=2, default=str)
            print(f"💾 Results saved to {args.output}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Scraping failed: {e}")
        return 1

def status_command(args):
    """Handle status command"""
    print("📊 Job Scraping Status")
    print("=" * 50)
    
    try:
        db = DatabaseManager()
        
        # Get basic statistics
        import sqlite3
        conn = sqlite3.connect(db.db_path)
        cursor = conn.cursor()
        
        # Total jobs
        cursor.execute("SELECT COUNT(*) FROM jobs")
        total_jobs = cursor.fetchone()[0]
        
        # Jobs by company
        cursor.execute("SELECT company, COUNT(*) FROM jobs GROUP BY company ORDER BY COUNT(*) DESC")
        jobs_by_company = cursor.fetchall()
        
        # Recent activity
        cursor.execute("SELECT COUNT(*) FROM jobs WHERE scraped_at > datetime('now', '-24 hours')")
        jobs_last_24h = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM jobs WHERE scraped_at > datetime('now', '-7 days')")
        jobs_last_week = cursor.fetchone()[0]
        
        # Scrape logs
        cursor.execute("SELECT COUNT(*) FROM scrape_logs WHERE status = 'success' AND completed_at > datetime('now', '-24 hours')")
        successful_scrapes_24h = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM scrape_logs WHERE status = 'failed' AND completed_at > datetime('now', '-24 hours')")
        failed_scrapes_24h = cursor.fetchone()[0]
        
        conn.close()
        
        # Display statistics
        print(f"📈 Total Jobs: {total_jobs:,}")
        print(f"🆕 Last 24 hours: {jobs_last_24h:,}")
        print(f"📅 Last 7 days: {jobs_last_week:,}")
        print(f"✅ Successful scrapes (24h): {successful_scrapes_24h}")
        print(f"❌ Failed scrapes (24h): {failed_scrapes_24h}")
        
        if args.detailed and jobs_by_company:
            print(f"\n🏢 Jobs by Company:")
            for company, count in jobs_by_company[:10]:  # Top 10
                print(f"   {company}: {count:,}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error getting status: {e}")
        return 1

def list_command(args):
    """Handle list command"""
    try:
        companies = load_companies_from_json('companies.json')
        
        if args.format == 'json':
            print(json.dumps([{
                'name': c.name,
                'career_url': c.career_url,
                'rate_limit': c.rate_limit
            } for c in companies], indent=2))
        else:
            print("📋 Configured Companies")
            print("=" * 50)
            for i, company in enumerate(companies, 1):
                print(f"{i:2d}. {company.name}")
                print(f"    URL: {company.career_url}")
                print(f"    Rate limit: {company.rate_limit}s")
                print()
        
        return 0
        
    except Exception as e:
        print(f"❌ Error listing companies: {e}")
        return 1

def clean_command(args):
    """Handle clean command"""
    print(f"🧹 Cleaning data older than {args.days} days...")
    
    try:
        db = DatabaseManager()
        import sqlite3
        from datetime import timedelta
        
        conn = sqlite3.connect(db.db_path)
        cursor = conn.cursor()
        
        # Calculate cutoff date
        cutoff_date = (datetime.now() - timedelta(days=args.days)).isoformat()
        
        # Clean old jobs
        cursor.execute("SELECT COUNT(*) FROM jobs WHERE scraped_at < ?", (cutoff_date,))
        jobs_to_delete = cursor.fetchone()[0]
        
        cursor.execute("DELETE FROM jobs WHERE scraped_at < ?", (cutoff_date,))
        
        deleted_logs = 0
        if args.logs:
            cursor.execute("SELECT COUNT(*) FROM scrape_logs WHERE started_at < ?", (cutoff_date,))
            logs_to_delete = cursor.fetchone()[0]
            
            cursor.execute("DELETE FROM scrape_logs WHERE started_at < ?", (cutoff_date,))
            deleted_logs = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"✅ Cleanup completed:")
        print(f"   🗑️  Deleted {jobs_to_delete} old jobs")
        if args.logs:
            print(f"   📝 Deleted {deleted_logs} old logs")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        return 1

def export_command(args):
    """Handle export command"""
    print(f"📤 Exporting jobs to {args.output}...")
    
    try:
        db = DatabaseManager()
        import sqlite3
        import csv
        from datetime import timedelta
        
        conn = sqlite3.connect(db.db_path)
        cursor = conn.cursor()
        
        # Build query
        query = "SELECT * FROM jobs WHERE 1=1"
        params = []
        
        if args.company:
            query += " AND company = ?"
            params.append(args.company)
        
        if args.days:
            cutoff_date = (datetime.now() - timedelta(days=args.days)).isoformat()
            query += " AND scraped_at > ?"
            params.append(cutoff_date)
        
        query += " ORDER BY scraped_at DESC"
        
        cursor.execute(query, params)
        jobs = cursor.fetchall()
        
        if args.format == 'json':
            # Get column names
            columns = [description[0] for description in cursor.description]
            
            # Convert to list of dictionaries
            jobs_list = []
            for job in jobs:
                job_dict = dict(zip(columns, job))
                jobs_list.append(job_dict)
            
            with open(args.output, 'w') as f:
                json.dump(jobs_list, f, indent=2, default=str)
                
        elif args.format == 'csv':
            with open(args.output, 'w', newline='') as f:
                writer = csv.writer(f)
                
                # Write header
                columns = [description[0] for description in cursor.description]
                writer.writerow(columns)
                
                # Write data
                writer.writerows(jobs)
        
        conn.close()
        
        print(f"✅ Exported {len(jobs)} jobs to {args.output}")
        return 0
        
    except Exception as e:
        print(f"❌ Error during export: {e}")
        return 1

def config_command(args):
    """Handle config command"""
    if args.show:
        print("⚙️  Configuration Files")
        print("=" * 50)
        
        # Check companies.json
        if os.path.exists('companies.json'):
            companies = load_companies_from_json('companies.json')
            print(f"✅ companies.json: {len(companies)} companies configured")
        else:
            print("❌ companies.json: File not found")
        
        # Check proxies.json
        if os.path.exists('proxies.json'):
            proxies = load_proxies_from_json('proxies.json')
            print(f"✅ proxies.json: {len(proxies)} proxies configured")
        else:
            print("⚠️  proxies.json: File not found (optional)")
        
        # Check database
        if os.path.exists('jobs.db'):
            print("✅ jobs.db: Database exists")
        else:
            print("⚠️  jobs.db: Database will be created on first run")
    
    elif args.validate:
        print("🔍 Validating configuration...")
        
        errors = 0
        
        # Validate companies.json
        try:
            companies = load_companies_from_json('companies.json')
            if not companies:
                print("❌ companies.json: No companies found")
                errors += 1
            else:
                print(f"✅ companies.json: {len(companies)} companies loaded")
                
                # Validate each company
                for i, company in enumerate(companies):
                    if not company.name:
                        print(f"❌ Company {i}: Missing name")
                        errors += 1
                    if not company.career_url:
                        print(f"❌ Company {company.name}: Missing career_url")
                        errors += 1
        except Exception as e:
            print(f"❌ companies.json: {e}")
            errors += 1
        
        # Validate proxies.json (optional)
        try:
            if os.path.exists('proxies.json'):
                proxies = load_proxies_from_json('proxies.json')
                print(f"✅ proxies.json: {len(proxies)} proxies loaded")
        except Exception as e:
            print(f"❌ proxies.json: {e}")
            errors += 1
        
        if errors == 0:
            print("🎉 All configurations are valid!")
        else:
            print(f"⚠️  Found {errors} configuration errors")
        
        return errors
    
    return 0

async def main():
    """Main CLI function"""
    parser = create_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Handle commands
    if args.command == 'scrape':
        return await scrape_command(args)
    elif args.command == 'status':
        return status_command(args)
    elif args.command == 'list':
        return list_command(args)
    elif args.command == 'clean':
        return clean_command(args)
    elif args.command == 'export':
        return export_command(args)
    elif args.command == 'config':
        return config_command(args)
    else:
        print(f"❌ Unknown command: {args.command}")
        return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
