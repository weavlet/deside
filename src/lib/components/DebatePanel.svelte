<script lang="ts">
  import { decision } from '$lib/stores/decision.svelte';
  import { ArrowUp, MessageCircleQuestion, Square } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { marked } from 'marked';

  let draft = $state('');
  let textarea: HTMLTextAreaElement | null = $state(null);
  let scroller: HTMLDivElement | null = $state(null);
  let sending = $state(false);
  let abortCtrl: AbortController | null = null;

  marked.setOptions({ gfm: true, breaks: true });

  function renderMd(text: string): string {
    if (!text) return '';
    try {
      return marked.parse(text, { async: false }) as string;
    } catch {
      return text;
    }
  }

  function resize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
  }

  $effect(() => {
    void decision.debate.length;
    void decision.debate[decision.debate.length - 1]?.content;
    queueMicrotask(() => {
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
  });

  // Auto-start the debate the first time we enter the debate stage.
  // The flag lives on the shared store so the desktop + mobile instances
  // of this component don't both kick a request.
  $effect(() => {
    if (
      !decision.debateKicked &&
      !sending &&
      decision.stage === 'debate' &&
      decision.debate.length === 0 &&
      decision.options.length > 0
    ) {
      decision.debateKicked = true;
      decision.debate = [{ role: 'assistant', content: '' }];
      void requestAssistant();
    }
  });

  async function requestAssistant() {
    abortCtrl?.abort();
    abortCtrl = new AbortController();
    sending = true;

    try {
      const history = decision.debate
        .slice(0, -1)
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = {
        question: decision.question,
        options: decision.options.map((o) => ({
          name: o.name,
          total: decision.totals[o.id]?.pct ?? 0
        })),
        criteria: decision.criteria.map((c) => ({ name: c.name, weight: c.weight })),
        history
      };

      const res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortCtrl.signal
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed?.message || parsed?.error || text;
        } catch {
          /* raw text */
        }
        throw new Error(msg || `request failed (${res.status})`);
      }

      const data = (await res.json()) as { content: string };
      const idx = decision.debate.length - 1;
      if (idx >= 0) {
        decision.debate = [
          ...decision.debate.slice(0, idx),
          { role: 'assistant', content: data.content ?? '' }
        ];
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      const idx = decision.debate.length - 1;
      const msg =
        e instanceof Error ? e.message : 'Something went wrong. Try again.';
      if (idx >= 0 && !decision.debate[idx].content) {
        decision.debate = [
          ...decision.debate.slice(0, idx),
          { role: 'assistant', content: `**Error:** ${msg}` }
        ];
      }
    } finally {
      sending = false;
      if (decision.loading) decision.loading = false;
      abortCtrl = null;
    }
  }

  async function sendTurn() {
    const q = draft.trim();
    if (!q || sending) return;
    decision.debate = [
      ...decision.debate,
      { role: 'user', content: q },
      { role: 'assistant', content: '' }
    ];
    draft = '';
    resize();
    await requestAssistant();
  }

  function stop() {
    abortCtrl?.abort();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTurn();
    }
  }
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <!-- Header -->
  <div class="flex-none border-b border-zinc-900 px-5 py-4 sm:px-6">
    <div class="flex items-center gap-2">
      <MessageCircleQuestion size={14} class="text-emerald-400" />
      <span
        class="text-[10px] font-medium tracking-[0.18em] uppercase text-zinc-500"
      >
        Socratic debate
      </span>
    </div>
    <p class="mt-1 text-[13px] text-zinc-400">
      One question at a time. Surface the blindspots before you commit.
    </p>
  </div>

  <!-- Messages -->
  <div
    bind:this={scroller}
    class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
  >
    {#if decision.debate.length === 0}
      <div class="flex h-full items-center justify-center text-center">
        <p class="max-w-xs text-sm text-zinc-500">
          Hit <span class="text-zinc-300">Done</span> on the matrix to start.
        </p>
      </div>
    {/if}

    <div class="flex flex-col gap-4">
      {#each decision.debate as m, i (i)}
        {#if m.role === 'assistant'}
          <div
            class="max-w-[90%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-[14.5px] leading-relaxed text-zinc-100"
            in:fly={{ y: 4, duration: 220, easing: cubicOut }}
          >
            {#if m.content}
              <div class="md">
                {@html renderMd(m.content)}
              </div>
              {#if sending && i === decision.debate.length - 1}
                <span
                  class="ml-0.5 inline-block h-3 w-[2px] translate-y-[2px] animate-pulse bg-emerald-400"
                ></span>
              {/if}
            {:else}
              <span class="inline-flex gap-1">
                <span
                  class="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:-0.3s]"
                ></span>
                <span
                  class="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:-0.15s]"
                ></span>
                <span
                  class="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500"
                ></span>
              </span>
            {/if}
          </div>
        {:else}
          <div
            class="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-emerald-500/90 px-4 py-3 text-[14.5px] leading-relaxed text-emerald-950"
            in:fly={{ y: 4, duration: 220, easing: cubicOut }}
          >
            {m.content}
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Composer -->
  <div class="flex-none border-t border-zinc-900 px-4 pt-3 pb-4 sm:px-5">
    <div
      class="relative rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 focus-within:border-zinc-700 transition-colors"
    >
      <textarea
        bind:this={textarea}
        bind:value={draft}
        oninput={resize}
        onkeydown={handleKey}
        placeholder="Your response..."
        rows="1"
        class="block w-full resize-none bg-transparent px-2.5 py-2 pr-10 text-[14.5px] text-zinc-50 placeholder:text-zinc-500 focus:outline-none"
      ></textarea>
      {#if sending}
        <button
          type="button"
          onclick={stop}
          aria-label="Stop"
          class="absolute right-1.5 bottom-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-zinc-200 transition-all hover:bg-zinc-700 active:scale-95"
        >
          <Square size={12} fill="currentColor" />
        </button>
      {:else}
        <button
          type="button"
          onclick={sendTurn}
          disabled={!draft.trim()}
          aria-label="Send"
          class="absolute right-1.5 bottom-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-emerald-950 transition-all hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          <ArrowUp size={16} strokeWidth={2.25} />
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .md :global(p) {
    margin: 0 0 0.6em;
  }
  .md :global(p:last-child) {
    margin-bottom: 0;
  }
  .md :global(ul),
  .md :global(ol) {
    margin: 0.3em 0 0.6em 1.25em;
    padding: 0;
  }
  .md :global(ul) {
    list-style: disc;
  }
  .md :global(ol) {
    list-style: decimal;
  }
  .md :global(li) {
    margin: 0.15em 0;
  }
  .md :global(strong) {
    color: oklch(0.98 0 0);
    font-weight: 600;
  }
  .md :global(em) {
    color: oklch(0.85 0 0);
  }
  .md :global(code) {
    padding: 1px 5px;
    border-radius: 4px;
    background: oklch(0.24 0 0);
    font-size: 0.9em;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .md :global(pre) {
    margin: 0.4em 0;
    padding: 0.65em 0.8em;
    border-radius: 8px;
    background: oklch(0.2 0 0);
    overflow-x: auto;
    font-size: 0.88em;
  }
  .md :global(pre code) {
    padding: 0;
    background: transparent;
  }
  .md :global(blockquote) {
    margin: 0.4em 0;
    padding: 0.2em 0 0.2em 0.8em;
    border-left: 2px solid oklch(0.4 0 0);
    color: oklch(0.75 0 0);
  }
  .md :global(a) {
    color: oklch(0.77 0.17 163);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .md :global(h1),
  .md :global(h2),
  .md :global(h3) {
    margin: 0.5em 0 0.3em;
    font-weight: 600;
    color: oklch(0.98 0 0);
  }
  .md :global(h1) {
    font-size: 1.15em;
  }
  .md :global(h2) {
    font-size: 1.08em;
  }
  .md :global(h3) {
    font-size: 1em;
  }
</style>
