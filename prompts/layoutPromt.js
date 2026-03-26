const Layout = [
  {
    id: 1,
    name: 'Chronological Standard',
    description: 'Traditional layout with dates right-aligned',
    structure: {
      header:
        'Full name centered, title centered below, contact info centered on next line',
      summary: 'Full width paragraph',
      experience:
        'Each job: Company name left, dates right on same line. Job title and location on next line. Bullet points indented below.',
      education: 'Same format as experience',
      skills: 'Bullet points or comma-separated list'
    },
    visual: `
      JOHN SMITH
      Senior Software Engineer
      email | phone | location
      
      WORK EXPERIENCE
      Company Name           2022-Present
      Job Title              Location
      • Bullet point
      • Bullet point
    `
  },
  {
    id: 3,
    name: 'Two-Column Compact',
    description: 'Side-by-side columns for efficient space use',
    structure: {
      header: 'Full name centered, title centered below, contact info centered',
      layout: 'Two equal columns throughout the resume',
      leftColumn:
        'Contains WORK EXPERIENCE with company, title, dates, and bullets',
      rightColumn:
        'Contains EDUCATION, SKILLS, CERTIFICATIONS in stacked sections',
      skills: 'Displayed as tags or comma-separated within column'
    },
    visual: `
      JOHN SMITH
      Senior Software Engineer
      
      ┌───────────────┬───────────────┐
      │ WORK EXPERIENCE│ EDUCATION     │
      │ Company Name   │ University    │
      │ Job Title      │ Degree        │
      │ 2022-Present   │ 2015-2019     │
      │ • Bullet       │               │
      └───────────────┴───────────────┘
    `
  },
  {
    id: 4,
    name: 'Skills-First Layout',
    description: 'Emphasizes skills and achievements',
    structure: {
      header: 'Full name centered, title centered, contact centered',
      summary: 'Brief professional summary paragraph',
      skills: 'Displayed as a grid (3x2 or 3x3) of skill categories',
      achievements: 'Standalone section with 3-4 key achievements',
      experience: 'Minimal table format: Job Title | Company | Dates',
      education: 'Single line format: Degree - University (Year)'
    },
    visual: `
      JOHN SMITH
      Senior Software Engineer
      
      SKILLS GRID
      ┌─────────┬─────────┬─────────┐
      │ Skill1  │ Skill2  │ Skill3  │
      │ Skill4  │ Skill5  │ Skill6  │
      └─────────┴─────────┴─────────┘
      
      KEY ACHIEVEMENTS
      • Major achievement with metrics
      
      WORK HISTORY
      Senior Dev    │ TechCorp  │ 2022-Now
    `
  },
  {
    id: 2,
    name: 'Left-Aligned Distinctive',
    description: 'Contact stacked left, dates left-aligned',
    structure: {
      header: 'Name left-aligned, title below name',
      contact: 'Stacked vertically on left side with icons',
      summary: 'Full width after contact',
      experience:
        'Dates left-aligned in bold, then role, company, location on next lines',
      education: 'Same format as experience'
    },
    visual: `
      JOHN SMITH
      Senior Software Engineer
      
      📍 Location
      📧 Email
      📱 Phone
      
      EXPERIENCE
      2022-Now  SENIOR DEVELOPER
                Company Name, Location
                • Bullet point
    `
  },
  {
    id: 5,
    name: 'Section-Divided Format',
    description: 'Clear section separation with centered dividers',
    structure: {
      header: 'Full name centered, title centered, contact centered',
      sections: 'Each section has centered divider line with section name',
      summary: 'Paragraph between dividers',
      experience:
        'Company - Location format, role with dates in parentheses, bullets below',
      education: 'Same format as experience',
      skills: 'Comma-separated or bullet list'
    },
    visual: `
      JOHN SMITH
      Senior Software Engineer
      
      ────────── SUMMARY ──────────
      Professional summary here.
      
      ────────── EXPERIENCE ───────
      Company - Location
      Role (2022-Present)
      • Bullet point
    `
  }
]
