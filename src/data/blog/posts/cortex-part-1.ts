import type { SwymbleBlogPost } from '../../types';

export const CORTEX_PART_1_POST: SwymbleBlogPost = {
    id: 'cortex-part-1',
    title: 'Cortex - Part 1: The Introduction',
    date: '2026-03-08',
    summary: 'An introduction to Cortex, my proprietary cognitive platform focused on long-context memory and conversation.',
    tags: ['AI', 'R&D', 'Cortex'],
    categories: ['cortex'],
    coverImage: '/cortex_website.png',
    content: [
        { 
            type: 'heading', text: 'What Is Cortex', level: 2 
        },
        {
            type: 'paragraph',
            text: "Cortex is an AI companion that I've been building from scratch. It isn't a ChatGPT wrapper or a *prompt chain* with some pretty UI. Cortex is a full, ground-up system designed around a single question I kept coming back to:"   ,
        },
        {
            type: 'question',
            text: [
                'What would it actually feel like to have an AI that knows you?',
                'Not just in the moment, but over time, with a deep understanding of your work, your preferences, and your goals?',
            ],
        },
        {
            type: 'paragraph',
            text: [
                "Not just in a surface-level way, where it remembers your name or your job title. But deeply. One that picks up on how you're feeling on a given day. One that remembers the thing you mentioned three weeks ago and connects it to something you're struggling with now. One that gets smarter with you the longer you use it.",
                "\nThat's what I set out to build. And Cortex was my answer."
            ],
        },
        { 
            type: 'heading', text: 'Why I Built This', level: 2 
        },
        {
            type: 'paragraph',
            text: [
                `AI tools have evolved at a rapid pace and while they are genuinely impressive, I've been frustrated with the ceiling of their capabilities. You open the app, you chat, you close it. Tomorrow, it's like you never met.`,
                `\nThe smarter these models get, the more that limitation stands out. You're talking to something extraordinarily capable, but it has no continuity with you outside of that single session. No memory of your patterns, preferences, or context. Every conversation starts cold.`
            ]
        },
        { 
            type: 'heading', text: 'The Core Idea: A Working Brain', level: 2 
        },
        {
            type: 'paragraph',
            text: [
                `The concept that everything else is built around was the idea of a working brain. Instead of a single AI responding to everything the same way, Cortex routes your messages to different "sections" of the brain depending on what you're trying to get out of the conversation.`,
                '\nFour main regions, each one with a distinct role:'
            ]
        },
        {
            type: 'list',
            style: 'bullet',
            items: [
                `**Limbic** - Emotional core. When you're processing something hard, venting, or need to feel genuinely heard, Limbic handles it with empathy instead of generic filler.`,
                `**Prefrontal** - Structured logic. Planning, problem-solving, and breaking down decisions into clear next actions.`,
                `**Amygdala** - Fast and direct. Quick questions get quick answers because not every message needs a five-paragraph response.`,
                `**Hippocampus** - Memory store. Every conversation is indexed, graph and vector, so Cortex can actually recall what you've told it across sessions, not just within one.`
            ],
        },
        {
            type: 'paragraph',
            text: `The routing between these regions happens automatically. You don't have to specify which mode you want. The system reads intent and routes accordingly. I've been calling that layer the **Thalamus**.`,
        },
        {
            type: 'image', src: '/cortex_brain_regions.png', caption: 'Diagram of Cortex Brain Regions' 
        },
        {
            type: 'heading', text: 'Memory That Actually Works', level: 2,
        },
        {
            type: 'paragraph',
            text: [
                `The memory system is where I've spent the most time and honestly it's the part that I'm most proud of.`,
                `When you have a conversation with Cortex, it doesn't just store a transcript. It extracts meaning from what you said, like people, places, topics, feelings, unresolved threads, and it builds a picture of your world over time. So when something is relevant later, it can surface it, even if you said it weeks ago in completely different words.`,
                `\nThere's also a layer I've been calling temporal intelligence, the system tracking not just what you talked about, but when and how those topics evolve over time. What's been on your mind lately? What patterns show up in your weeks? What did you say you were going to do, and did you ever come back to it?`,
                `\nIt starts to feel less like a chatbot and more like something that actually follows your life.`
            ]        
        },
        {
            type: 'heading', text: 'The Dreaming System', level: 2,
        },
        {
            type: 'paragraph',
            text: [
                'This one is harder to explain, but it might be my favourite piece of the whole thing.',
                "\nEvery day, and on a longer cycle overnight, Cortex runs what I call a dreaming cycle. During these cycles, it reviews everything that's happened, conversations, emotions, memories, patterns and synthesises them into deeper insights. It generates reflections, surfaces connections, and updates its understanding of you.",
                '\nThe reason I call it "dreaming" is just inspired by how sleep works in humans, where its not just rest but active consolidation. The brain during sleep is never idle, it\'s processing the day, finding meaning, strengthening what matters and letting go of what doesn\'t.',
                '\nCortex does the same thing. When you\'re not actively talking to it, it\'s still working. And the next time you open a conversation, it carries something forward.',
                '\nI get a morning brief from it most days. It\'s genuinely one of the more surreal things I\'ve made, reading a summary of what my own system noticed about my week.'
            ]
        },
        {
            type: 'heading', text: 'Emotion, Actually Taken Seriously', level: 2,
        },
        {
            type: 'paragraph',
            text: [
                'Most AI systems dont really have emotional intelligence or they are just prompts to emulate emotions. They\'ll acknowledge if you say "I\'m stressed" and then immediately pivot to solutions.',
                '\nI wanted Cortex to actually classify what you\'re feeling and do something thoughtful with that information. There\'s a full emotion system running in the background where it identifies primary and secondary emotional states from what you write, tracks trajectories across conversations, and feeds that context back into how Cortex responds.',
                '\nOver time, it starts building a picture of your emotional patterns. That\'s not something that I\'ve seen done elsewhere, and its something that I really care about getting right.'
            ]
        },
        {
            type: 'heading', text: 'End of Part 1', level: 2,
        },
        {
            type: 'paragraph',
            text: [
                'There\'s alot more to get into, the task system, the way of how I tried to approach security the specific technical decisions and changes I made halfway into it. I\'ll do my best to cover all of that in my other blog posts',
                '\nBut I just wanted to start here. With the *why* and the *what* before diving into the how.',
                '\nCortex is the most ambitious thing I\'ve built. It\'s still a work in progress though mind you. But its alive and running. And everyday it gets a little bit more like what I imagined when I started',
                '\nI can\'t wait to share more soon.'
            ]
        }
    ],
};

export default CORTEX_PART_1_POST;
