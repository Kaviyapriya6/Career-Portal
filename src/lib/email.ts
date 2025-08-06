import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Email templates
export const emailTemplates = {
  newJobAlert: (companyName: string, jobTitle: string, jobUrl: string) => ({
    subject: `New Job Alert: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            <i class="fas fa-briefcase" style="margin-right: 8px;"></i>
            New Job Alert
          </h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Great news! A new job matches your interests:</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 20px;">${jobTitle}</h3>
            <p style="color: #64748b; margin: 0 0 15px 0; font-size: 16px;">
              <i class="fas fa-building" style="margin-right: 8px; color: #3b82f6;"></i>
              ${companyName}
            </p>
            
            <a href="${jobUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-top: 10px;">
              <i class="fas fa-external-link-alt" style="margin-right: 8px;"></i>
              View Job Details
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            This job alert was sent because you have ${companyName} in your favorite companies.
            <br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/preferences" style="color: #3b82f6;">
              Manage your email preferences
            </a>
          </p>
        </div>
      </div>
    `,
  }),

  weeklyDigest: (jobs: any[], favoriteCompanies: string[]) => ({
    subject: `Your Weekly Job Digest - ${jobs.length} New Opportunities`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            <i class="fas fa-chart-line" style="margin-right: 8px;"></i>
            Weekly Job Digest
          </h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">This week's highlights:</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin: 0 0 15px 0;">📊 Summary</h3>
            <p style="color: #64748b; margin: 5px 0;">
              <strong>${jobs.length}</strong> new jobs from your favorite companies
            </p>
            <p style="color: #64748b; margin: 5px 0;">
              <strong>${favoriteCompanies.length}</strong> companies you're following
            </p>
          </div>
          
          <h3 style="color: #1e293b; margin: 20px 0 15px 0;">Latest Opportunities:</h3>
          
          ${jobs.slice(0, 5).map(job => `
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #10b981;">
              <h4 style="margin: 0 0 5px 0; color: #1e293b;">${job.title}</h4>
              <p style="margin: 0 0 10px 0; color: #64748b;">
                <i class="fas fa-building" style="margin-right: 5px;"></i>
                ${job.companyName} • ${job.location}
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}" style="color: #10b981; text-decoration: none; font-weight: bold;">
                View Details →
              </a>
            </div>
          `).join('')}
          
          ${jobs.length > 5 ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View All ${jobs.length} Jobs
              </a>
            </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/preferences" style="color: #10b981;">
              Manage your email preferences
            </a>
          </p>
        </div>
      </div>
    `,
  }),

  companyUpdate: (companyName: string, updateType: string, details: string) => ({
    subject: `Update from ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            <i class="fas fa-bell" style="margin-right: 8px;"></i>
            Company Update
          </h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">${companyName} has an update:</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">${updateType}</h3>
            <p style="color: #64748b; margin: 0; line-height: 1.6;">${details}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/companies/${companyName.toLowerCase().replace(/\s+/g, '-')}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Company Profile
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            You're receiving this because you follow ${companyName}.
            <br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/preferences" style="color: #f59e0b;">
              Manage your email preferences
            </a>
          </p>
        </div>
      </div>
    `,
  }),
}

// Queue email for sending
export async function queueEmail({
  to,
  subject,
  html,
  template,
  variables,
  scheduledAt = new Date(),
}: {
  to: string
  subject: string
  html: string
  template?: string
  variables?: any
  scheduledAt?: Date
}) {
  try {
    await prisma.emailQueue.create({
      data: {
        to,
        subject,
        body: html,
        template,
        variables: variables || {},
        scheduledAt,
      }
    })
  } catch (error) {
    console.error('Error queuing email:', error)
    throw error
  }
}

// Send immediate email
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Job Portal" <noreply@jobportal.com>',
      to,
      subject,
      html,
    })

    console.log('Email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Process email queue (call this from a cron job)
export async function processEmailQueue() {
  try {
    const pendingEmails = await prisma.emailQueue.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: new Date(),
        },
        attempts: {
          lt: 3, // Max 3 attempts
        },
      },
      take: 10, // Process 10 emails at a time
    })

    for (const email of pendingEmails) {
      try {
        await sendEmail({
          to: email.to,
          subject: email.subject,
          html: email.body,
        })

        // Mark as sent
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          }
        })
      } catch (error) {
        // Update failed attempt
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            attempts: email.attempts + 1,
            status: email.attempts + 1 >= email.maxAttempts ? 'failed' : 'pending',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          }
        })
      }
    }

    console.log(`Processed ${pendingEmails.length} emails`)
  } catch (error) {
    console.error('Error processing email queue:', error)
  }
}

// Send job alerts for new jobs from favorite companies
export async function sendJobAlerts(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
      }
    })

    if (!job) return

    // Find users who have this company as favorite and want job alerts
    const users = await prisma.user.findMany({
      where: {
        favoriteCompanies: {
          some: {
            companyId: job.companyId,
          }
        },
        emailPreferences: {
          newJobsFromFavorites: true,
        }
      },
      include: {
        emailPreferences: true,
      }
    })

    // Send alert to each user
    for (const user of users) {
      const template = emailTemplates.newJobAlert(
        job.companyName,
        job.title,
        `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}`
      )

      await queueEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        template: 'newJobAlert',
        variables: {
          jobId: job.id,
          companyName: job.companyName,
          jobTitle: job.title,
        }
      })
    }

    console.log(`Queued job alerts for ${users.length} users`)
  } catch (error) {
    console.error('Error sending job alerts:', error)
  }
}

// Send weekly digest emails
export async function sendWeeklyDigest() {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const users = await prisma.user.findMany({
      where: {
        emailPreferences: {
          weeklyJobSummary: true,
        }
      },
      include: {
        favoriteCompanies: {
          include: {
            company: true,
          }
        },
        emailPreferences: true,
      }
    })

    for (const user of users) {
      const favoriteCompanyIds = user.favoriteCompanies.map((fc: any) => fc.companyId)
      const favoriteCompanyNames = user.favoriteCompanies.map((fc: any) => fc.company.name)

      if (favoriteCompanyIds.length === 0) continue

      // Get new jobs from favorite companies
      const newJobs = await prisma.job.findMany({
        where: {
          companyId: {
            in: favoriteCompanyIds,
          },
          createdAt: {
            gte: oneWeekAgo,
          },
          isActive: true,
        },
        include: {
          company: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      })

      if (newJobs.length === 0) continue

      const template = emailTemplates.weeklyDigest(
        newJobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          location: job.location,
        })),
        favoriteCompanyNames
      )

      await queueEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        template: 'weeklyDigest',
        variables: {
          jobCount: newJobs.length,
          favoriteCompanies: favoriteCompanyNames,
        }
      })
    }

    console.log(`Queued weekly digest for ${users.length} users`)
  } catch (error) {
    console.error('Error sending weekly digest:', error)
  }
}
