import OpenAI from 'openai'

interface GeneratedQuestion {
    question: string
    options: { text: string; is_correct: boolean }[]
    explanation: string
}

function getClient(): OpenAI {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY is not set')
    return new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
    })
}

function buildPrompt(context: string, count: number): string {
    return `You are an educational assessment creator. Generate ${count} multiple-choice quiz questions based on the following curriculum content.

Each question must have exactly 4 options, with exactly one correct answer. Include a brief explanation of why the correct answer is right.

Respond with a JSON array only (no markdown, no code fences):
[
  {
    "question": "The question text?",
    "options": [
      { "text": "Option A", "is_correct": false },
      { "text": "Option B", "is_correct": true },
      { "text": "Option C", "is_correct": false },
      { "text": "Option D", "is_correct": false }
    ],
    "explanation": "Why the correct answer is right."
  }
]

Curriculum content:
---
${context}
---`
}

function parseResponse(text: string): GeneratedQuestion[] {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/gm, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) throw new Error('Response is not an array')
    for (const q of parsed) {
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
            throw new Error('Invalid question format in response')
        }
        if (!q.options.some((o: { is_correct: boolean }) => o.is_correct)) {
            throw new Error('Each question must have at least one correct option')
        }
    }
    return parsed
}

export async function generateQuestions(context: string, count = 5): Promise<GeneratedQuestion[]> {
    const client = getClient()
    const prompt = buildPrompt(context, count)

    const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('No response from AI')

    return parseResponse(text)
}

export function buildCurriculumContext(params: {
    courseTitle?: string
    courseDescription?: string
    moduleTitle?: string
    lessons: { title: string; contentNotes?: string; contentBody?: string; type?: string }[]
}): string {
    const parts: string[] = []

    if (params.courseTitle) parts.push(`Course: ${params.courseTitle}`)
    if (params.courseDescription) parts.push(`Course Description: ${params.courseDescription}`)
    if (params.moduleTitle) parts.push(`Module: ${params.moduleTitle}`)

    for (const lesson of params.lessons) {
        parts.push(`\n--- Lesson: ${lesson.title} (${lesson.type || 'text'}) ---`)
        if (lesson.contentNotes) parts.push(lesson.contentNotes)
        if (lesson.contentBody) parts.push(lesson.contentBody)
    }

    return parts.join('\n').slice(0, 15000)
}
