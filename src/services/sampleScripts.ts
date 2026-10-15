import type { Script } from '../types';

export const SAMPLE_SCRIPTS: Script[] = [
  {
    id: 'sample-college-presentation',
    title: 'College Presentation: The Architecture of Generative AI',
    category: 'presentation',
    wordCount: 285,
    estimatedDurationSec: 125,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    content: `Good morning everyone, and welcome to today's seminar.

[Smile & maintain direct eye contact with audience]
Today, we are examining the core architecture behind Modern Generative AI and Large Language Models.

Over the past three years, the paradigm of computing shifted from explicit rule-based algorithms to probabilistic deep representations.

[Pause 2s - Advance Slide 1]
At the center of this revolution is the Transformer architecture, introduced by Vaswani and colleagues in 2017. Unlike recurrent networks that processed tokens sequentially, Transformers leverage multi-head self-attention.

This breakthrough unlocked two massive advantages:
First, massive parallelization during training across GPU clusters.
Second, the ability to capture long-range semantic dependencies without vanishing gradient degradation.

[Look at camera with emphasis]
Notice how attention allows every single word in a document to attend directly to every other word, regardless of their distance.

When combined with Reinforcement Learning from Human Feedback—or RLHF—we bridge the gap between raw statistical text completion and goal-oriented helpful reasoning.

[Pause 1.5s - Summarize key takeaway]
In conclusion: Generative AI is not merely predictive text. It is an emergent compressed world model.

Thank you for your attention, and I now welcome any questions from the committee.`,
  },
  {
    id: 'sample-youtube-intro',
    title: 'YouTube Intro: Why 99% of Developers Learn the Wrong Skills',
    category: 'youtube',
    wordCount: 242,
    estimatedDurationSec: 105,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    content: `[High energy, smile, look dead-center at lens]
Stop memorizing syntax. If you are spending months tutorial-hell looping through JavaScript frameworks, you are falling into the trap that burns out 99% of aspiring engineers.

[Pause 1.5s - Zoom effect]
Here is the uncomfortable truth: In 2026, AI can write syntax faster than you ever will.

What companies pay $200k for isn't typing speed. It's system thinking, edge-case anticipation, and debugging resilience.

[Lean forward slightly]
In this video, I am breaking down the three high-leverage mental models that actually accelerated my career from junior to staff engineer in under four years:

1. First: Inversion Debugging—why diagnosing failures backwards cuts troubleshooting time by 70%.
2. Second: API Contract First Architecture.
3. And third: Understanding telemetry before you write a single line of business logic.

[Smile, gesture to subscribe]
If you find this valuable, hit that subscribe button, grab a coffee, and let's jump straight into the terminal.`,
  },
  {
    id: 'sample-talking-head-update',
    title: 'Executive Talking-Head: Q4 Product Innovation Roadmap',
    category: 'talking-head',
    wordCount: 220,
    estimatedDurationSec: 98,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    content: `Hello team, and welcome to our quarterly strategy update.

[Warm smile, steady gaze]
I want to begin by expressing my heartfelt gratitude to every engineering, product, and customer-success lead across all timezones.

Thanks to your discipline and customer focus, our platform reached 10 million active sessions this quarter, while maintaining 99.99% uptime.

[Pause 2s - Transition to future goals]
As we head into Q4, our priority is clear: Seamless, local-first studio intelligence.

We are reducing friction for creators, students, and educators. By putting zero-latency video processing directly on user hardware, we protect user privacy while cutting cloud rendering costs to zero.

[Look at camera with conviction]
Great products aren't built on complexity. They are built on removing every ounce of friction between an idea and its execution.

Let's maintain this momentum and continue setting the industry benchmark. Thank you.`,
  },
  {
    id: 'sample-pitch-promptstudio',
    title: 'Pitch: PromptStudio — Creator-Grade Teleprompter',
    category: 'pitch',
    wordCount: 215,
    estimatedDurationSec: 92,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    content: `[Confident demeanor, eye level directly aligned]
How many takes did your last presentation or video pitch take?

If you are like most creators and executives, you look down at notes, lose eye contact with your audience, hesitate, and restart the recording ten times.

[Pause 2s]
This is why we built PromptStudio.

PromptStudio places your script right where it belongs: transparently floating directly over your live camera preview, right at the webcam lens level.

[Point subtle gesture]
You never break eye contact. Your delivery is flawless. And with one click, your high-definition video is saved directly to your Desktop—with zero cloud uploads, zero latency, and absolute privacy.

Whether you are defending your Master's thesis, pitching investors, or shooting your next YouTube video, PromptStudio gives you broadcast-studio confidence right on your laptop.

[Smile and close]
Stop re-recording. Start delivering with PromptStudio.`,
  },
];
