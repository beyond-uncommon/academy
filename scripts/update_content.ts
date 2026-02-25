/**
 * update_content.ts
 * Updates lesson content in-place. Safe to run multiple times.
 * Run with: npx tsx scripts/update_content.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// Content map: title → full content object
// ─────────────────────────────────────────────────────────────────────────────

const contentMap: Record<string, Record<string, unknown>> = {

    // ── MODULE 1: Design Fundamentals ────────────────────────────────────────

    'What is Product Design?': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## What is Product Design?

Product design is the process of identifying a market opportunity, clearly defining the problem, developing a proper solution for that problem, and validating the solution with real users.

### The Three Pillars of Product Design

**1. Desirability — Does anyone want it?**
Understanding human needs, behaviours, and motivations is at the heart of product design. A product that nobody wants is not a product worth building.

**2. Feasibility — Can we build it?**
A design must be technically buildable within realistic constraints. Great designers work closely with engineers to understand what is possible.

**3. Viability — Does it make business sense?**
The best products sit at the intersection of what users need and what makes business sense. Understanding the commercial context shapes every design decision.

### Product Designer vs. UX Designer vs. UI Designer

| Role | Primary Focus |
|---|---|
| Product Designer | End-to-end: strategy, UX, and UI |
| UX Designer | User flows, research, and information architecture |
| UI Designer | Visual design, components, and aesthetics |

In most modern companies, a **Product Designer** owns all three layers.

### Key Takeaway

> Good product design is invisible. Users should accomplish their goals without noticing the interface.`,
        resources: [
            { title: 'What is Product Design? — Interaction Design Foundation', url: 'https://www.interaction-design.org/literature/topics/product-design', type: 'article' },
            { title: 'Shape Up by Basecamp (free book)', url: 'https://basecamp.com/shapeup', type: 'docs' },
        ]
    },

    'Design Thinking Process': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## The Design Thinking Process

Design Thinking is a human-centred, iterative approach to problem solving. It was popularised by IDEO and Stanford's d.school and is now used everywhere from startups to hospitals.

### The 5 Stages

**1. Empathise**
Research your users deeply. Conduct interviews, observe behaviours, and set aside your own assumptions. Your goal is to understand the *why* behind what people do.

**2. Define**
Synthesise your research into a clear problem statement. A good problem statement is specific, human-centred, and actionable.

> *"How might we help busy parents discover quick, healthy meal options during the week?"*

**3. Ideate**
Generate as many ideas as possible — quantity before quality. Techniques include Crazy 8s, mind mapping, and "Yes, and..." brainstorming.

**4. Prototype**
Build cheap, fast representations of your ideas. A prototype can be a paper sketch, a Figma mockup, or a clickable flow. Its only job is to make an idea testable.

**5. Test**
Put your prototype in front of real users. Watch without guiding. Listen without defending. Use what you learn to refine or restart.

### Why It's Iterative

Design thinking is not a linear checklist. After testing you may loop back to the Empathise or Define stage. This iteration is a feature, not a bug.

### Remember

> Fail fast, learn faster. The goal is to eliminate bad ideas cheaply — before they get built.`,
        resources: [
            { title: 'Design Thinking Explained — IDEO', url: 'https://designthinking.ideo.com/', type: 'article' },
            { title: 'An Introduction to Design Thinking — d.school', url: 'https://web.stanford.edu/~mshanks/MichaelShanks/files/509554.pdf', type: 'docs' },
        ]
    },

    'Understanding Users & Empathy': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Understanding Users & Empathy

Empathy is the ability to understand and share the feelings of another person. In design, it means stepping outside your own perspective and genuinely inhabiting the world of your user.

### Why Empathy Matters

Most product failures happen because teams build what they *assume* users need, not what users actually need. Empathy research replaces assumptions with evidence.

### Empathy Mapping

An empathy map is a collaborative tool that captures what a user **says, thinks, does, and feels** about a specific context.

| Quadrant | Questions to ask |
|---|---|
| **Says** | What exact words does the user use? |
| **Thinks** | What is on their mind? What worries them? |
| **Does** | What actions do they take? What behaviours do you observe? |
| **Feels** | What emotions are present? What frustrates them? |

### Techniques for Building Empathy

**Contextual Interviews** — Visit users in their natural environment. Watch someone cook to design a recipe app, not just ask them about it.

**Diary Studies** — Ask users to document their own behaviour over days or weeks. Reveals patterns that single interviews miss.

**The 5 Whys** — When a user describes a problem, ask "why" five times in succession. You'll uncover root causes rather than surface symptoms.

### The Danger of Self-Reference

> Designing for yourself is the most common mistake in product design. You are not your user.`,
        resources: [
            { title: 'Empathy Mapping: A Guide to Getting Inside a User\'s Head — Nielsen Norman Group', url: 'https://www.nngroup.com/articles/empathy-mapping/', type: 'article' },
        ]
    },

    'Introduction to Design Systems': {
        text_content: `# Introduction to Design Systems

A design system is a collection of reusable components, guided by clear standards, that can be assembled together to build any number of products and applications.

## Why Design Systems Exist

Imagine a company with 10 designers and 50 engineers working across 4 products. Without a shared system, every team invents its own buttons, colours, and patterns. The result: visual inconsistency, wasted effort, and a fractured user experience.

A design system solves this by establishing **one source of truth**.

## The Three Layers

### 1. Design Tokens
Tokens are the smallest named design decisions: colours, typography scales, spacing values, border radii, and shadows. They're the atoms from which everything else is built.

\`\`\`
--color-primary: #0047FF;
--space-4: 16px;
--radius-md: 8px;
\`\`\`

### 2. Components
Components are the reusable UI building blocks: buttons, inputs, cards, modals, navigation bars. Each component uses tokens and is built to be context-agnostic.

A great component has:
- **One clear purpose** (a button confirms actions; a link navigates)
- **Documented variants** (primary, secondary, destructive)
- **Documented states** (default, hover, focus, disabled, loading)

### 3. Patterns
Patterns are proven solutions to recurring design problems — how to handle empty states, how to structure a settings page, how to present error messages. They're higher-level than components.

## Real-World Examples

- **Material Design** by Google — the most widely adopted public design system
- **Human Interface Guidelines** by Apple — sets the standard for iOS apps
- **Polaris** by Shopify — purpose-built for e-commerce products
- **Base Web** by Uber — built for complex data-heavy interfaces

## What Goes in a Design System?

| Category | Examples |
|---|---|
| Foundation | Colours, typography, spacing, icons, grid |
| Components | Button, Input, Card, Modal, Toast |
| Patterns | Forms, Empty states, Error handling |
| Documentation | Usage guidelines, Do's and Don'ts |

## Key Takeaway

> A design system is not a project. It is a product that serves other products. It requires ongoing maintenance, governance, and a team culture that values consistency.`,
        resources: [
            { title: 'Design Systems 101 — Nielsen Norman Group', url: 'https://www.nngroup.com/articles/design-systems-101/', type: 'article' },
            { title: 'Atomic Design by Brad Frost (free book)', url: 'https://atomicdesign.bradfrost.com/', type: 'docs' },
            { title: 'Material Design', url: 'https://m3.material.io/', type: 'tool' },
        ]
    },

    'Typography & Color Basics': {
        text_content: `# Typography & Color Basics

Typography and colour are the two most powerful tools in a visual designer's toolkit. Together, they create hierarchy, guide attention, and communicate personality.

---

## Typography

Typography is the art and technique of arranging type to make written language legible, readable, and appealing.

### Type Classification

**Serif** — has small decorative strokes (serifs) at the ends of letters. Feels authoritative and traditional. Best for long-form reading in print.
> *Examples: Georgia, Times New Roman, Playfair Display*

**Sans-Serif** — clean, no serifs. Feels modern and minimal. Excellent for UI and screens.
> *Examples: Inter, SF Pro, Helvetica Neue*

**Monospace** — all characters take equal width. Used for code.
> *Examples: Fira Code, JetBrains Mono*

### Type Scale

A type scale is a set of predefined font sizes with mathematical relationships between them. Using a scale instead of arbitrary sizes creates visual rhythm.

A common scale (in px): **12 — 14 — 16 — 18 — 20 — 24 — 32 — 40 — 48 — 64**

### Hierarchy Rules

1. **One primary typeface** is usually enough. Two maximum.
2. Use **weight** (bold vs regular) before size to create hierarchy within a single level.
3. **Line height** of 1.5–1.7 × font size improves readability for body text.
4. **Line length** (measure) should be 60–80 characters for comfortable reading.

---

## Colour

### The Colour Model: HSL

In UI design, **HSL (Hue, Saturation, Lightness)** is the most intuitive model for creating colour palettes.

- **Hue** — the base colour on the wheel (0–360°)
- **Saturation** — intensity (0% = grey, 100% = vivid)
- **Lightness** — brightness (0% = black, 100% = white)

### Building a UI Palette

A solid UI palette has three categories:

**Brand / Primary** — the main accent colour. Used for CTAs, active states, links.

**Neutral / Grey scale** — the backbone of your UI. Used for backgrounds, borders, text.

**Semantic Colours** — convey meaning:
- 🟢 Green → Success
- 🔴 Red → Destructive / Error
- 🟡 Yellow → Warning
- 🔵 Blue → Informational

### Contrast & Accessibility

The **WCAG** (Web Content Accessibility Guidelines) defines minimum contrast ratios:

| Level | Contrast Ratio | Use for |
|---|---|---|
| AA | 4.5:1 | Normal text |
| AA Large | 3:1 | Large text (18px+) |
| AAA | 7:1 | Enhanced contrast |

> Use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify any colour pairing.

### The 60-30-10 Rule

Divide your interface colours into:
- **60%** Dominant (usually a neutral background)
- **30%** Secondary (surfaces, cards)
- **10%** Accent (brand colour — buttons, highlights)`,
        resources: [
            { title: 'Google Fonts — free typefaces', url: 'https://fonts.google.com', type: 'tool' },
            { title: 'WebAIM Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/', type: 'tool' },
            { title: 'The Elements of Typographic Style Applied to the Web', url: 'https://webtypography.net/', type: 'article' },
            { title: 'Colorhunt — Colour Palette Inspiration', url: 'https://colorhunt.co/', type: 'tool' },
        ]
    },

    // ── MODULE 2: UX Research & Ideation ─────────────────────────────────────

    'User Research Methods Overview': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## User Research Methods Overview

User research is the systematic study of target users — their behaviours, needs, motivations, and pain points. It removes guesswork from product decisions.

### Qualitative vs. Quantitative Research

| Type | What it answers | Examples |
|---|---|---|
| **Qualitative** | Why and how | Interviews, usability tests, diary studies |
| **Quantitative** | How many and how much | Surveys, analytics, A/B tests |

Use both. Qualitative research generates hypotheses; quantitative research validates them at scale.

### The Research Toolkit

**User Interviews**
One-on-one conversations that explore user behaviours and motivations in depth. Best for discovering unknown unknowns.

**Surveys**
Structured questionnaires sent to many users. Best for validating hypotheses across a large sample.

**Usability Testing**
Watching real users attempt tasks with your product. Reveals where the interface fails.

**Contextual Inquiry**
Observing users in their natural environment without disrupting their flow. Reveals behaviours people can't articulate in interviews.

**Card Sorting**
Users organise topics into categories that make sense to them. Used to inform information architecture.

**Analytics Review**
Studying quantitative usage data (click maps, funnels, retention curves) to identify where users drop off.

### When to Use What

- **Discovery phase** → Interviews, contextual inquiry
- **Definition phase** → Affinity mapping, surveys
- **Ideation phase** → Co-design workshops
- **Validation phase** → Usability testing, A/B tests`,
        resources: [
            { title: 'User Research Methods — Nielsen Norman Group', url: 'https://www.nngroup.com/articles/which-ux-research-methods/', type: 'article' },
            { title: 'Just Enough Research by Erika Hall', url: 'https://abookapart.com/products/just-enough-research', type: 'docs' },
        ]
    },

    'How to Conduct User Interviews': {
        text_content: `# How to Conduct User Interviews

User interviews are structured conversations designed to uncover how people think, feel, and behave around a specific topic. Done well, they are the single most valuable research method available to a product designer.

## Before the Interview

### Define Your Research Questions
Start with what you need to *learn*, not what you want to *confirm*. A good research question is open-ended:

✅ *"How do people currently manage their personal finances?"*
❌ *"Do people like our budgeting feature?"*

### Recruit the Right Participants
- Aim for 5–8 participants per research round (enough to see patterns)
- Recruit people who match your target user profile
- Screen participants with a short screener survey

### Write a Discussion Guide
A discussion guide is a flexible script — not a rigid questionnaire. Structure it as:

1. **Warm-up** (5 min) — Build rapport, explain the session
2. **Context setting** (10 min) — Understand their background and current behaviours
3. **Core exploration** (25 min) — Dig into the topic you're researching
4. **Concept reaction** (if applicable) (10 min) — Show mockups or prototypes for feedback
5. **Wrap-up** (5 min) — Final thoughts, thank the participant

---

## During the Interview

### Ask Open-Ended Questions
Open-ended questions invite stories. Closed questions invite yes/no.

| Closed ❌ | Open ✅ |
|---|---|
| "Do you use a budgeting app?" | "Walk me through how you manage your finances each month." |
| "Was that confusing?" | "What was going through your mind when you saw that screen?" |

### The 5 Follow-Up Probes
When a participant says something interesting, dig deeper with:

1. **"Tell me more about that."**
2. **"Can you walk me through an example?"**
3. **"What happened next?"**
4. **"Why was that important to you?"**
5. **"How did that make you feel?"**

### Listen More Than You Speak
Silence is your friend. Let participants fill it. Don't rush to the next question.

### Don't Lead the Witness
Avoid revealing your assumptions or the solution you have in mind. Leading questions contaminate the data.

> ❌ *"Our new feature makes it easier to track your spending — how useful would that be?"*
> ✅ *"How do you currently keep track of where your money goes?"*

---

## After the Interview

### Transcribe and Tag
Turn recordings into notes. Tag quotes by theme (e.g., pain point, behaviour, motivation).

### Look for Patterns
A single interview gives you anecdotes. Three or more interviews with the same theme gives you a pattern. Patterns drive design decisions.

### Share with Your Team
Research only has impact if it gets out of your notes and into your team's thinking. Write a short summary, present key quotes, and share recordings.`,
        resources: [
            { title: 'Interviewing Users by Steve Portigal', url: 'https://rosenfeldmedia.com/books/interviewing-users/', type: 'docs' },
            { title: 'How to Run User Interviews — First Round Review', url: 'https://review.firstround.com/how-to-run-a-great-user-interview', type: 'article' },
        ]
    },

    'Affinity Mapping & Synthesis': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Affinity Mapping & Synthesis

After collecting qualitative research — interviews, observations, open-ended surveys — you have a mass of unstructured data. Affinity mapping turns that raw material into organised insights.

### What is an Affinity Map?

An affinity map (or affinity diagram) is a bottom-up method of clustering observations and quotes into emergent themes. It's bottom-up because the themes aren't defined in advance — they emerge from the data itself.

### How to Build an Affinity Map

**Step 1: Externalise**
Write every observation, quote, or data point on a separate sticky note. One idea per note. Use the participant's exact words where possible.

> *"I always forget where I put the receipt"*
> *"I only check my bank statement once a month"*

**Step 2: Cluster**
Move stickies that feel related close together. Don't force it — let the clusters emerge naturally. Do this silently first, then discuss.

**Step 3: Name the clusters**
Write a label for each cluster that captures the pattern — not a description of the content, but the *insight* it represents.

> Cluster of "I lose track of things" notes → label: **"Users lack a reliable system for capture"**

**Step 4: Find higher-order themes**
Look for relationships between clusters. Some clusters will naturally group into larger themes.

### Synthesis: Going from Data to Insight

Synthesis is the act of pulling meaning from the patterns you've found. The output of synthesis is:

- **Key insights** — the 3–5 most important things you learned
- **Design principles** — rules that should guide design decisions
- **How Might We (HMW) questions** — opportunity spaces reframed as design challenges

> Insight: *"Users feel overwhelmed by too many notification types."*
> HMW: *"How might we help users control their notification experience without cognitive overhead?"*`,
        resources: [
            { title: 'Affinity Diagramming — Nielsen Norman Group', url: 'https://www.nngroup.com/articles/affinity-diagram/', type: 'article' },
        ]
    },

    'User Personas': {
        text_content: `# User Personas

A user persona is a fictional but research-grounded representation of a key user segment. Personas give your team a shared, concrete image of who you are designing for — transforming abstract user data into a human being you can empathise with.

## Why Personas Work

Without personas, teams default to designing for themselves or for a vague, generic "user". Personas force specificity:

> Instead of "the user", you talk about "Marcus, the freelance photographer who manages client bookings from his phone."

This specificity drives better design decisions.

## What Makes a Good Persona

A persona grounded in research is powerful. A persona invented from assumptions is dangerous — it gives teams false confidence while encoding bias.

**Good personas include:**
- A name and a photo (makes them feel real)
- A one-line description of who they are
- Key demographic context (only what's relevant to the product)
- Goals — what they are trying to achieve
- Frustrations / pain points — what gets in their way
- Behaviours — how they currently solve the problem
- A representative quote from actual research

**Good personas exclude:**
- Irrelevant demographics
- Generic descriptions that could apply to anyone
- Made-up motivations not supported by data

## Persona Template

---

**Name:** Maya Chen
**Age:** 28 | **Role:** Startup Founder | **Location:** London

> *"I need to make fast decisions with incomplete information — I don't have time to dig through spreadsheets."*

**Goals**
- Understand her company's cash flow at a glance
- Forecast runway without involving her accountant every time

**Frustrations**
- Her current tools require manual data entry
- Reports are always out of date by the time she reads them
- She doesn't trust numbers she can't verify herself

**Behaviours**
- Checks financial data 2–3 times per week
- Uses a mix of bank apps, spreadsheets, and messaging her accountant
- Prefers mobile-first tools

---

## Persona Anti-Patterns

**The Frankenpersona** — a persona built by averaging traits across multiple distinct user segments. It represents nobody.

**The Aspirational Persona** — describes who the team *wishes* their users were, not who they actually are.

**The Abandoned Persona** — created during discovery, then never consulted again.

## How Many Personas Do You Need?

Aim for 2–4 primary personas. More than that and they stop being useful reference points.`,
        resources: [
            { title: 'Personas Make Users Memorable — Nielsen Norman Group', url: 'https://www.nngroup.com/articles/persona/', type: 'article' },
            { title: 'Persona Template — Figma Community', url: 'https://www.figma.com/community/search?resource_type=files&q=user+persona+template', type: 'tool' },
        ]
    },

    'Ideation: Crazy 8s & Sketching': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Ideation: Crazy 8s & Sketching

Ideation is the phase where you generate solutions to the problem you've defined. The goal is to produce many ideas quickly — diverging before you converge.

### Why Sketching?

Sketching is the fastest way to make an idea tangible. It costs nothing to draw a bad idea on paper and cross it out. Building a bad idea in Figma costs hours. Building it in code costs days.

> Sketch to think, not to present.

### Crazy 8s

Crazy 8s is a timed sketching exercise popularised by Google Ventures' Design Sprint methodology.

**The rules:**
1. Fold a sheet of A4 paper into 8 sections
2. Set a timer for 8 minutes
3. Sketch a different UI concept in each panel (1 minute each)
4. No explaining, no polishing — just ideas

The constraint forces you to exhaust the obvious ideas quickly and reach for unexpected ones.

### Running a Group Ideation Session

**Silent generation first** — everyone ideates individually before sharing. Group discussion anchors people to the first idea they hear.

**Quantity before quality** — commit to generating 20+ ideas before evaluating any of them. "Yes, and..." beats "Yes, but...".

**Diverge, then converge** — after generating, step back and identify themes and promising directions. Dot-vote to narrow down.

### From Sketches to Concepts

After Crazy 8s, identify 2–3 concepts worth developing further. For each:
1. Create a slightly more refined sketch showing the key screen or interaction
2. Add annotations explaining the logic
3. Present to the team — 2 minutes per concept, then discussion

### What to Sketch

Focus on the **critical path** — the single most important flow a user needs to complete. For a food delivery app, that might be: browse → add to cart → checkout → confirmation.`,
        resources: [
            { title: 'The Design Sprint (free book) — Jake Knapp', url: 'https://www.thesprintbook.com/', type: 'docs' },
            { title: 'How to Run a Design Sprint — Google', url: 'https://designsprintkit.withgoogle.com/', type: 'article' },
        ]
    },

    'Project: User Persona': {
        brief: `# Project: Create a User Persona

## Overview

You will apply your UX research skills by creating a fully-formed, research-informed user persona for a product of your choice.

This is your first project submission and will be reviewed by your mentor.

---

## The Brief

Choose one of the following product contexts:

- **A** — A mobile app that helps university students manage their academic workload
- **B** — A web tool that helps freelancers track invoices and payments
- **C** — A fitness app for people aged 40+ who are returning to exercise after a long break

For your chosen context, you will create **one primary user persona**.

---

## Research Requirement

Your persona must be informed by at least **3 sources of research evidence**. This can include:

- Conducting 2–3 short user interviews (even with friends or family who match the profile)
- Reading Reddit threads, App Store reviews, or forum discussions from your target audience
- Finding publicly available user research or case studies on the topic

Document your sources — where did each insight come from?

---

## Deliverables

Create a **Figma or PDF document** containing:

1. **Your persona card** including:
   - Name, photo (stock photo is fine), and one-line bio
   - Goals (2–3 bullet points)
   - Frustrations / pain points (2–3 bullet points)
   - Current behaviours (how they solve the problem today)
   - A representative quote in their voice

2. **Research notes** (1 page): Brief summary of your research sources and 3–5 key insights that shaped your persona

3. **A "How Might We" statement**: One design challenge, framed as a HMW question, based on your research

---

## Evaluation Criteria

| Criteria | Weight |
|---|---|
| Research-backed — persona is grounded in evidence, not guesswork | 40% |
| Specificity — persona feels like a real person, not a generic archetype | 30% |
| Clarity — document is clearly laid out and easy to read | 20% |
| HMW quality — the design challenge is focused and actionable | 10% |

---

## Submission

Submit a **publicly viewable Figma link** or a **PDF download link** (Google Drive, Dropbox, etc.).`,
        resources: [
            { title: 'Persona Template — Figma Community', url: 'https://www.figma.com/community/search?resource_type=files&q=user+persona', type: 'tool' },
            { title: 'How to Write a How Might We Statement — IDEO', url: 'https://www.designkit.org/methods/how-might-we', type: 'article' },
        ]
    },

    // ── MODULE 3: Wireframing & Prototyping ──────────────────────────────────

    'Information Architecture Basics': {
        text_content: `# Information Architecture Basics

Information architecture (IA) is the practice of organising, structuring, and labelling content in an effective and sustainable way. Good IA means users can find what they need without thinking about it.

## Why IA Matters

Every app or website contains a large amount of content — features, pages, settings, help articles. Without deliberate organisation, that content becomes a labyrinth.

> *"A user who can't find a feature doesn't know the feature exists."*

## The Three Circles of IA (Peter Morville)

**Context** — the business goals, constraints, and environment in which the product lives
**Content** — the actual information, features, and functionality being organised
**Users** — the people who will navigate and use the product

Good IA sits at the intersection of all three.

## Core IA Concepts

### Hierarchy
Content arranged from broad to specific, top to bottom. A mobile app typically has: App → Sections → Screens → Components.

### Navigation Patterns
| Pattern | Description | Best for |
|---|---|---|
| **Tab Bar** | Persistent bottom navigation (mobile) | 3–5 primary sections |
| **Hamburger Menu** | Hidden side navigation | Secondary or advanced options |
| **Hub & Spoke** | Central home with branching destinations | Task-focused apps |
| **Step-by-step** | Linear flow with clear progression | Onboarding, checkout |

### Categorisation
How do you decide what goes together? Three approaches:

**Alphabetical** — useful for reference content (e.g., settings, glossaries)
**Task-based** — grouped by what users want to do (e.g., "Manage my account")
**Audience-based** — different sections for different user types (e.g., "For teams", "For individuals")

## Card Sorting

Card sorting is a UX research method used to inform IA. Participants group topic cards into categories that make sense to them. This reveals the user's mental model — how *they* think the content should be organised.

Two types:
- **Open card sort** — participants create their own category names
- **Closed card sort** — participants sort into pre-defined categories

## Sitemaps

A sitemap is a diagram showing all the pages (or screens) in a product and how they relate to each other. It's the blueprint of your IA.

Draw a sitemap before starting any wireframes. It forces you to make structural decisions before getting distracted by visual design.

## Key Principles

1. **Match the user's mental model** — organise content the way users think, not the way your database is structured
2. **Keep navigation shallow** — aim for no more than 3 levels deep
3. **Use clear labels** — avoid jargon or clever names; use the words your users use
4. **Design for findability** — every piece of content should have an obvious home`,
        resources: [
            { title: 'Information Architecture for the Web and Beyond — O\'Reilly', url: 'https://www.oreilly.com/library/view/information-architecture-4th/9781491913529/', type: 'docs' },
            { title: 'Card Sorting: A Definitive Guide — Boxes and Arrows', url: 'https://boxesandarrows.com/card-sorting-a-definitive-guide/', type: 'article' },
        ]
    },

    'Wireframing Fundamentals': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Wireframing Fundamentals

A wireframe is a low-fidelity schematic that shows the layout, structure, and hierarchy of a screen — without colour, final typography, or visual polish. It answers the question: *"What goes where and why?"*

### The Purpose of Wireframes

Wireframes are a communication tool. Their value is not in the artefact itself but in the conversations they create.

- They reveal structural problems before any code is written
- They allow stakeholders to review layout without being distracted by colour or aesthetics
- They can be produced quickly — making iteration cheap

> A wireframe that takes 4 hours to make and prevents a 4-week development mistake is excellent ROI.

### Wireframe Fidelity

**Sketch (paper)** — fastest, best for solo exploration. No setup, infinite flexibility.

**Digital low-fi** — grey boxes and placeholder text in Figma or Balsamiq. Shareable, easy to comment on.

**Mid-fi** — proper spacing and typography, still no colour or images. Useful for stakeholder reviews before committing to visual direction.

### What to Include in a Wireframe

- **Navigation** — where it lives, what items it contains
- **Content blocks** — what information appears on screen and in what order
- **Primary action** — the CTA the user is most likely to take
- **States** — empty state, loading state, error state

### What to Leave Out

- Colours (use greyscale)
- Specific typography styles
- Icons (boxes with an X work fine)
- Copy (use "Lorem ipsum" or placeholder text)

### The Layout Grid

Design to a grid. An 8-point grid (where spacing and sizing values are multiples of 8) creates visual rhythm and makes handoff to developers cleaner.

Common mobile grid: 4 columns, 16px margins, 8px gutter.
Common web grid: 12 columns, 24px margins, 16px gutter.

### Common Mistakes

❌ Spending too long perfecting a single wireframe instead of exploring multiple options
❌ Getting feedback on a wireframe that looks "too final" — reviewers focus on the wrong things
❌ Wireframing without a defined user flow — a screen in isolation tells you nothing`,
        resources: [
            { title: 'Figma — free design tool', url: 'https://www.figma.com/', type: 'tool' },
            { title: 'Wireframing User Experience — Smashing Magazine', url: 'https://www.smashingmagazine.com/2020/04/wireframing-user-experience/', type: 'article' },
        ]
    },

    'Low-Fi vs Hi-Fi Prototyping': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Low-Fi vs. Hi-Fi Prototyping

A prototype is a simulation of a product that lets you test ideas with real users before committing to building them. The fidelity of the prototype should match the questions you need to answer.

### Fidelity as a Spectrum

Fidelity refers to how closely a prototype resembles the final product in terms of visual design, interactivity, and content.

**Low fidelity** ←——————————————→ **High fidelity**
Paper sketches   Figma clickable flows   Coded prototypes

### When to Use Low-Fi

**Paper prototyping** is ideal in the early stages when:
- You're still exploring multiple different structural approaches
- You want to iterate in minutes, not hours
- You're testing navigation flows and information architecture
- You don't want visual details to distract test participants

**What to test with low-fi:** Can users find their way? Do they understand the structure?

### When to Use Hi-Fi

**High-fidelity prototypes** are appropriate when:
- The structure is settled and you're testing visual design and copy
- You need stakeholder or client sign-off
- You're handing off to developers
- You're testing micro-interactions and animations

**What to test with hi-fi:** Is the visual hierarchy clear? Does the copy work?

### Figma Prototyping

In Figma, you can create clickable prototypes by connecting frames with interactions:
1. Select an element (button, nav item)
2. Switch to the Prototype panel
3. Drag the connection handle to the destination frame
4. Set the trigger (On Click) and animation (Instant, Dissolve, Slide)

### A Note on Over-Polishing

The most common prototyping mistake is spending too long on a high-fidelity prototype before validating the basic structure. Polish after you've confirmed the concept works.

> The goal of a prototype is not to be impressive — it is to be informative.`,
        resources: [
            { title: 'Paper Prototyping Guide — UX Pin', url: 'https://www.uxpin.com/studio/blog/paper-prototyping-the-practical-beginners-guide/', type: 'article' },
            { title: 'Prototyping in Figma — Figma Help Centre', url: 'https://help.figma.com/hc/en-us/articles/360040314193', type: 'docs' },
        ]
    },

    'Prototyping in Figma (Intro)': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Prototyping in Figma

Figma is the industry-standard tool for product design. Its prototyping features let you turn static designs into interactive, testable flows directly within the same tool you design in — no separate software required.

### The Figma Interface: Key Panels

**Layers panel** (left) — the structure of your file. Frames, groups, and components appear here.
**Canvas** (centre) — your working area. Frames represent screens.
**Design panel** (right) — position, size, fill, stroke, effects for selected elements.
**Prototype panel** (right) — where you add interactions and connections between frames.

### Frames and Screens

In Figma, each **Frame** is a screen. Set your frame size to match your target device:
- iPhone 14 Pro: 393 × 852
- iPad: 820 × 1180
- Desktop: 1440 × 900

Use the preset device sizes in the right panel (→ Frame → choose device).

### Creating an Interaction

1. Select an element you want to make clickable (e.g., a button)
2. Open the **Prototype** panel on the right
3. Hover over the element — a blue ⊕ handle appears
4. Drag the handle to the destination frame
5. Set the trigger: **On Click** is most common
6. Set the action: **Navigate To** for standard navigation
7. Choose an animation: **Smart Animate** for smooth transitions between similar frames

### Smart Animate

Smart Animate automatically interpolates between matching elements across two frames. If a card appears in the same position in both frames, Figma will animate it moving smoothly between states.

**Requirements for Smart Animate:**
- Elements must have the same name in both frames
- Both frames must exist on the canvas

### Presenting Your Prototype

Press **▶ Present** (top right) to enter presentation mode. Share the link with users for remote testing. They'll see only the prototype, not your design canvas.

### Components: Design Once, Use Everywhere

A **component** is a reusable design element. Create a component (⌘K on Mac) from any element, then use instances throughout your file. Updating the main component updates all instances.

Use components for: buttons, nav bars, cards, inputs, icons.`,
        resources: [
            { title: 'Figma Tutorials — official YouTube channel', url: 'https://www.youtube.com/@Figma', type: 'video' },
            { title: 'Figma Help Centre', url: 'https://help.figma.com/hc/en-us', type: 'docs' },
            { title: 'Figma Community — free UI kits and templates', url: 'https://www.figma.com/community', type: 'tool' },
        ]
    },

    'Usability Testing Basics': {
        text_content: `# Usability Testing Basics

Usability testing is the practice of observing real people use your product to complete real tasks. It is the most reliable way to find out if your design works.

## Why Usability Testing is Essential

Designers and developers are cursed by knowledge — they know how the product works, so they cannot see where it's confusing. Usability testing breaks this curse.

> *"If you watch 5 users, you'll find 85% of the usability problems."*
> — Jakob Nielsen

Five users. That's all it takes for a basic round of testing.

## The Two Main Types

### Moderated Testing
A facilitator guides participants through tasks in real time, asking questions and probing for more detail. Can be in-person or remote (via Zoom with screen sharing).

**Best for:** Deep insight, complex flows, early-stage concepts

### Unmoderated Testing
Participants complete tasks on their own, with their screen and audio recorded. The researcher analyses the recordings asynchronously.

**Best for:** Scale, speed, testing with geographically distributed users

## How to Run a Usability Test

### 1. Define Your Research Questions
What do you need to learn? Focus on 2–3 specific hypotheses.

> *"Can users find the account settings page without guidance?"*
> *"Do users understand what the 'Sync' button does?"*

### 2. Write Tasks, Not Questions
Give participants a realistic scenario and a concrete goal — not a question about the interface.

| ❌ Question | ✅ Task |
|---|---|
| "Can you find the settings?" | "You want to change your notification preferences. Show me what you'd do." |
| "Do you like this design?" | "You've just received a payment. Confirm you've been paid and check the total." |

### 3. Facilitate Without Guiding
Your job is to observe, not to help. When a participant struggles:
- Stay silent longer than feels comfortable
- Ask "What are you thinking right now?"
- Never explain or point to the answer

### 4. Take Notes on Behaviour
Record what participants *do*, not just what they *say*. Actions reveal the truth; stated preferences can mislead.

Note:
- Where they hesitate or backtrack
- What they click expecting something and don't get
- Their facial expressions and body language

### 5. Synthesise and Prioritise
After testing, rate each problem by **severity** (how often it occurred × how badly it blocks the user). Fix the highest-severity issues first.

## Remote Usability Testing Tools

- **Maze** — unmoderated testing with automated task analysis
- **UserTesting** — panel of participants on demand
- **Lookback** — moderated sessions with recording
- **Lyssna** — quick concept and design testing`,
        resources: [
            { title: 'Usability Testing 101 — Nielsen Norman Group', url: 'https://www.nngroup.com/articles/usability-testing-101/', type: 'article' },
            { title: 'Maze — free usability testing tool', url: 'https://maze.co/', type: 'tool' },
            { title: 'How to Run Remote Usability Tests — Smashing Magazine', url: 'https://www.smashingmagazine.com/2018/03/guide-user-testing/', type: 'article' },
        ]
    },

    // ── MODULE 4: UI Design & Handoff ────────────────────────────────────────

    'UI Design Principles (Gestalt)': {
        text_content: `# UI Design Principles: Gestalt

Gestalt psychology explores how the human brain perceives and organises visual information. Its principles are foundational to UI design because they explain *why* certain layouts feel intuitive and others feel chaotic.

## The Core Gestalt Principles

### 1. Proximity
Elements that are close together are perceived as belonging to a group.

**In UI:** Group related form fields together. Separate sections with whitespace, not lines. A label positioned close to its input is instantly associated with it.

### 2. Similarity
Elements that look similar (same colour, shape, or size) are perceived as related.

**In UI:** Use the same button style for all primary actions. Use consistent card styling for all items in a list. Similarity signals "these things are the same type of thing."

### 3. Continuity
The eye follows paths, lines, and curves. We prefer continuous, smooth flow over abrupt changes in direction.

**In UI:** Horizontal rows of items imply "scroll right for more". Vertical lists imply "scroll down for more". Align elements to reinforce directional flow.

### 4. Closure
The brain fills in missing information to complete a familiar shape.

**In UI:** A card that's partially visible at the edge of the screen signals "there is more here — scroll to see it." You don't need to show the full card for the user to understand there's more content.

### 5. Figure / Ground
The brain distinguishes between a subject (figure) in the foreground and its background (ground).

**In UI:** Modals and overlays use a darkened background to push content into the background, making the modal the clear focus. Contrast levels define what is "on top."

### 6. Common Fate
Elements that move together are perceived as related.

**In UI:** Items in a list that all slide right together during a swipe gesture are understood to be part of the same group. Animation groups meaning.

---

## Visual Hierarchy

Visual hierarchy is the arrangement of elements in order of importance. A strong hierarchy guides the user's eye through the interface in the intended sequence.

**The hierarchy toolkit:**
| Tool | How it creates hierarchy |
|---|---|
| Size | Larger = more important |
| Weight | Bold = primary; regular = secondary |
| Colour | High contrast = foreground; low contrast = background |
| Position | Top and left are read first (in left-to-right cultures) |
| Whitespace | Isolated elements command attention |

## The F-Pattern and Z-Pattern

Eye-tracking research reveals that users scan, not read:

- **F-Pattern** (information-dense content) — two horizontal scans at the top, then a vertical scan down the left side
- **Z-Pattern** (minimal content) — top-left → top-right → diagonal → bottom-left → bottom-right

Place the most important information where the eye naturally goes first.`,
        resources: [
            { title: 'Gestalt Principles for Designers — Smashing Magazine', url: 'https://www.smashingmagazine.com/2014/03/design-principles-visual-perception-and-the-principles-of-gestalt/', type: 'article' },
            { title: 'Laws of UX', url: 'https://lawsofux.com/', type: 'docs' },
        ]
    },

    'Designing with Components': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Designing with Components

Component-based design mirrors how modern front-end code is structured (React, Vue, SwiftUI). Designing with components creates consistency, accelerates production, and makes handoff to developers seamless.

### What is a Component?

A component is a reusable, self-contained UI element that encapsulates its own design logic. Everything in your UI can and should be a component: buttons, inputs, cards, navigation bars, badges, avatars.

### Anatomy of a Component

Every component has:

**Variants** — different visual versions that share the same structure
> A button has: Primary, Secondary, Ghost, Destructive

**States** — visual changes in response to user interaction or data
> A button has: Default, Hover, Focus, Loading, Disabled

**Props** — the variable content that each instance can hold
> A card has: image, title, description, CTA text

### Figma Auto Layout

Auto Layout is Figma's system for building responsive components. Instead of manually placing elements, you define rules:

- **Direction** — horizontal or vertical
- **Spacing** — gap between children (use 8-point multiples)
- **Padding** — internal spacing (use 8-point multiples)
- **Resizing** — fixed, fill, or hug content

A button built with Auto Layout correctly expands with its label text and can be reused at any size.

### Component Naming Convention

Use a consistent naming convention so your component library is searchable:

\`Category / ComponentName / Variant\`

Examples:
- \`Button / Primary / Default\`
- \`Input / Text / Error\`
- \`Card / Product / Horizontal\`

### Building a Mini Design System in Figma

1. Create a page called "Design System" in your file
2. Define colour styles (your palette as named styles)
3. Define text styles (your type scale as named styles)
4. Create main components for every repeated element
5. Use components throughout your UI pages — never copy-paste raw elements

### The Handoff Advantage

When developers inspect a file built with components:
- They see consistent spacing and sizing values
- They can map UI components directly to code components
- They don't need to guess at "is this 14px or 13px?" — it's defined in the style`,
        resources: [
            { title: 'Component Architecture — Figma', url: 'https://www.figma.com/best-practices/components-styles-and-shared-libraries/', type: 'docs' },
            { title: 'Building a Design System in Figma — Figma tutorial', url: 'https://www.figma.com/resource-library/design-systems/', type: 'article' },
        ]
    },

    'Accessibility in UI Design': {
        text_content: `# Accessibility in UI Design

Accessibility (a11y) means designing products that can be used by people with a wide range of abilities — including those with visual, auditory, motor, or cognitive disabilities.

Accessible design is not a niche requirement. It's better design for everyone.

## The Business Case

- **1 in 6 people** globally has some form of disability (WHO)
- Accessible products are required by law in many jurisdictions (ADA, WCAG, EN 301 549)
- Accessibility improvements consistently benefit all users: captions help people in noisy environments; high contrast helps people in bright sunlight

## The Four POUR Principles (WCAG)

The Web Content Accessibility Guidelines organise accessibility around four principles:

**Perceivable** — information must be presentable to users in ways they can perceive (text alternatives for images, captions for video)

**Operable** — users must be able to operate the interface (keyboard navigation, no time limits)

**Understandable** — information and operation must be understandable (clear error messages, consistent navigation)

**Robust** — content must be interpretable by assistive technologies (valid HTML, ARIA labels)

## Visual Accessibility

### Colour Contrast
Text must meet minimum contrast ratios against its background:
- **4.5:1** for normal text (WCAG AA)
- **3:1** for large text (18px bold or 24px regular)
- **3:1** for UI components (borders of inputs, icons)

### Don't Rely on Colour Alone
Never use colour as the only visual indicator of meaning. A form error shown only in red is invisible to colourblind users.

✅ Add an icon + text label alongside the colour change.

### Text Size and Spacing
- Body text minimum: **16px**
- Line height: at least **1.5×** the font size
- Paragraph spacing: at least **2×** the font size

## Motor Accessibility

### Touch Target Size
Interactive elements must be large enough to tap comfortably.
- Minimum: **44 × 44px** (Apple HIG) / **48 × 48dp** (Material Design)
- Spacing between targets: at least **8px**

### Keyboard Navigation
All interactive elements must be reachable and operable with a keyboard alone (Tab to move, Enter/Space to activate).

## Cognitive Accessibility

- Write in plain language (aim for Grade 8 reading level)
- Use consistent patterns — don't make users relearn navigation
- Provide clear error messages that explain what went wrong and how to fix it
- Give adequate time for timed interactions

## Testing for Accessibility

**Automated tools** catch ~30% of issues:
- Figma Accessibility Checker (plugin)
- Axe DevTools (browser extension)
- Lighthouse (Chrome DevTools)

**Manual testing** catches the rest:
- Navigate your UI with keyboard only
- Enable a screen reader (VoiceOver on Mac, NVDA on Windows)
- Test with your monitor set to greyscale (System Preferences → Accessibility)`,
        resources: [
            { title: 'WCAG 2.1 Guidelines', url: 'https://www.w3.org/WAI/WCAG21/quickref/', type: 'docs' },
            { title: 'WebAIM Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/', type: 'tool' },
            { title: 'A11y Project Checklist', url: 'https://www.a11yproject.com/checklist/', type: 'tool' },
            { title: 'Inclusive Design Principles', url: 'https://inclusivedesignprinciples.org/', type: 'article' },
        ]
    },

    'Design-to-Dev Handoff': {
        video_url: 'https://vimeo.com/839075480',
        notes: `## Design-to-Dev Handoff

The handoff is the moment when a design moves from the designer to the engineering team. A smooth handoff saves days of back-and-forth and prevents the final product from diverging from the design.

### What Developers Need from Your Design Files

**1. A complete, organised Figma file**
- Named layers and frames (not "Frame 47")
- No unexplained magic numbers — all spacing uses your defined token values
- Components used consistently throughout — no raw copies

**2. All states accounted for**
Every interactive element needs:
- Default state
- Hover state
- Focus state (keyboard outline)
- Disabled state
- Loading state (for async actions)
- Error state (for form inputs)
- Empty state (for lists and data)

**3. Responsive behaviour defined**
Show the design at mobile, tablet, and desktop breakpoints. Annotate how the layout changes.

**4. Copy in the design, not in a separate doc**
Developers should be able to copy-paste final text directly from Figma.

### Using Figma Dev Mode

Figma's Dev Mode (toggle in the top bar) shows developers the exact properties they need:

- CSS values for colours, typography, and spacing
- Exported assets (icons, images) as SVG or PNG
- Component specifications

Encourage developers to inspect the file themselves rather than asking you for every measurement.

### Annotating Your Designs

For anything non-obvious, add annotations:

- Interaction behaviour (e.g., "tapping card opens bottom sheet")
- Animation spec (e.g., "300ms ease-out, slide up 24px")
- Conditional logic (e.g., "show empty state if no items returned")
- Business logic (e.g., "this field is pre-filled from the user's profile")

Use Figma comments or a sticky note component on the canvas.

### Writing a Design Spec

For complex features, write a short spec document:

1. **Overview** — what this feature does and why
2. **User flows** — the key paths through the feature
3. **Edge cases** — what happens when data is missing, loading, or errored
4. **Out of scope** — explicit list of what is NOT included in this sprint

### The Design-Dev Relationship

The handoff is not a one-way street. Good collaboration means:
- Involving engineers during the design phase (feasibility review)
- Running a brief design walkthrough before development starts
- Being available during development for clarification
- Reviewing the implemented feature against the design before launch`,
        resources: [
            { title: 'The Complete Guide to Design Handoff — Figma', url: 'https://www.figma.com/best-practices/design-handoff/', type: 'docs' },
            { title: 'Figma Dev Mode', url: 'https://www.figma.com/dev-mode/', type: 'tool' },
        ]
    },

    'Building a Portfolio Case Study': {
        text_content: `# Building a Portfolio Case Study

A case study is the single most important thing in a product designer's portfolio. It tells the story of how you think, not just what you can make.

## What Hiring Managers Are Looking For

> *"We can teach tools. We're hiring for how someone approaches problems."*

Interviewers want to see:
- **Your process** — how do you move from problem to solution?
- **Your reasoning** — why did you make the decisions you made?
- **Your impact** — what changed as a result of your work?

A gallery of polished mockups answers none of these questions.

## The Case Study Structure

### 1. Context (1–2 paragraphs)
Set the scene. What is the product? What was the business context? What was your role?

### 2. The Problem
Define the problem clearly. Use data or research quotes to make it concrete.

> *"67% of users abandoned checkout before confirming their order. Exit survey data suggested the payment step was confusing."*

### 3. Research & Discovery
What did you do to understand the problem? Mention the methods you used and the key insights they surfaced. Show evidence: quotes, affinity maps, survey results.

### 4. Defining the Solution Direction
How did you translate insights into a design direction? Show early sketches or concepts. Explain the constraints you were working within.

### 5. Design Iterations
Show your work evolving. A before-and-after of a key screen is more compelling than just the final state.

Include:
- Early low-fi explorations
- Key decisions and why you made them
- Feedback you received and how it changed the design

### 6. The Final Design
Showcase the finished work. Use high-quality mockups in context (device frames, realistic copy).

### 7. Results & Impact
What happened after launch? Ideally quantitative: "Checkout abandonment dropped from 67% to 41%." If you don't have metrics, show qualitative outcomes.

---

## Writing Tips

**Lead with impact, not process.** Open with the result, then explain how you got there.

**Be specific about your contribution.** If you worked in a team, explain what *you* did.

**Kill the jargon.** "Leveraged a human-centred design methodology to ideate synergistic solutions" means nothing. Write plainly.

**Show the ugly bits.** A design that went wrong and was fixed is more interesting than one that was perfect from the start.

## Presentation Tips

- **Length:** 800–1200 words per case study is plenty
- **Images:** annotated screenshots > generic device mockups
- **Structure:** use clear headings so readers can scan
- **Platform:** Figma (presentation mode), Notion, or a personal site all work

## Common Mistakes

❌ **Too much process, no outcome** — what did it actually achieve?
❌ **Too polished, no thinking visible** — show the messy middle
❌ **Passive voice throughout** — "a survey was conducted" → "I interviewed 8 users"
❌ **Screenshots without context** — always explain what you're showing and why it matters`,
        resources: [
            { title: 'Bestfolios — case study inspiration', url: 'https://www.bestfolios.com/', type: 'tool' },
            { title: 'How to Write a UX Case Study — UX Collective', url: 'https://uxdesign.cc/how-to-write-a-ux-case-study-a2b47eda6e91', type: 'article' },
            { title: 'Notion — portfolio and case study tool', url: 'https://www.notion.so/', type: 'tool' },
        ]
    },

    'Final Project: Mobile App UI': {
        brief: `# Final Project: Mobile App UI Design

## Overview

This is your capstone project for the Explorer Crash Course. You will design a complete set of high-fidelity screens for a mobile banking app, applying every skill you've developed across the four modules.

Your work will be reviewed by your mentor and will serve as a portfolio piece.

---

## The Brief

**Product:** A mobile banking app for young professionals (22–35 years old)

**Target users:** People who want a clear, modern alternative to their traditional bank — focused on visibility, simplicity, and control.

**Core features to design:**

1. **Dashboard / Home screen** — balance overview, recent transactions, quick actions
2. **Transaction detail screen** — full detail of a single transaction, with category and notes
3. **Send money flow** — select recipient → enter amount → confirm → success (3–4 screens)

You are designing for **iOS mobile** (393 × 852px).

---

## Design Requirements

### Visual Design
- Consistent typography using a single sans-serif typeface (Inter or SF Pro recommended)
- A coherent colour palette with a primary brand colour and a neutral grey scale
- All interactive elements must meet WCAG AA contrast (4.5:1 minimum)
- Consistent use of spacing on an 8-point grid

### Components
- Build your UI from components (buttons, inputs, cards, nav bar)
- Create a minimal design system page within your Figma file with your tokens and components

### States
- Show at least one loading state and one error state anywhere in the flow
- Show the empty state for the transaction list

---

## Deliverables

Submit a **Figma file** containing:

1. **Design System page** — colour tokens, text styles, and base components
2. **Screens** — all required screens at full fidelity, organised by flow
3. **Prototype** — connected Figma prototype for the "Send money" flow (clickable and testable)
4. **Case study notes** — a short Figma page with your design decisions:
   - What was your visual direction and why?
   - What was the hardest design decision and how did you resolve it?
   - What would you improve with more time?

---

## Evaluation Criteria

| Criteria | Weight |
|---|---|
| Visual quality — hierarchy, spacing, consistency, polish | 30% |
| Component system — tokens, reusable components, variants | 20% |
| Accessibility — contrast, target sizes, states covered | 20% |
| Prototype — flow is complete, transitions are sensible | 15% |
| Case study notes — thoughtful reflection on decisions | 15% |

---

## Getting Started

1. Start with low-fi sketches on paper before opening Figma
2. Define your design tokens first (colours, spacing, type scale)
3. Build your component library before designing screens
4. Design mobile-first — 393px wide canvas

**Deadline:** Submit within 7 days of completing Module 4.`,
        resources: [
            { title: 'iOS Design Templates — Figma Community', url: 'https://www.figma.com/community/search?resource_type=files&q=ios+ui+kit', type: 'tool' },
            { title: 'Mobile Banking UI Inspiration — Dribbble', url: 'https://dribbble.com/search/mobile-banking', type: 'tool' },
            { title: 'WCAG Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/', type: 'tool' },
        ]
    },

}

// ─────────────────────────────────────────────────────────────────────────────
// Updater
// ─────────────────────────────────────────────────────────────────────────────

async function updateContent() {
    console.log('📝 Updating lesson content...\n')

    const titles = Object.keys(contentMap)
    let updated = 0
    let failed = 0

    for (const title of titles) {
        const { error } = await supabase
            .from('lessons')
            .update({ content: contentMap[title] })
            .eq('title', title)

        if (error) {
            console.error(`❌ Failed: "${title}" — ${error.message}`)
            failed++
        } else {
            console.log(`✅ Updated: "${title}"`)
            updated++
        }
    }

    console.log(`\n🎉 Done. ${updated} updated, ${failed} failed.`)
}

updateContent().catch(console.error)
