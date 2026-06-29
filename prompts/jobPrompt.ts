

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

1. **Extract from job description** — Pull the job title and company name and place them in email.jobTitle and email.companyName respectively. If not found, use sensible defaults like "Role" for jobTitle or "Company" for companyName.

2. **Extract from resume** — Pull applicant full name, email, phone from raw resume text.

3. **Greeting** — Extract company name from job description and use "Hi [Company Name] Team,"

4. **Subject line** — Format: "Application for [Job Title] - [Full Name]"

5. **Opening line** — State the role and source in one sentence. Must include the exact job title and company name (e.g., "I'm applying for the Senior Developer position at [Company Name]"). Do not open with "I am writing to..." or "My name is..."

6. **Pitch paragraph** — 2-3 sentences max. Pull most relevant strengths from experience accomplishments. Tie directly to job description needs. Reference the company by name. No "I am passionate about..." phrases.

7. **Call to action** — One sentence. Express interest in discussing further. Do not beg or over-thank.

8. **Sign-off** — Use "Best regards," for formal, "Best," for conversational. No name — added in code.

9. **Attachment note** — "Please find my CV${data.includeCoverLetter ? ' and cover letter' : ''} attached."

## TEMPLATE SELECTION
Based on the job description above (industry, role, seniority) and the resume content, choose the SINGLE best matching template. Do NOT default to "technical" — match the actual industry.

1. **ats** - Clean, scannable. Best for: mass applications, large corporations.
2. **classic** - Traditional serif fonts. Best for: banking, law, government, conservative industries.
3. **modern** - Contemporary with whitespace. Best for: tech startups, creative, marketing, design.
4. **corporate** - Formal business-oriented. Best for: Fortune 500, banking, consulting, legal.
5. **executive** - Powerful for leaders. Best for: C-suite, directors, managers, corporate executives.
6. **compact** - Efficient one-page optimized. Best for: early-career, concise applications.
7. **academic** - Serif CV-style. Best for: researchers, educators, academic positions.
8. **creative** - Gold decorative accents, artistic layout. Best for: designers, artists, creative professionals.
9. **startup** - Metrics and traction focused. Best for: founders, startup employees, venture capital.
10. **freelance** - Project and client focused. Best for: freelancers, contractors, consultants.
11. **sidebar** - Classic two-column sidebar layout. Best for: professional clean layout, easy scanning.
12. **elegant** - Sophisticated minimal with decorative lines. Best for: luxury, fashion, publishing.
13. **sales** - Results-oriented with metrics emphasis. Best for: sales, marketing, business development.
14. **healthcare** - Clean professional. Best for: doctors, nurses, pharmacists, clinical roles.
15. **design** - Visual-focused. Best for: UI/UX designers, graphic designers, creative directors.
16. **technical** - Monospace typography. Best for: software engineers, IT, DevOps, data scientists.
17. **graduate** - Education-first. Best for: recent graduates, students, internships, entry-level.
18. **international** - European-style CV with sidebar. Best for: international applications, global companies.
19. **military** - Structured achievement-focused. Best for: military veterans transitioning to civilian.
20. **bold** - Eye-catching high-impact. Best for: creative industries, standing out.

## THINGS TO NEVER DO
- You MUST choose a template from the list above — do not skip this
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
  "template": "ats|classic|modern|corporate|executive|compact|academic|creative|startup|freelance|sidebar|elegant|sales|healthcare|design|technical|graduate|international|military|bold",
  "reason": "Brief explanation of why this template was chosen",
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
          "accomplishments": [{ "id": 1, "text": "" }]
        }
      ],
      "projects": [
        {
          "id": 1,
          "name": "",
          "description": "",
          "techStack": [{ "id": 1, "name": "" }],
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
      "skills": [{ "id": 1, "name": "" }],
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
    "jobTitle": "",
    "companyName": "",
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

