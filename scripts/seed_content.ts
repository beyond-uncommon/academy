import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // MUST use service role for seeding

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// Data Definitions
// ============================================================================

const courseData = {
    title: 'Explorer Crash Course',
    slug: 'explorer-crash-course',
    description: 'A comprehensive 4-week introduction to Product Design thinking, UX research, wireframing, and UI principles.',
    type: 'crash_course',
    phase: 1,
    is_published: true
}

const modulesData = [
    { title: 'Design Fundamentals', order_index: 1, skill_node_id: 'foundations', xp_available: 380 },
    { title: 'UX Research & Ideation', order_index: 2, skill_node_id: 'research_ready', xp_available: 640 },
    { title: 'Wireframing & Prototyping', order_index: 3, skill_node_id: 'prototype_builder', xp_available: 460 },
    { title: 'UI Design & Handoff', order_index: 4, skill_node_id: 'ui_craftsman', xp_available: 810 },
]

const lessonsData = {
    'Design Fundamentals': [
        { title: 'What is Product Design?', type: 'video', duration: 8, xp: 50, order: 1, content: { video_url: 'https://vimeo.com/839075480', notes: 'Welcome to the world of product design.' } },
        { title: 'Design Thinking Process', type: 'video', duration: 10, xp: 50, order: 2, content: { video_url: 'https://vimeo.com/839075480', notes: 'Learn the 5 stages of design thinking.' } },
        { title: 'Understanding Users & Empathy', type: 'video', duration: 12, xp: 60, order: 3, content: { video_url: 'https://vimeo.com/839075480', notes: 'Why empathy is your superpower.' } },
        { title: 'Introduction to Design Systems', type: 'text', duration: 8, xp: 50, order: 4, content: { text_content: '# Design Systems\\n\\nA design system is a collection of reusable components, guided by clear standards, that can be assembled together to build any number of applications.' } },
        { title: 'Typography & Color Basics', type: 'text', duration: 15, xp: 70, order: 5, content: { text_content: '# Typography & Color\\n\\nThe building blocks of visual hierarchy. Choose your typefaces wisely.' } },
    ],
    'UX Research & Ideation': [
        { title: 'User Research Methods Overview', type: 'video', duration: 12, xp: 60, order: 1, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'How to Conduct User Interviews', type: 'text', duration: 15, xp: 70, order: 2, content: { text_content: '# User Interviews\\n\\nAsk open-ended questions. Do not lead the witness.' } },
        { title: 'Affinity Mapping & Synthesis', type: 'video', duration: 10, xp: 70, order: 3, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'User Personas', type: 'text', duration: 12, xp: 60, order: 4, content: { text_content: '# User Personas\\n\\nArchetypes representing your key user segments.' } },
        { title: 'Ideation: Crazy 8s & Sketching', type: 'video', duration: 12, xp: 80, order: 5, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'Project: User Persona', type: 'project', duration: 60, xp: 200, order: 6, content: { brief: 'Create a comprehensive user persona based on the research patterns provided in the lesson materials. Submit a link to your Figma or PDF document.' } },
    ],
    'Wireframing & Prototyping': [
        { title: 'Information Architecture Basics', type: 'text', duration: 10, xp: 60, order: 1, content: { text_content: '# IA\\n\\nOrganizing your app so users do not get lost.' } },
        { title: 'Wireframing Fundamentals', type: 'video', duration: 15, xp: 70, order: 2, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'Low-Fi vs Hi-Fi Prototyping', type: 'video', duration: 10, xp: 60, order: 3, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'Prototyping in Figma (Intro)', type: 'video', duration: 20, xp: 100, order: 4, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'Usability Testing Basics', type: 'text', duration: 12, xp: 70, order: 5, content: { text_content: '# Usability Testing\\n\\nWatch real people use your prototype and learn from their struggle.' } },
    ],
    'UI Design & Handoff': [
        { title: 'UI Design Principles (Gestalt)', type: 'text', duration: 15, xp: 80, order: 1, content: { text_content: '# Gestalt Principles\\n\\nHow the human brain perceives visual elements.' } },
        { title: 'Designing with Components', type: 'video', duration: 15, xp: 80, order: 2, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'Accessibility in UI Design', type: 'text', duration: 12, xp: 70, order: 3, content: { text_content: '# Accessibility\\n\\nDesigning for everyone. Contrast, screen readers, and target sizes.' } },
        { title: 'Design-to-Dev Handoff', type: 'video', duration: 12, xp: 80, order: 4, content: { video_url: 'https://vimeo.com/839075480' } },
        { title: 'Building a Portfolio Case Study', type: 'text', duration: 20, xp: 100, order: 5, content: { text_content: '# Case Studies\\n\\nStorytelling is the key to a great portfolio.' } },
        { title: 'Final Project: Mobile App UI', type: 'project', duration: 90, xp: 300, order: 6, content: { brief: 'Design 3 key screens for a mobile banking application using high-fidelity UI principles. Submit your Figma prototype URL.' } },
    ]
}

