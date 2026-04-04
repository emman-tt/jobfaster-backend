export const uploadResumePrompt = rawText => {
  return `
You are a resume parser. Extract all information from the raw resume text below and structure it into a clean JSON object.

## RAW RESUME TEXT
${rawText}

## EXTRACTION RULES

1. **Extract exactly what is written** — do not rewrite, improve, or infer anything not explicitly stated
2. **Empty fields** — if a field is not found in the resume, return an empty string "" or empty array []
3. **Dates** — extract as written, do not reformat
4. **Bullets** — each bullet point becomes a separate string in the points array
5. **Skills** — extract all listed skills, tools, and technologies as a flat array
6. **Languages** — if no proficiency is stated, set proficiency to "Not specified"
7. **GPA** — only include if explicitly stated
8. **Certifications** — extract name, issuer, year, and url if present
9. **Projects** — extract name, description, tech stack, urls, and bullet points if present

## THINGS TO NEVER DO
- Do not add information not present in the resume
- Do not rewrite or improve bullet points
- Do not assume or infer missing fields
- Do not combine separate bullet points into one
- Do NOT use newline characters inside any string value
- Each key must appear EXACTLY once in the response

## OUTPUT FORMAT
Return ONE raw JSON object only. No markdown, no backticks, no explanation.
Must be directly parseable by JSON.parse(). Start with { and end with }.

{
  "name": "",
  "jobTitle": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "experience": [
    {
      "company": "",
      "jobTitle": "",
      "startYear": "",
      "endYear": "",
      "location": "",
      "points": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "startYear": "",
      "endYear": "",
      "gpa": ""
    }
  ],
  "skills": [],
  "projects": [
    {
      "name": "",
      "description": "",
      "url": "",
      "github": "",
      "techStack": [],
      "points": []
    }
  ],
  "certificates": [
    {
      "name": "",
      "issuer": "",
      "year": "",
      "url": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ]
}
`.trim()
}
