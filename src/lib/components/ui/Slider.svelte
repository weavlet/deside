<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    tone?: 'neutral' | 'emerald' | 'amber';
    'aria-label'?: string;
    onchange?: (value: number) => void;
    class?: string;
  }

  let {
    value,
    min = 0,
    max = 10,
    step = 1,
    tone = 'neutral',
    'aria-label': ariaLabel,
    onchange,
    class: className
  }: Props = $props();

  const pct = $derived(((value - min) / (max - min)) * 100);

  const toneColor: Record<NonNullable<Props['tone']>, string> = {
    neutral: 'oklch(0.98 0 0)',
    emerald: 'oklch(0.77 0.17 163)',
    amber: 'oklch(0.83 0.19 84)'
  };
  const fg = $derived(toneColor[tone]);

  function handle(e: Event) {
    const v = Number((e.currentTarget as HTMLInputElement).value);
    onchange?.(v);
  }
</script>

<input
  type="range"
  {min}
  {max}
  {step}
  {value}
  aria-label={ariaLabel}
  oninput={handle}
  onchange={handle}
  class={cn('deside-slider', className)}
  style="--pct: {pct}%; --fg: {fg};"
/>

<style>
  .deside-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 44px;
    background: transparent;
    cursor: grab;
    padding: 0;
    margin: 0;
    touch-action: none;
    display: block;
    pointer-events: auto;
  }
  .deside-slider:active {
    cursor: grabbing;
  }
  .deside-slider:focus {
    outline: none;
  }
  .deside-slider:focus-visible::-webkit-slider-thumb {
    box-shadow:
      0 0 0 4px oklch(0.15 0 0),
      0 0 0 6px var(--fg);
  }
  .deside-slider:focus-visible::-moz-range-thumb {
    box-shadow:
      0 0 0 4px oklch(0.15 0 0),
      0 0 0 6px var(--fg);
  }
  .deside-slider::-webkit-slider-runnable-track {
    height: 3px;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      var(--fg) 0%,
      var(--fg) var(--pct),
      oklch(0.29 0 0) var(--pct),
      oklch(0.29 0 0) 100%
    );
  }
  .deside-slider::-moz-range-track {
    height: 3px;
    border-radius: 9999px;
    background: oklch(0.29 0 0);
  }
  .deside-slider::-moz-range-progress {
    height: 3px;
    border-radius: 9999px;
    background: var(--fg);
  }
  .deside-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: var(--fg);
    border: 1.5px solid var(--fg);
    box-shadow:
      0 0 0 4px rgba(0, 0, 0, 0.45),
      0 1px 2px rgba(0, 0, 0, 0.6);
    margin-top: -6.5px;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease;
  }
  .deside-slider:hover::-webkit-slider-thumb {
    transform: scale(1.1);
  }
  .deside-slider:active::-webkit-slider-thumb {
    transform: scale(1.15);
  }
  .deside-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: var(--fg);
    border: 1.5px solid var(--fg);
    box-shadow:
      0 0 0 4px rgba(0, 0, 0, 0.45),
      0 1px 2px rgba(0, 0, 0, 0.6);
    transition:
      transform 120ms ease,
      box-shadow 120ms ease;
  }
  .deside-slider:hover::-moz-range-thumb {
    transform: scale(1.1);
  }
  .deside-slider:active::-moz-range-thumb {
    transform: scale(1.15);
  }
</style>
