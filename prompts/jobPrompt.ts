interface ApplyJobData {
  resumeText: string
  jobDescription: string
  tone: string
  includeCoverLetter: boolean
  hiringEmail?: string
}

interface ApplyJobEditorData {
  jobDescription: string
  tone: string
  includeCoverLetter: boolean
  hiringEmail?: string
  name: string
  jobTitle: string
  location: string
  email: string
  phone: string
  showSummary: boolean
  summary: string
  experience: any[]
  education: any[]
  skills: any[]
  projects?: any[]
  certificates?: any[]
  languages?: any[]
}

export const applyJobPromptUpload = (data: any) => {
  return `
You are a senior resume strategist and expert job application coach.
You will receive raw extracted resume text and a job description.
Do TWO things in a single response:
1. Parse the resume text and tailor it to the job description
2. Write a professional job application email

## JOB DESCRIPTION
${data.jobDescription}

## RAW RESUME TEXT
${data.resumeText}

## EMAIL DETAILS
- Hiring Email: ${data.hiringEmail && data.hiringEmail.length > 0 ? data.hiringEmail : 'Unknown'}
- Tone: ${data.tone === 'Formal' ? 'Formal and professional' : 'Confident but conversational'}
- Cover Letter Attached: ${data.includeCoverLetter ? 'Yes' : 'No'}

## TASK 1 — RESUME TAILORING RULES

1. **Parse first** — Extract all resume information from the raw text before tailoring. Infer structure from context.

2. **Keyword alignment** — Weave in skills and terminology from the job description naturally. Prioritize exact phrase matches for ATS.

3. **Bullet rewrites** — Every accomplishment must:
   - Open with a strong past-tense action verb (Led, Built, Reduced, Shipped, Drove)
   - Include a measurable outcome where one is clearly implied by the original text
   - Stay under 2 lines
   - Do NOT invent metrics that aren't inferable from the original text

4. **Summary** — Rewrite to mirror the seniority and focus of the job description. Max 3 sentences.

5. **Skills** — Reorder to surface the most job-relevant skills first. Do not add or remove any.

6. **Education** — Do not modify unless the job description explicitly requires a credential check.

7. **Projects** — Rewrite project descriptions same way as experience accomplishments. Prioritize projects using technologies from the job description.

8. **Certifications** — Do not modify name or issuer. Surface relevant ones if they match job requirements.

9. **Achievements** — Do not modify. Return exactly as found in resume text.

10. **Languages** — Do not modify. Return exactly as found in resume text.

## TASK 2 — EMAIL WRITING RULES

1. **Extract from job description** — Pull company name and job title. If not found use sensible defaults.

2. **Extract from resume** — Pull applicant full name, email, phone from raw resume text.

3. **Greeting** — Extract company name from job description and use "Hi [Company Name] Team,"

4. **Subject line** — Format: "Application for [Job Title] - [Full Name]"

5. **Opening line** — State the role and source in one sentence. Do not open with "I am writing to..." or "My name is..."

6. **Pitch paragraph** — 2-3 sentences max. Pull most relevant strengths from experience accomplishments. Tie directly to job description needs. No "I am passionate about..." phrases.

7. **Call to action** — One sentence. Express interest in discussing further. Do not beg or over-thank.

8. **Sign-off** — Use "Best regards," for formal, "Best," for conversational. No name — added in code.

9. **Attachment note** — "Please find my CV${data.includeCoverLetter ? ' and cover letter' : ''} attached."

## THINGS TO NEVER DO
- Do not invent metrics not inferable from the original resume text
- Do not write more than 150 words in the email body
- Do not use phrases like "I am passionate", "I am a hard worker", "To whom it may concern"
- Do not add or remove skills from the resume
- Do NOT use newline characters inside any string value
- Sign-off must be ONLY "Best regards," or "Best," — name added in code
- Each key must appear EXACTLY once in the response

## OUTPUT FORMAT
Return ONE raw JSON object only. No markdown, no backticks, no explanation.
Must be directly parseable by JSON.parse(). Start with { and end with }.
Do NOT include fullEmail — assembled in code.

{
  "resume": {
    "personal": {
      "contactDetails": {
        "fullName": "",
        "email": "",
        "phone": "",
        "location": "",
        "jobTitle": ""
      },
      "onlineLinks": [],
      "summary": ""
    },
    "work": {
      "experiences": [
        {
          "id": 1,
          "company": "",
          "position": "",
          "location": "",
          "startYear": "",
          "endYear": "",
          "accomplishments": []
        }
      ],
      "projects": [
        {
          "id": 1,
          "name": "",
          "description": "",
          "techStack": [],
          "link": "",
          "github": ""
        }
      ]
    },
    "education": {
      "educations": [
        {
          "id": 1,
          "school": "",
          "degree": "",
          "field": "",
          "startYear": "",
          "endYear": "",
          "highlights": []
        }
      ],
      "languages": [
        {
          "id": 1,
          "language": "",
          "proficiency": ""
        }
      ]
    },
    "credentials": {
      "skills": [],
      "certificates": [
        {
          "name": "",
          "issuer": ""
        }
      ],
      "achievements": []
    }
  },
  "email": {
    "subjectLine": "",
    "greeting": "",
    "body": "",
    "callToAction": "",
    "signOff": "",
    "attachmentNote": ""
  }
}
`.trim()
}

