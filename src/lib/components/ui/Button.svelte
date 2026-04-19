<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md' | 'lg';

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children?: Snippet;
  }

  let {
    variant = 'secondary',
    size = 'md',
    loading = false,
    class: className,
    disabled,
    children,
    ...rest
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium ' +
    'transition-[background-color,color,transform,border-color] duration-200 ease-out ' +
    'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 select-none ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ' +
    "cursor-pointer whitespace-nowrap tabular-nums";

  const variants: Record<Variant, string> = {
    primary:
      'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]',
    secondary:
      'bg-zinc-800/60 text-zinc-50 border border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-600',
    ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-50',
    danger: 'bg-transparent text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400'
  };

  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-[15px]'
  };
</script>

<button
  class={cn(base, variants[variant], sizes[size], className)}
  disabled={disabled || loading}
  {...rest}
>
  {#if loading}
    <span
      class="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
    ></span>
  {/if}
  {@render children?.()}
</button>
