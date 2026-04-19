<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    value: string;
  }

  let { value = $bindable(), class: className, ...rest }: Props = $props();
</script>

<input
  bind:value
  class={cn(
    'h-10 w-full rounded-[var(--radius-md)] border border-zinc-800 bg-zinc-900/60 px-3',
    'text-[15px] text-zinc-50 placeholder:text-zinc-500',
    'transition-[border-color,background-color] duration-150',
    'focus:border-zinc-600 focus:bg-zinc-900 focus:outline-none',
    'disabled:opacity-50',
    className
  )}
  {...rest}
/>