export const applyJobPromptEditor = (data: ApplyJobEditorData) => {
  const experience = data.experience ?? []
  const skills = data.skills ?? []
  const education = data.education ?? []
  const projects = data.projects ?? []
  const certificates = data.certificates ?? []
  const languages = data.languages ?? []

  return `
You are a senior resume strategist and expert job application coach.
Using the resume and job description below, do TWO things in a single response:
1. Tailor the resume to the job description
2. Write a professional job application email

## JOB DESCRIPTION
${data.jobDescription}

## CURRENT RESUME

**Name:** ${data.name}
**Title:** ${data.jobTitle}
**Email:** ${data.email}
**Phone:** ${data.phone}
**Location:** ${data.location ?? ''}
${data.showSummary && data.summary ? `\n**Summary:**\n${data.summary}` : ''}

**Experience:**
${
  experience.length > 0
    ? experience.map((exp: any) => `
- Company: ${exp.company}
  Role: ${exp.jobTitle}
  Location: ${exp.location || 'Not specified'}
  Dates: ${exp.startYear || '?'} - ${exp.endYear || 'Present'}
  Bullets:
  ${
    exp.points?.length > 0
      ? exp.points.map((p: string) => `  • ${p}`).join('\n')
      : '  (no bullets provided)'
  }
`).join('\n')
    : 'No experience provided.'
}

**Education:**
${
  education.length > 0
    ? education.map((edu: any) => `
- ${edu.degree} | ${edu.institution} (${edu.startYear ?? ''} - ${edu.endYear ?? ''})${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
`).join('\n')
    : 'No education provided.'
}

**Skills:** ${skills.length > 0 ? skills.join(', ') : 'None listed'}

${projects.length > 0 ? `
**Projects:**
${projects.map((p: any) => `
- ${p.name}: ${p.description}
  ${p.techStack?.length > 0 ? `Stack: ${p.techStack.join(', ')}` : ''}
  ${p.points?.length > 0 ? p.points.map((pt: string) => `  • ${pt}`).join('\n') : ''}
`).join('\n')}
` : ''}

${certificates.length > 0 ? `
**Certifications:**
${certificates.map((c: any) => `- ${c.name} | ${c.issuer}`).join('\n')}
` : ''}

${languages.length > 0 ? `
**Languages:** ${languages.map((l: any) => `${l.language} (${l.proficiency})`).join(', ')}
` : ''}

## EMAIL DETAILS
- Hiring Email: ${data.hiringEmail && data.hiringEmail.length > 0 ? data.hiringEmail : 'Unknown'}
- Tone: ${data.tone === 'Formal' ? 'Formal and professional' : 'Confident but conversational'}
- Cover Letter Attached: ${data.includeCoverLetter ? 'Yes' : 'No'}

## RESUME TEMPLATE OPTIONS
Choose the most suitable template based on the job description and candidate profile:

1. **Classic Professional** - Traditional format with serif fonts. Best for: conservative industries, banking, law, government, formal applications.

2. **Modern Minimalist** - Contemporary design with whitespace and clean lines. Best for: creative professionals, tech startups, marketing, design roles.

3. **Executive Summary** - Powerful format for senior leaders. Best for: C-suite, directors, managers, leadership positions, corporate executives.

4. **Technical Focused** - Developer-friendly with monospace typography. Best for: software engineers, IT, DevOps, data scientists, technical roles.

5. **ATS-Optimized** - Clean, scannable format. Best for: mass applications, large corporations, any role requiring ATS compatibility.

6. **Academic Style** - CV-inspired with serif typography. Best for: researchers, educators, academic positions, PhD candidates.

## TASK 1 — RESUME TAILORING RULES

1. **Keyword alignment** — Weave in skills and terminology from the job description naturally. Prioritize exact phrase matches for ATS.

2. **Bullet rewrites** — Every bullet must:
   - Open with a strong past-tense action verb (Led, Built, Reduced, Shipped, Drove)
   - Include a measurable outcome where one is clearly implied by the original text
   - Stay under 2 lines
   - Do NOT invent metrics that aren't inferable from the original bullet

3. **Summary** — Rewrite to mirror the seniority and focus of the job description. Max 3 sentences.

4. **Skills** — Reorder to surface the most job-relevant skills first. Do not add or remove any.

5. **Education** — Do not modify unless the job description explicitly requires a credential check.

6. **Projects** — Rewrite project bullets same way as experience. Prioritize projects using technologies from the job description.

7. **Certifications** — Do not modify. Surface relevant ones if they match job requirements.

8. **Languages** — Do not modify. Return exactly as provided.

## TASK 2 — EMAIL WRITING RULES

1. **Extract from job description** — Pull company name and job title.

2. **Greeting** — Extract company name from job description and use "Hi [Company Name] Team,"

3. **Subject line** — Format: "Application for [Job Title] - [Full Name]"

4. **Opening line** — State the role and source in one sentence. Do not open with "I am writing to..." or "My name is..."

5. **Pitch paragraph** — 2-3 sentences max. Pull most relevant strengths from experience bullets. Tie directly to job description needs. No "I am passionate about..." phrases.

6. **Call to action** — One sentence. Express interest in discussing further. Do not beg or over-thank.

7. **Sign-off** — Use "Best regards," for formal, "Best," for conversational. No name — added in code.

8. **Attachment note** — "Please find my CV${data.includeCoverLetter ? ' and cover letter' : ''} attached."

## THINGS TO NEVER DO
- Do not invent metrics not inferable from the original bullets
- Do not write more than 150 words in the email body
- Sign-off must be ONLY "Best regards," or "Best," — name added in code
- Do not use phrases like "I am passionate", "I am a hard worker", "To whom it may concern"
- Do not add or remove skills from the resume
- Do NOT use newline characters inside any string value
- Each key must appear EXACTLY once in the response

## OUTPUT FORMAT
Return ONE raw JSON object only. No markdown, no backticks, no explanation.
Must be directly parseable by JSON.parse(). Start with { and end with }.
Do NOT include fullEmail — assembled in code.

{
  "resume": {
    "personal": {
      "contactDetails": {
        "fullName": "",
        "email": "",
        "phone": "",
        "location": "",
        "jobTitle": ""
      },
      "onlineLinks": [],
      "summary": ""
    },
    "work": {
      "experiences": [
        {
          "id": 1,
          "company": "",
          "position": "",
          "location": "",
          "startYear": "",
          "endYear": "",
          "accomplishments": []
        }
      ],
      "projects": [
        {
          "id": 1,
          "name": "",
          "description": "",
          "techStack": [],
          "link": "",
          "github": ""
        }
      ]
    },
    "education": {
      "educations": [
        {
          "id": 1,
          "school": "",
          "degree": "",
          "field": "",
          "startYear": "",
          "endYear": "",
          "highlights": []
        }
      ],
      "languages": [
        {
          "id": 1,
          "language": "",
          "proficiency": ""
        }
      ]
    },
    "credentials": {
      "skills": [],
      "certificates": [
        {
          "name": "",
          "issuer": ""
        }
      ],
      "achievements": []
    }
  },
  "email": {
    "subjectLine": "",
    "greeting": "",
    "body": "",
    "callToAction": "",
    "signOff": "",
    "attachmentNote": ""
  }
}
`.trim()
}