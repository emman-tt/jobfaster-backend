export const uploadResumePrompt = (rawText: string) => {
  return `
You are a resume parser. Extract all information from the raw resume text below and structure it into a clean JSON object.

## RAW RESUME TEXT
${rawText}

## EXTRACTION RULES

1. **Extract exactly what is written** — do not rewrite, improve, or infer anything not explicitly stated
2. **Empty fields** — if a field is not found in the resume, return an empty string "" or empty array []
3. **Dates** — extract as written, do not reformat
4. **Bullets** — each bullet point becomes an object in the `accomplishments` array. Each object must have an `id` (unique integer per entry) and `text` (the bullet text).
5. **Skills** — extract all listed skills, tools, and technologies as an array of objects. Each object must have an `id` (unique integer per skill) and `name` (the skill name).
7. **GPA** — only include if explicitly stated
8. **Certifications** — extract name, issuer, year, and url if present
9. **Languages** — extract language names as a flat array of strings
10. **Projects** — extract name, description, tech stack (as array of `{ id, name }` objects), urls, and bullet points if present

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
      "accomplishments": [{ "id": 1, "text": "" }]
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
  "skills": [{ "id": 1, "name": "" }],
  "projects": [
    {
      "name": "",
      "description": "",
      "url": "",
      "github": "",
      "techStack": [{ "id": 1, "name": "" }],
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
  "languages": []
}
`.trim();
};
