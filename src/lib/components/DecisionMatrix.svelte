<script lang="ts">
  import { decision } from '$lib/stores/decision.svelte';
  import Slider from '$lib/components/ui/Slider.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Plus, X, Check, RotateCcw, HelpCircle } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  // Per-option color palette (cycled). Each entry maps to Slider `tone` + tally color.
  const PALETTE = ['emerald', 'amber', 'sky', 'violet', 'rose', 'cyan'] as const;

  type PaletteKey = (typeof PALETTE)[number];
  // Only the Slider component supports these tones:
  const SLIDER_TONES: PaletteKey[] = ['emerald', 'amber'];

  function sliderTone(idx: number): 'emerald' | 'amber' | 'neutral' {
    // Use real Slider tones for first two; fall back to neutral.
    const t = PALETTE[idx % PALETTE.length];
    return SLIDER_TONES.includes(t) ? (t as 'emerald' | 'amber') : 'neutral';
  }

  function optionAccentClass(idx: number): string {
    const map: Record<PaletteKey, string> = {
      emerald: 'text-emerald-400',
      amber: 'text-amber-400',
      sky: 'text-sky-400',
      violet: 'text-violet-400',
      rose: 'text-rose-400',
      cyan: 'text-cyan-400'
    };
    return map[PALETTE[idx % PALETTE.length]];
  }

  let newCriterion = $state('');
  let editingOptionId = $state<string | null>(null);
  let optionNameDraft = $state('');
  let openPrompt = $state<string | null>(null); // key: `${optionId}:${criterionId}`

  function promptKey(optionId: string, criterionId: string) {
    return `${optionId}:${criterionId}`;
  }
  function togglePrompt(optionId: string, criterionId: string) {
    const k = promptKey(optionId, criterionId);
    openPrompt = openPrompt === k ? null : k;
  }

  function addCriterion() {
    const n = newCriterion.trim();
    if (!n) return;
    decision.addCriterion(n, 5);
    newCriterion = '';
  }

  function startEditOption(id: string, name: string) {
    editingOptionId = id;
    optionNameDraft = name;
  }

  function commitOption(id: string) {
    const n = optionNameDraft.trim();
    if (n) decision.renameOption(id, n);
    editingOptionId = null;
  }

  async function onDone() {
    decision.stage = 'debate';
    decision.mobilePanel = 'debate';
    // DebatePanel auto-kicks the first turn when it sees an empty debate
    // with stage === 'debate'. Keeping the initial turn inside DebatePanel
    // means the composer's own `sending` state governs streaming and the
    // user can always type + send without waiting on a stuck global flag.
  }

  // Visible options/criteria reactive refs
  const criteria = $derived(decision.criteria);
  const options = $derived(decision.options);
  const totals = $derived(decision.totals);
  const winningId = $derived(decision.winningId);
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <!-- Header -->
  <div class="flex items-start justify-between gap-4 border-b border-zinc-900 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
    <div class="min-w-0 flex-1">
      <div class="text-[10px] font-medium tracking-[0.18em] uppercase text-zinc-500">Decision</div>
      <h2 class="fraunces mt-1 text-xl sm:text-2xl leading-tight text-zinc-50 line-clamp-2">
        {decision.question || 'Untitled decision'}
      </h2>
    </div>
    <IconButton label="Start over" size="sm" onclick={() => decision.reset()}>
      <RotateCcw size={14} />
    </IconButton>
  </div>

  <!-- Option tallies -->
  <div class="flex-none px-5 pt-5 sm:px-7">
    <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
      {#each options as o, i (o.id)}
        {@const t = totals[o.id] ?? { raw: 0, pct: 0 }}
        {@const isWinner = winningId === o.id && t.pct > 0}
        <div
          class="relative min-w-[150px] flex-1 rounded-lg border px-4 py-3 transition-all duration-300 ease-out {isWinner
            ? 'border-zinc-700 bg-zinc-900/80 ring-1 ring-emerald-500/20'
            : 'border-zinc-800 bg-zinc-900/30'}"
          in:fly={{ y: 8, duration: 280, delay: i * 40, easing: cubicOut }}
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="h-1.5 w-1.5 rounded-full bg-current {optionAccentClass(i)}"></span>
              {#if editingOptionId === o.id}
                <input
                  bind:value={optionNameDraft}
                  onblur={() => commitOption(o.id)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') commitOption(o.id);
                    if (e.key === 'Escape') editingOptionId = null;
                  }}
                  {@attach (node) => {
                    node.focus();
                    node.select();
                  }}
                  class="min-w-0 flex-1 rounded-sm bg-zinc-800 px-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-zinc-50 outline-none ring-1 ring-emerald-500/60"
                />
              {:else}
                <button
                  type="button"
                  onclick={() => startEditOption(o.id, o.name)}
                  class="truncate text-[10px] font-semibold tracking-[0.14em] uppercase text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  {o.name}
                </button>
              {/if}
            </div>
            <button
              type="button"
              aria-label="Remove option"
              onclick={() => decision.removeOption(o.id)}
              class="text-zinc-600 hover:text-rose-400 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div class="mt-1.5 flex items-baseline gap-2">
            <span class="fraunces text-3xl leading-none tabular-nums text-zinc-50">
              {Math.round(t.pct)}
            </span>
            <span class="text-xs text-zinc-500 tabular-nums">
              {t.raw.toFixed(0)} raw
            </span>
          </div>
          <div class="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              class="h-full rounded-full transition-all duration-300 ease-out {optionAccentClass(i).replace(
                'text-',
                'bg-'
              )}"
              style="width: {t.pct}%"
            ></div>
          </div>
        </div>
      {/each}
      <button
        type="button"
        onclick={() => decision.addOption(`Option ${options.length + 1}`)}
        class="flex min-w-[110px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-800 bg-transparent px-4 py-3 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
      >
        <Plus size={16} />
        <span class="text-[10px] font-medium tracking-wide uppercase">Option</span>
      </button>
    </div>
  </div>

  <!-- Matrix body -->
  <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-6 sm:px-7">
    <Card class="overflow-hidden">
      <!-- Table header (md+) -->
      <div
        class="hidden md:grid items-center border-b border-zinc-800 px-4 py-2.5 text-[10px] font-medium tracking-[0.14em] uppercase text-zinc-500"
        style="grid-template-columns: minmax(140px, 1.4fr) minmax(0, 1fr) repeat({options.length}, minmax(0, 1.4fr));"
      >
        <span>Criterion</span>
        <span>Weight</span>
        {#each options as o, i (o.id)}
          <span class="truncate {optionAccentClass(i)}">{o.name}</span>
        {/each}
      </div>

      {#if criteria.length === 0}
        <div class="px-4 py-8 text-center text-sm text-zinc-500">
          No criteria yet. Add one below.
        </div>
      {/if}

      {#each criteria as c, ci (c.id)}
        <div
          class="border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-900/20 transition-colors"
          in:fly={{ y: 6, duration: 260, delay: ci * 30, easing: cubicOut }}
        >
          <!-- Desktop/tablet: single grid row -->
          <div
            class="hidden md:grid items-center gap-x-4 px-4 py-2.5"
            style="grid-template-columns: minmax(140px, 1.4fr) minmax(0, 1fr) repeat({options.length}, minmax(0, 1.4fr));"
          >
            <div class="flex items-center gap-2 min-w-0 pr-2 group/row">
              <button
                type="button"
                onclick={() => {
                  const next = prompt('Rename criterion', c.name);
                  if (next && next.trim()) decision.renameCriterion(c.id, next.trim());
                }}
                class="truncate text-left text-[13px] text-zinc-300 hover:text-zinc-50 transition-colors"
              >
                {c.name}
              </button>
              <button
                type="button"
                aria-label="Remove criterion"
                onclick={() => decision.removeCriterion(c.id)}
                class="ml-auto text-zinc-600 hover:text-rose-400 transition-colors opacity-0 group-hover/row:opacity-100"
              >
                <X size={12} />
              </button>
            </div>

            <div class="flex items-center gap-2">
              <Slider
                value={c.weight}
                tone="neutral"
                aria-label={`Weight for ${c.name}`}
                onchange={(v) => decision.setWeight(c.id, v)}
              />
              <span class="w-5 text-right text-[12px] tabular-nums text-zinc-500">
                {c.weight}
              </span>
            </div>

            {#each options as o, oi (o.id)}
              {@const score = o.scores[c.id] ?? 0}
              {@const prompt = o.prompts?.[c.id] ?? ''}
              {@const isOpen = openPrompt === promptKey(o.id, c.id)}
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5">
                  <div class="flex-1">
                    <Slider
                      value={score}
                      tone={sliderTone(oi)}
                      aria-label={`${o.name} - ${c.name}`}
                      onchange={(v) => decision.setScore(o.id, c.id, v)}
                    />
                  </div>
                  <span class="w-5 text-right text-[12px] tabular-nums text-zinc-500">
                    {score}
                  </span>
                  {#if prompt}
                    <button
                      type="button"
                      onclick={() => togglePrompt(o.id, c.id)}
                      aria-label="Show scoring question"
                      aria-expanded={isOpen}
                      title={prompt}
                      class="shrink-0 text-zinc-600 hover:text-emerald-400 transition-colors {isOpen
                        ? 'text-emerald-400'
                        : ''}"
                    >
                      <HelpCircle size={13} />
                    </button>
                  {/if}
                </div>
                {#if isOpen && prompt}
                  <p
                    class="rounded-md bg-zinc-900/60 px-2 py-1.5 text-[11.5px] leading-snug text-zinc-300"
                    in:fade={{ duration: 120 }}
                  >
                    {prompt}
                  </p>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Mobile: stacked card -->
          <div class="md:hidden px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <button
                type="button"
                onclick={() => {
                  const next = prompt('Rename criterion', c.name);
                  if (next && next.trim()) decision.renameCriterion(c.id, next.trim());
                }}
                class="flex-1 truncate text-left text-[14px] font-medium text-zinc-200 hover:text-zinc-50 transition-colors"
              >
                {c.name}
              </button>
              <div class="flex items-center gap-2 min-w-[110px]">
                <span class="text-[10px] font-medium tracking-wider uppercase text-zinc-600">W</span>
                <div class="flex-1">
                  <Slider
                    value={c.weight}
                    tone="neutral"
                    aria-label={`Weight for ${c.name}`}
                    onchange={(v) => decision.setWeight(c.id, v)}
                  />
                </div>
                <span class="w-4 text-right text-[12px] tabular-nums text-zinc-400">
                  {c.weight}
                </span>
              </div>
              <button
                type="button"
                aria-label="Remove criterion"
                onclick={() => decision.removeCriterion(c.id)}
                class="text-zinc-600 hover:text-rose-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div class="mt-2 space-y-2 pl-1">
              {#each options as o, oi (o.id)}
                {@const score = o.scores[c.id] ?? 0}
                {@const prompt = o.prompts?.[c.id] ?? ''}
                {@const isOpen = openPrompt === promptKey(o.id, c.id)}
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="w-16 shrink-0 truncate text-[11px] font-medium tracking-wider uppercase {optionAccentClass(oi)}">
                      {o.name}
                    </span>
                    <div class="flex-1">
                      <Slider
                        value={score}
                        tone={sliderTone(oi)}
                        aria-label={`${o.name} - ${c.name}`}
                        onchange={(v) => decision.setScore(o.id, c.id, v)}
                      />
                    </div>
                    <span class="w-4 text-right text-[12px] tabular-nums text-zinc-500">
                      {score}
                    </span>
                    {#if prompt}
                      <button
                        type="button"
                        onclick={() => togglePrompt(o.id, c.id)}
                        aria-label="Show scoring question"
                        aria-expanded={isOpen}
                        class="shrink-0 text-zinc-500 hover:text-emerald-400 transition-colors {isOpen
                          ? 'text-emerald-400'
                          : ''}"
                      >
                        <HelpCircle size={14} />
                      </button>
                    {/if}
                  </div>
                  {#if isOpen && prompt}
                    <p
                      class="ml-[72px] rounded-md bg-zinc-900/60 px-2 py-1.5 text-[12px] leading-snug text-zinc-300"
                      in:fade={{ duration: 120 }}
                    >
                      {prompt}
                    </p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}

      <!-- Add criterion inline -->
      <div class="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-zinc-800 bg-zinc-950/40 px-3 py-2">
        <Input
          bind:value={newCriterion}
          placeholder="Add a criterion..."
          onkeydown={(e) => {
            if ((e as KeyboardEvent).key === 'Enter') addCriterion();
          }}
        />
        <Button variant="primary" size="sm" onclick={addCriterion}>
          <Plus size={14} />
          Add
        </Button>
      </div>
    </Card>
  </div>

  <!-- Footer / Done CTA -->
  <div class="flex-none border-t border-zinc-900 bg-zinc-950/80 px-5 py-3 sm:px-7 backdrop-blur">
    <div class="flex items-center justify-between gap-3">
      <p class="text-[12px] text-zinc-500">
        {#if decision.stage === 'debate'}
          Debate in progress. Adjust scores any time.
        {:else}
          <span class="italic">Drag sliders to score. 0 is fine.</span>
        {/if}
      </p>
      {#if decision.stage !== 'debate'}
        <Button variant="primary" onclick={onDone}>
          <Check size={14} />
          Done
        </Button>
      {/if}
    </div>
  </div>
</div>
