import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚨 DEPRECATED: This script used FAKE/MOCK data!')
  console.log('')
  console.log('✅ Use the REAL scraper instead:')
  console.log('   npm run db:scrape')
  console.log('')
  console.log('🔥 The real scraper extracts actual job data from 500+ company career pages')
  console.log('⚡ No more fake/mock/sample data - only REAL jobs!')
  console.log('')
  console.log('Exiting... Please run: npm run db:scrape')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
