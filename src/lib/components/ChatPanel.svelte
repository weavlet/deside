<script lang="ts">
  import { decision } from '$lib/stores/decision.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { ArrowUp, Sparkles } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let draft = $state('');
  let textarea: HTMLTextAreaElement | null = $state(null);

  const suggestions = [
    'Should I take the job offer in NYC or stay remote?',
    "Move to Charlotte or stay in New York?",
    'Launch the startup now or finish the MBA first?',
    'Learn Rust this quarter or ship the side project?'
  ];

  function resize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
  }

  async function submit() {
    const q = draft.trim();
    if (!q || decision.loading) return;
    decision.error = null;
    decision.loading = true;
    decision.chat = [...decision.chat, { role: 'user', content: q }];
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed?.message || parsed?.error || text;
        } catch {
          /* fall back to raw text */
        }
        throw new Error(msg || 'Generation failed');
      }
      const data = (await res.json()) as {
        options: string[];
        criteria: { name: string; weight: number }[];
        prompts?: { option: number; criterion: number; question: string }[];
      };
      decision.seed(q, data.options, data.criteria, data.prompts ?? []);
    } catch (e) {
      decision.error = e instanceof Error ? e.message : 'Something went wrong';
    } finally {
      decision.loading = false;
      draft = '';
      resize();
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function useSuggestion(s: string) {
    draft = s;
    resize();
    textarea?.focus();
  }

  function loadExample() {
    const options = ['Charlotte', 'New York'];
    const criteria = [
      { name: 'Cost of Living', weight: 9 },
      { name: 'Career Opportunities', weight: 8 },
      { name: 'Creator Scene / Networking', weight: 8 },
      { name: 'Quality of Life', weight: 7 },
      { name: 'Nightlife & Culture', weight: 5 },
      { name: 'Walkability / Transit', weight: 4 }
    ];
    const prompts: { option: number; criterion: number; question: string }[] = [];
    const qs: Record<string, [string, string]> = {
      'Cost of Living': [
        'How well does Charlotte fit your budget? (10 = very affordable, 0 = still stretching)',
        'How well does New York fit your budget? (10 = comfortable, 0 = bleeding savings)'
      ],
      'Career Opportunities': [
        'How strong are career options in Charlotte for your field? (10 = rich market, 0 = desert)',
        'How strong is your career upside staying in New York right now? (10 = elite, 0 = stagnant)'
      ],
      'Creator Scene / Networking': [
        "How well does Charlotte's creator scene match your needs? (10 = tribe ready, 0 = isolated)",
        "How well does NYC's in-person network move your career? (10 = huge unlock, 0 = no lift)"
      ],
      'Quality of Life': [
        'How much would Charlotte improve your daily quality of life? (10 = huge, 0 = none)',
        "How much does NYC's daily quality of life energize you? (10 = thrives, 0 = drains)"
      ],
      'Nightlife & Culture': [
        "How well does Charlotte's nightlife/culture match your lifestyle? (10 = perfect, 0 = bleak)",
        'How often do you actually use NYC nightlife/culture? (10 = weekly, 0 = rarely)'
      ],
      'Walkability / Transit': [
        "How well does Charlotte's transit fit how you want to move? (10 = seamless, 0 = car-trapped)",
        'How well does NYC transit serve you day-to-day? (10 = effortless, 0 = nightmare)'
      ]
    };
    for (let ci = 0; ci < criteria.length; ci++) {
      const pair = qs[criteria[ci].name];
      for (let oi = 0; oi < options.length; oi++) {
        prompts.push({ option: oi, criterion: ci, question: pair?.[oi] ?? '' });
      }
    }
    decision.seed(
      'Move to Charlotte or stay in New York?',
      options,
      criteria,
      prompts
    );
  }
</script>

<div
  class="flex min-h-0 flex-1 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10"
>
  <div class="flex w-full flex-col items-center gap-8">
    <div
      class="flex flex-col items-center gap-3 text-center"
      in:fade={{ duration: 300 }}
    >
      <div
        class="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-400 uppercase"
      >
        <Sparkles size={12} class="text-emerald-400" />
        <span>deside</span>
      </div>
      <h1 class="fraunces text-4xl sm:text-5xl leading-[1.05] tracking-tight text-zinc-50">
        What are you
        <span class="italic text-zinc-400">confused</span> about?
      </h1>
      <p class="max-w-md text-[15px] text-zinc-500">
        Describe the decision in one sentence. We'll frame it as a weighted matrix you can score.
      </p>
    </div>

    <div
      class="w-full max-w-xl"
      in:fly={{ y: 12, duration: 400, easing: cubicOut, delay: 80 }}
    >
      <div
        class="relative rounded-[var(--radius-lg)] border border-zinc-800 bg-zinc-900/60 p-2
               focus-within:border-zinc-700 focus-within:bg-zinc-900/80 transition-colors"
      >
        <textarea
          bind:this={textarea}
          bind:value={draft}
          oninput={resize}
          onkeydown={handleKey}
          disabled={decision.loading}
          placeholder="what are you confused about?"
          rows="1"
          class="block w-full resize-none bg-transparent px-3 py-3 pr-12 text-[15px] text-zinc-50 placeholder:text-zinc-500 focus:outline-none"
        ></textarea>
        <button
          type="button"
          onclick={submit}
          disabled={decision.loading || !draft.trim()}
          aria-label="Generate decision matrix"
          class="absolute bottom-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]
                 bg-emerald-500 text-emerald-950 transition-all duration-150
                 hover:bg-emerald-400 active:scale-95
                 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          {#if decision.loading}
            <span class="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"></span>
          {:else}
            <ArrowUp size={18} strokeWidth={2.25} />
          {/if}
        </button>
      </div>

      {#if decision.error}
        <div class="mt-3 flex items-start gap-3 text-sm" transition:fade>
          <p class="flex-1 text-rose-400">{decision.error}</p>
          <button
            type="button"
            onclick={loadExample}
            class="shrink-0 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            Try an example
          </button>
        </div>
      {/if}

      <div class="mt-5 flex flex-wrap gap-2">
        {#each suggestions as s, i (s)}
          <button
            type="button"
            onclick={() => useSuggestion(s)}
            class="rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400
                   transition-colors hover:border-zinc-700 hover:text-zinc-200
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            in:fly={{ y: 6, duration: 300, delay: 200 + i * 40, easing: cubicOut }}
          >
            {s}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
