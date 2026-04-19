<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    label: string;
    size?: 'sm' | 'md';
    tone?: 'neutral' | 'danger';
    children?: Snippet;
  }

  let {
    label,
    size = 'md',
    tone = 'neutral',
    class: className,
    children,
    ...rest
  }: Props = $props();

  const dim = $derived(size === 'sm' ? 'h-8 w-8' : 'h-10 w-10');
  const toneClass = $derived(
    tone === 'danger'
      ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10'
      : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/60'
  );
</script>

<button
  type="button"
  aria-label={label}
  title={label}
  class={cn(
    'inline-flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150',
    'cursor-pointer active:scale-95',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
    dim,
    toneClass,
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
