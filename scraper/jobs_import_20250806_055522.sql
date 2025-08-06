-- Job Portal - Scraped Jobs Import
-- Generated on 2025-08-06T05:55:22.056579


INSERT INTO "Job" (
    id, title, company, "companySlug", location, department, type, level,
    description, requirements, benefits, skills, salary, "applicationUrl",
    "postedDate", "externalId", "sourceUrl"
) VALUES (
    'ace7a60f-80c4-491b-ab61-fb14d77c23a8',
    'Senior Software Engineer',
    'Google',
    'google',
    'Mountain View, CA',
    'Engineering',
    'Full-time',
    'Mid-level',
    'Work on cutting-edge technology......',
    'BS/MS in Computer Science, 5+ years experience......',
    '["Competitive salary", "Health insurance", "Remote work options"]',
    '["General"]',
    '{"min": 80000, "max": 150000, "currency": "USD"}',
    'https://careers.google.com/jobs/123',
    '2025-08-06T05:55:22.056333',
    'test_123',
    'https://careers.google.com'
) ON CONFLICT (id) DO NOTHING;

-- Total jobs: 1
