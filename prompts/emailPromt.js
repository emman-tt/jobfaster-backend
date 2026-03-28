export const generateApplicationEmailPrompt = data => {
  return `
You are an expert job application coach. Write a professional job application email based on the details below.

## APPLICANT DETAILS
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone}

## APPLICATION DETAILS
- Role: ${data.job.title}
- Company: ${data.job.company}
- Source: ${data.job.source}
${
  data.job.hiringManager.length > 0
    ? `- Hiring Manager: ${data.job.hiringManager}`
    : '- Hiring Manager: Unknown'
}

## CONTEXT
**Job Description Summary:**
${data.job.description}


**Applicant's Relevant Strengths for This Role:**
${data.experience
  .flatMap(exp =>
    (exp.points ?? []).map(p => ({
      point: p,
      role: exp.jobTitle,
      company: exp.company
    }))
  )
  .slice(0, 5)
  .map((item, i) => `${i + 1}. [${item.role} at ${item.company}] ${item.point}`)
  .join('\n')}




## TONE
${
  data.job.tone == 'Formal'
    ? 'Write formally and professionally.'
    : 'Write in a confident but conversational tone — professional without being stiff.'
}

## EMAIL WRITING RULES

1. **Subject line** — Format: "Application for [Job Title] - [Full Name]". Clear, specific, no fluff.

2. **Opening line** — State the role and where you found it in one sentence. Do not open with "I am writing to..." or "My name is..."

3. **Pitch paragraph** — 2-3 sentences max. Lead with the most relevant strength, tie it directly to a need in the job description. Be specific, not generic. No "I am passionate about..." phrases.

5. **Call to action** — One sentence. Express interest in discussing further. Do not beg or over-thank.

6. **Sign-off** — Use "Best regards" for formal, "Best" for conversational. 
   applicant name only. No phone, no email, no links.

7. **Attachment note** — End with a brief line noting attachments: "Please find my CV${
    data.job.includeCoverLetter ? ' and cover letter' : ''
  } attached."

## THINGS TO NEVER DO
- Do not write more than 150 words in the body (excluding subject and sign-off)
- Do not summarize the entire CV
- Do not use phrases like "I am passionate", "I am a hard worker", "To whom it may concern"
- Do not invent company facts or metrics not provided
- Do not use the hiring manager name if it wasn't provided — use "Hi [Company Name] Team,"

## OUTPUT FORMAT
Return a JSON object only. No explanation outside it. Start with { and end with }.

{
  "subjectLine": "",
  "greeting": "",
  "body": "",
  "callToAction": "",
  "signOff": "",
  "attachmentNote": "",
  "fullEmail": ""
}

The "fullEmail" field should be the complete assembled email as a single string with line breaks, ready to copy-paste.
  `.trim()
}
