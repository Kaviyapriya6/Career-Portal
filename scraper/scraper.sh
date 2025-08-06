#!/bin/bash
# Job Portal Scraper - Easy wrapper script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_SCRIPT="$SCRIPT_DIR/cli.py"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

# Check if CLI script exists
if [ ! -f "$CLI_SCRIPT" ]; then
    echo -e "${RED}❌ CLI script not found at $CLI_SCRIPT${NC}"
    exit 1
fi

# Function to display header
show_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   🕸️  Job Portal Scraper                     ║"
    echo "║                Production-Ready Scraping Engine             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to show usage
show_usage() {
    show_header
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 <command> [options]"
    echo
    echo -e "${YELLOW}Quick Commands:${NC}"
    echo "  $0 start              - Start scraping all companies"
    echo "  $0 start-safe         - Start scraping with proxy rotation"
    echo "  $0 status             - Show scraping status"
    echo "  $0 companies          - List configured companies"
    echo "  $0 clean              - Clean old data (90+ days)"
    echo "  $0 setup              - Initial setup and validation"
    echo
    echo -e "${YELLOW}Advanced Commands:${NC}"
    echo "  $0 scrape <companies> - Scrape specific companies"
    echo "  $0 export             - Export jobs to JSON"
    echo "  $0 logs               - Show detailed logs"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 scrape Google Microsoft Apple"
    echo "  $0 export --format csv --output jobs.csv"
    echo "  $0 clean --days 30"
}

# Function to run CLI with proper error handling
run_cli() {
    cd "$SCRIPT_DIR"
    python3 "$CLI_SCRIPT" "$@"
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}❌ Command failed with exit code $exit_code${NC}"
    fi
    
    return $exit_code
}

# Parse command
case "${1:-help}" in
    "start")
        show_header
        echo -e "${GREEN}🚀 Starting scraping for all companies...${NC}"
        run_cli scrape --all
        ;;
    
    "start-safe")
        show_header
        echo -e "${GREEN}🚀 Starting safe scraping with proxy rotation...${NC}"
        run_cli scrape --all --with-proxies --max-concurrent 2
        ;;
    
    "status")
        show_header
        run_cli status --detailed
        ;;
    
    "companies")
        show_header
        run_cli list
        ;;
    
    "clean")
        show_header
        echo -e "${YELLOW}🧹 Cleaning old data...${NC}"
        run_cli clean --days 90
        ;;
    
    "export")
        show_header
        echo -e "${BLUE}📤 Exporting jobs data...${NC}"
        OUTPUT_FILE="jobs_export_$(date +%Y%m%d_%H%M%S).json"
        run_cli export --format json --output "$OUTPUT_FILE"
        ;;
    
    "logs")
        show_header
        run_cli status --detailed
        ;;
    
    "setup")
        show_header
        echo -e "${BLUE}⚙️  Setting up job scraper...${NC}"
        
        # Check configuration
        run_cli config --validate
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Setup complete! You can now run scraping commands.${NC}"
            echo
            echo -e "${YELLOW}Quick start:${NC}"
            echo "  $0 start              # Start scraping"
            echo "  $0 status             # Check status"
        else
            echo -e "${RED}❌ Setup failed. Please check configuration files.${NC}"
        fi
        ;;
    
    "scrape")
        if [ $# -lt 2 ]; then
            echo -e "${RED}❌ Please specify companies to scrape${NC}"
            echo "Example: $0 scrape Google Microsoft"
            exit 1
        fi
        
        shift # Remove 'scrape' from arguments
        show_header
        echo -e "${GREEN}🎯 Scraping specific companies: $*${NC}"
        run_cli scrape --companies "$@"
        ;;
    
    "help"|"-h"|"--help")
        show_usage
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo
        show_usage
        exit 1
        ;;
esac
