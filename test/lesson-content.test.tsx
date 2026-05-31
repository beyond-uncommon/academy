import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LessonContent } from '@/app/(app)/lesson/components/LessonContent'

describe('LessonContent', () => {
    it('shows no content message when content is null', () => {
        render(<LessonContent type="text" content={null} />)
        expect(screen.getByText('No content available for this lesson.')).toBeInTheDocument()
    })

    it('renders video iframe when type is video and video_url provided', () => {
        const { container } = render(
            <LessonContent
                type="video"
                content={{ video_url: 'https://example.com/video' }}
            />
        )
        const iframe = container.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('src', 'https://example.com/video')
    })

    it('shows coming soon message when video type has no video_url', () => {
        render(<LessonContent type="video" content={{}} />)
        expect(screen.getByText('Video coming soon')).toBeInTheDocument()
    })

    it('renders text content for text-type lessons', () => {
        render(
            <LessonContent
                type="text"
                content={{ text_content: 'Hello World' }}
            />
        )
        expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('renders markdown in text content', () => {
        render(
            <LessonContent
                type="text"
                content={{ text_content: '# Heading\n\nParagraph' }}
            />
        )
        expect(screen.getByRole('heading', { level: 1, name: 'Heading' })).toBeInTheDocument()
        expect(screen.getByText('Paragraph')).toBeInTheDocument()
    })

    it('renders lesson notes section', () => {
        render(
            <LessonContent
                type="video"
                content={{
                    video_url: 'https://example.com/video',
                    notes: 'Some important notes'
                }}
            />
        )
        expect(screen.getByText('Lesson notes')).toBeInTheDocument()
        expect(screen.getByText('Some important notes')).toBeInTheDocument()
    })

    it('renders project brief section', () => {
        render(
            <LessonContent
                type="project"
                content={{ brief: 'Build something great' }}
            />
        )
        expect(screen.getByText('Project brief')).toBeInTheDocument()
        expect(screen.getByText('Build something great')).toBeInTheDocument()
    })

    it('shows fallback message when content has no renderable fields', () => {
        render(<LessonContent type="text" content={{}} />)
        expect(screen.getByText('No content available for this lesson.')).toBeInTheDocument()
    })

    it('shows fallback message for interactive type with empty content', () => {
        render(<LessonContent type="interactive" content={{}} />)
        expect(screen.getByText('No content available for this lesson.')).toBeInTheDocument()
    })

    it('does not show fallback message when text_content is present', () => {
        render(
            <LessonContent
                type="text"
                content={{ text_content: 'Valid content' }}
            />
        )
        expect(screen.queryByText('No content available for this lesson.')).not.toBeInTheDocument()
    })
})