const quizzesData = {
    'Design Fundamentals': {
        title: 'Quiz: Design Fundamentals',
        xp_base: 100, xp_bonus_80: 50, xp_bonus_100: 100,
        questions: [
            { q: 'Which stage of Design Thinking focuses on understanding the user?', o: ['Ideate', 'Empathize', 'Prototype', 'Test'], correct: 1 },
            { q: 'What is a core benefit of a Design System?', o: ['Slower development', 'Inconsistent UI', 'Reusability and consistency', 'Bigger file sizes'], correct: 2 },
            { q: 'Typography involves choosing...', o: ['Colors', 'Images', 'Fonts and text layout', 'Animations'], correct: 2 }
        ]
    },
    'UX Research & Ideation': {
        title: 'Quiz: UX Research',
        xp_base: 100, xp_bonus_80: 50, xp_bonus_100: 100,
        questions: [
            { q: 'What is the purpose of a User Persona?', o: ['To look good', 'To represent a user archetype', 'To write code', 'To test colors'], correct: 1 },
            { q: 'Affinity mapping is used to...', o: ['Draw UI', 'Synthesize research data', 'Write CSS', 'Hire designers'], correct: 1 },
            { q: 'Crazy 8s is a method used in which phase?', o: ['Testing', 'Research', 'Ideation', 'Handoff'], correct: 2 }
        ]
    },
    'Wireframing & Prototyping': {
        title: 'Quiz: Wireframing & Prototyping',
        xp_base: 100, xp_bonus_80: 50, xp_bonus_100: 100,
        questions: [
            { q: 'Information Architecture is like...', o: ['Painting a house', 'The blueprint of a house', 'Selling a house', 'Decorating a house'], correct: 1 },
            { q: 'A High-Fidelity prototype...', o: ['Looks like a sketch', 'Is drawn on paper', 'Closely resembles the final product', 'Has no colors'], correct: 2 },
            { q: 'Why do we do Usability Testing?', o: ['To find bugs in code', 'To see if users can complete tasks', 'To test server speed', 'To gather marketing data'], correct: 1 }
        ]
    },
    'UI Design & Handoff': {
        title: 'Quiz: UI Design',
        xp_base: 100, xp_bonus_80: 50, xp_bonus_100: 100,
        questions: [
            { q: 'Gestalt principles explain...', o: ['How databases work', 'How humans perceive visuals', 'How to write React', 'How to manage projects'], correct: 1 },
            { q: 'Which is an accessibility concern?', o: ['Low contrast text', 'Using components', 'Using auto-layout', 'Creating personas'], correct: 0 },
            { q: 'A good case study should focus on...', o: ['Just final visuals', 'Lines of code written', 'The problem, process, and solution', 'The software used'], correct: 2 }
        ]
    }
}

async function seedContent() {
    console.log('🌱 Starting content seed...')

    // 1. Create Course
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .upsert(courseData, { onConflict: 'slug' })
        .select()
        .single()

    if (courseError) throw courseError
    console.log(`✅ Course created: ${course.title}`)

    // 2. Create Modules & Lessons
    for (const moduleObj of modulesData) {
        const { data: mod, error: modError } = await supabase
            .from('modules')
            .insert({ ...moduleObj, course_id: course.id })
            .select()
            .single()

        if (modError) throw modError
        console.log(`✅ Module created: ${mod.title}`)

        const lessons = lessonsData[mod.title as keyof typeof lessonsData]
        let lastLessonId = null

        for (const lessonData of lessons) {
            const { data: lesson, error: lesError } = await supabase
                .from('lessons')
                .insert({
                    module_id: mod.id,
                    title: lessonData.title,
                    type: lessonData.type,
                    duration_minutes: lessonData.duration,
                    xp_reward: lessonData.xp,
                    order_index: lessonData.order,
                    content: lessonData.content,
                    is_published: true
                })
                .select()
                .single()

            if (lesError) throw lesError
            console.log(`  - Lesson added: ${lesson.title}`)
            lastLessonId = lesson.id
        }

        // 3. Add Quiz (attached to the last lesson of the module in this simple model, or standalone)
        const quizItem = quizzesData[mod.title as keyof typeof quizzesData]
        if (quizItem && lastLessonId) {
            const { data: quiz, error: quizErr } = await supabase
                .from('quizzes')
                .insert({
                    module_id: mod.id,
                    lesson_id: lastLessonId, // Just linking it to the end of the module
                    title: quizItem.title,
                    xp_base: quizItem.xp_base,
                    xp_bonus_80: quizItem.xp_bonus_80,
                    xp_bonus_100: quizItem.xp_bonus_100
                })
                .select()
                .single()

            if (quizErr) throw quizErr
            console.log(`  📝 Quiz added: ${quiz.title}`)

            // Add questions
            const questionsToInsert = quizItem.questions.map((q, i) => ({
                quiz_id: quiz.id,
                question: q.q,
                options: q.o.map((text, idx) => ({ text, is_correct: idx === q.correct })),
                order_index: i + 1
            }))

            const { error: qErr } = await supabase.from('quiz_questions').insert(questionsToInsert)
            if (qErr) throw qErr
        }
    }

    console.log('🎉 Seed complete! Curriclum is active.')
}

seedContent().catch(console.error)
