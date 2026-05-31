import { describe, it, expect } from 'vitest'
import { buildCurriculumContext } from '@/lib/ai/generate-questions'

describe('buildCurriculumContext', () => {
    it('returns empty string for empty params', () => {
        const result = buildCurriculumContext({ lessons: [] })
        expect(result).toBe('')
    })

    it('includes course title when provided', () => {
        const result = buildCurriculumContext({
            courseTitle: 'UX Design',
            lessons: [],
        })
        expect(result).toContain('Course: UX Design')
    })

    it('includes course description when provided', () => {
        const result = buildCurriculumContext({
            courseDescription: 'Learn the basics',
            lessons: [],
        })
        expect(result).toContain('Course Description: Learn the basics')
    })

    it('includes module title when provided', () => {
        const result = buildCurriculumContext({
            moduleTitle: 'Module 1',
            lessons: [],
        })
        expect(result).toContain('Module: Module 1')
    })

    it('includes lesson details with type', () => {
        const result = buildCurriculumContext({
            courseTitle: 'Test Course',
            lessons: [
                { title: 'Lesson 1', type: 'video', contentNotes: 'Notes here' },
            ],
        })
        expect(result).toContain('Lesson: Lesson 1 (video)')
        expect(result).toContain('Notes here')
    })

    it('includes contentBody when provided', () => {
        const result = buildCurriculumContext({
            lessons: [
                { title: 'Intro', contentBody: 'Body text' },
            ],
        })
        expect(result).toContain('Body text')
    })

    it('defaults lesson type to text when not provided', () => {
        const result = buildCurriculumContext({
            lessons: [
                { title: 'Generic Lesson' },
            ],
        })
        expect(result).toContain('(text)')
    })

    it('truncates output to 15000 characters', () => {
        const longBody = 'x'.repeat(20000)
        const result = buildCurriculumContext({
            lessons: [
                { title: 'Long', contentBody: longBody },
            ],
        })
        expect(result.length).toBeLessThanOrEqual(15000)
    })

    it('handles multiple lessons', () => {
        const result = buildCurriculumContext({
            courseTitle: 'Course',
            lessons: [
                { title: 'Lesson A', contentNotes: 'Notes A' },
                { title: 'Lesson B', contentNotes: 'Notes B' },
                { title: 'Lesson C', contentNotes: 'Notes C' },
            ],
        })
        expect(result).toContain('Lesson A')
        expect(result).toContain('Lesson B')
        expect(result).toContain('Lesson C')
        expect(result).toContain('Notes A')
        expect(result).toContain('Notes B')
        expect(result).toContain('Notes C')
    })
})
