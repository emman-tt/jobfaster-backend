export const applyJobPrompt = (data: any) => {
  const experience = data.experience ?? [];
  const skills = data.skills ?? [];
  const education = data.education ?? [];

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
**Location:** ${data.location ?? ""}
${data.showSummary && data.summary ? `\n**Summary:**\n${data.summary}` : ""}

**Experience:**
${
  experience.length > 0
    ? experience
        .map(
          (exp: any) => `
- Company: ${exp.company}
  Role: ${exp.jobTitle}
  Location: ${exp.location || "Not specified"}
  Dates: ${exp.startYear || "?"} - ${exp.endYear || "Present"}
  Bullets:
  ${
    exp.points?.length > 0
      ? exp.points.map((p:string) => `  • ${p}`).join("\n")
      : "  (no bullets provided)"
  }
`,
        )
        .join("\n")
    : "No experience provided."
}

**Education:**
${
  education.length > 0
    ? education
        .map(
          (edu:any) => `
- ${edu.degree} | ${edu.instituition} (${edu.startYear ?? ""} - ${edu.endYear ?? ""})${edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
`,
        )
        .join("\n")
    : "No education provided."
}

**Skills:** ${skills.length > 0 ? skills.join(", ") : "None listed"}

## EMAIL DETAILS
- Applicant Email: ${data.email}
- Applicant Phone: ${data.phone}
- Role: ${data.job.title}
- Company: ${data.job.company}
- Source: ${data.job.source}
- Hiring Manager: ${data.job.hiringManager?.length > 0 ? data.job.hiringManager : "Unknown"}
- Tone: ${data.job.tone === "Formal" ? "Formal and professional" : "Confident but conversational"}
- Cover Letter Attached: ${data.job.includeCoverLetter ? "Yes" : "No"}

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

## TASK 2 — EMAIL WRITING RULES

1. **Subject line** — Format: "Application for [Job Title] - [Full Name]". Clear, specific, no fluff.

2. **Opening line** — State the role and where you found it in one sentence. Do not open with "I am writing to..." or "My name is..."

3. **Pitch paragraph** — 2-3 sentences max. Pull the most relevant strengths from the experience bullets above, tie them directly to a need in the job description. Be specific, not generic. No "I am passionate about..." phrases.

4. **Call to action** — One sentence. Express interest in discussing further. Do not beg or over-thank.

5. **Sign-off** — Use "Best regards" for formal, "Best" for conversational. Applicant name only.

6. **Attachment note** — "Please find my CV${data.job.includeCoverLetter ? " and cover letter" : ""} attached."

## THINGS TO NEVER DO
- Do not invent metrics not inferable from the original bullets
- Do not write more than 150 words in the email body
- Sign-off must be ONLY "Best regards," or "Best," — do NOT include the applicant name in signOff, it will be added in code
- Do not use phrases like "I am passionate", "I am a hard worker", "To whom it may concern"
- Do not use the hiring manager name if unknown — use "Hi [Company Name] Team,"
- Do not add or remove skills from the resume
- Do NOT use newline characters inside any string value
- Each key must appear EXACTLY once in the response

## OUTPUT FORMAT
Return ONE raw JSON object only. No markdown, no backticks, no explanation.
Must be directly parseable by JSON.parse(). Start with { and end with }.
Do NOT include fullEmail — it will be assembled in code.

{
  "resume": {
    "name": "",
    "jobTitle": "",
    "location": "",
    "summary": "",
    "education": [
      { "instituition": "", "degree": "", "startYear": "", "endYear": "", "gpa": "" }
    ],
    "skills": [],
    "experience": [
      { "company": "", "jobTitle": "", "startYear": "", "endYear": "", "location": "", "points": [] }
    ]
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
`.trim();
};
