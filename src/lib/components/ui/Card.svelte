<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children }: Props = $props();
</script>

<div
  class={cn(
    'rounded-[var(--radius-lg)] border border-zinc-800/80 bg-zinc-900/40',
    'shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_60px_-30px_rgba(0,0,0,0.6)]',
    className
  )}
>
  {@render children?.()}
</div>
