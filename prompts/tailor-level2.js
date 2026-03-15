export const generateResumeAnalysisPrompt = resumeText => {
  const essentialGapQuestions = [
    {
      id: 1,
      gap: 'Missing metrics',
      question:
        'Can you add numbers to any achievements? (%, $, time saved, people managed)',
      purpose: 'Add quantifiable impact',
      insight: 'Numbers catch recruiter attention instantly'
    },
    {
      id: 2,
      gap: 'Duties instead of achievements',
      question:
        'What specific RESULTS did you deliver? (not just responsibilities)',
      purpose: 'Transform tasks into accomplishments',
      insight: 'Outcomes matter more than activities'
    },
    {
      id: 3,
      gap: 'Weak action verbs',
      question:
        'Replace passive phrases with stronger verbs? (led, created, improved, designed)',
      purpose: 'Increase impact and energy',
      insight: 'Strong verbs create stronger impressions'
    },
    {
      id: 4,
      gap: 'Skills section too light',
      question: 'What technical and soft skills are missing from your list?',
      purpose: 'Expand keyword match for ATS',
      insight: 'More relevant skills = more interview calls'
    },
    {
      id: 5,
      gap: 'No target role specified',
      question: 'What job titles are you targeting?',
      purpose: 'Tailor resume for specific roles',
      insight: 'Generic resumes get generic results'
    },
    {
      id: 6,
      gap: 'Missing professional summary',
      question: 'Add a 2-line summary highlighting your experience?',
      purpose: 'Give recruiters a quick snapshot',
      insight: 'First 5 seconds determine if they read more'
    },
    {
      id: 7,
      gap: 'Resume too long for experience level',
      question: 'Your resume is [X] pages. Shall we condense to [Y]?',
      purpose: 'Respect recruiter time',
      insight: 'Entry: 1 page, Experienced: 2 pages max'
    },
    {
      id: 8,
      gap: 'Missing contact information',
      question: 'Add phone, email, LinkedIn?',
      purpose: 'Ensure recruiters can reach you',
      insight: 'Missing contact = missed opportunities'
    },
    {
      id: 9,
      gap: 'Dates unclear or missing',
      question: 'Add clear start/end dates for each role?',
      purpose: 'Show clear career progression',
      insight: 'Gaps explained > gaps hidden'
    },
    {
      id: 10,
      gap: 'No relevant projects or volunteer work',
      question: 'Any projects, volunteer work, or side work to add?',
      purpose: 'Fill gaps and show initiative',
      insight: 'Experience comes in many forms'
    }
  ]

  return `
Act as an expert resume reviewer. Analyze my resume and compare it against the essentialGapQuestions array below.

INSTRUCTIONS:
1. Identify which gaps (by ID) exist in my resume based on the criteria in each object
2. Return ONLY an array of objects for the gaps that are MISSING
3. Each returned object MUST contain:
   - id: The gap ID number
   - suggestion: A specific, personalized suggestion for how to fix this gap
   - fixContext: The EXACT sentence/paragraph from my resume that needs fixing (copy it word-for-word)
   - fixLocation: Where in the resume this appears (e.g., "Work Experience - Software Engineer role at Google", "Skills Section", "Education section")

RULES:
- DO NOT explain anything
- DO NOT include gaps that ARE already present
- DO NOT return the full array
- fixContext must be the EXACT text from my resume, not a summary or paraphrase
- Format your response as valid JSON ONLY

REFERENCE ARRAY:
${JSON.stringify(essentialGapQuestions, null, 2)}

MY RESUME:
${resumeText}
`
}
