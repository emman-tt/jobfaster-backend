export const generateTailoringPrompt = data => {
  const experience = data.experience ?? []
  const skills = data.skills ?? []
  const education = data.education ?? []

  return `
You are a senior resume strategist. Tailor the resume below to the job description, optimizing for ATS match and recruiter impact.

## JOB DESCRIPTION
${data.jobDescription}

## CURRENT RESUME

**Name:** ${data.name}
**Title:** ${data.jobTitle}
**Location:** ${data.location ?? ''}
${data.showSummary && data.summary ? `\n**Summary:**\n${data.summary}` : ''}

**Experience:**
${
  experience.length > 0
    ? experience
        .map(
          exp => `
- Company: ${exp.company}
  Role: ${exp.jobTitle}
  Location: ${exp.location || 'Not specified'}
  Dates: ${exp.startYear || '?'} - ${exp.endYear || 'Present'}
  Bullets:
  ${
    exp.points?.length > 0
      ? exp.points.map(p => `  • ${p}`).join('\n')
      : '  (no bullets provided)'
  }
`
        )
        .join('\n')
    : 'No experience provided.'
}

**Education:**
${
  education.length > 0
    ? education
        .map(
          edu => `
- ${edu.degree} | ${edu.institution} (${edu.startYear ?? ''} - ${
            edu.endYear ?? ''
          })${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
`
        )
        .join('\n')
    : 'No education provided.'
}

**Skills:** ${skills.length > 0 ? skills.join(', ') : 'None listed'}

## TAILORING RULES

1. **Keyword alignment** — Weave in skills and terminology from the job description naturally. Prioritize exact phrase matches for ATS.

2. **Bullet rewrites** — Every bullet must:
   - Open with a strong past-tense action verb (Led, Built, Reduced, Shipped, Drove)
   - Include a measurable outcome where one is clearly implied by the original text
   - Stay under 2 lines
   -  Do NOT invent metrics that aren't inferable from the original bullet

3. **Summary** — Rewrite to mirror the seniority and focus of the job description. Max 3 sentences.

4. **Skills** — Reorder to surface the most job-relevant skills first. Do not add or remove any.

5. **Education** — Do not modify unless the job description explicitly requires a credential check.

## OUTPUT SCHEMA
Return ONLY valid JSON. No explanation, no markdown fences. Start with { and end with }.

{
  "name": "",
  "jobTitle": "",
  "location": "",
  "summary": "",
  "education": [
    { "institution": "", "degree": "", "startYear": "", "endYear": "", "gpa": "" }
  ],
  "skills": [],
  "experience": [
    { "company": "", "jobTitle": "", "startYear": "", "endYear": "", "location": "", "points": [] }
  ]
}
`.trim()
}
