# deside

A minimalist decision-maker. Type the dilemma, get a weighted decision matrix, score each option, then have a Socratic debate with an AI agent who pressure-tests your choice.

Built with SvelteKit 2 + Svelte 5 runes, Tailwind v4, and OpenRouter (Claude Sonnet 4.5).

## Stack

- **SvelteKit 2** + **Svelte 5** (runes mode, no stores)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **OpenRouter** for LLM calls (default model: `anthropic/claude-sonnet-4.5`)
- **Zod** for strict JSON validation of structured LLM output
- **lucide-svelte** for icons

## Flow

1. **Chat** - One-line prompt "what are you confused about?". Submitting POSTs to `/api/generate`, which asks the LLM to frame the dilemma as 3-6 options and 5-8 weighted criteria (JSON-mode, Zod-validated).
2. **Matrix** - Every criterion has a weight slider (0-10); every option has a score slider per criterion (0-10). Totals are derived live. Tally cards update in real time; the winning option is highlighted.
3. **Debate** - Once every cell is scored, hitting _Done_ opens the Socratic panel. `/api/debate` streams plain text from OpenRouter (SSE deltas are unwrapped server-side). The AI asks one question at a time to surface blindspots.

## Layout

- **Desktop (lg+)**: matrix on the left, right-side drawer holds the debate.
- **Mobile (<lg)**: stacked panels with a 3-tab bottom nav (Chat / Matrix / Debate). The matrix auto-switches from a compact table at md+ to a stacked card-per-criterion layout below md.

Everything fits inside `100dvh` — no page scroll, only internal panel scroll.

## Run

```bash
cp env.example .env      # then fill in OPENROUTER_API_KEY
npm install
npm run dev
```

Visit http://localhost:5173 (or whatever port Vite picks).

### Demo mode without an API key

Append `?demo=1` to seed a sample matrix without calling the LLM. You can drive the full UI (sliders, tabs, Done button) without a key — only the debate needs a live model.

## Layout at a glance

```
src/
├── app.css                        # Tailwind theme tokens, focus ring, reduced-motion
├── app.html                       # Fonts (Inter, Fraunces), dark html
├── lib/
│   ├── stores/decision.svelte.ts  # single runed class: stage, options, criteria,
│   │                              # messages, $derived totals & winner
│   ├── server/openrouter.ts       # callOpenRouter() and callOpenRouterJSON<T>()
│   ├── components/
│   │   ├── ChatPanel.svelte       # placeholder prompt + suggestion chips
│   │   ├── DecisionMatrix.svelte  # tally cards + table/card rows + Done CTA
│   │   ├── DebatePanel.svelte     # streaming chat with typing indicator
│   │   └── ui/                    # Button, IconButton, Slider, Input, Card
│   ├── types.ts
│   └── utils.ts                   # cn(), uid()
└── routes/
    ├── +layout.svelte
    ├── +page.svelte               # responsive shell (split / tabbed)
    └── api/
        ├── generate/+server.ts    # JSON mode + Zod
        └── debate/+server.ts      # SSE passthrough (stream)
```

## Design notes

Design system comes from the in-repo `ui-ux-pro-max` skill — we asked it for a pattern and style for a minimalist dark productivity tool, then tuned it toward zinc + emerald with a Fraunces accent for decision-language (titles use the serif; numbers use tabular Inter).

Per-option color coding (emerald / amber / sky / violet / rose / cyan) makes cross-option comparison scannable without relying on legends. Slider thumbs use option-matched tones; weights stay neutral white.

All transitions respect `prefers-reduced-motion`. Focus rings use the accent. Touch targets are >=44px.
# deside
