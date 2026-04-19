<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <meta name="description" content="deside - a minimal weighted-decision matrix with a Socratic debate" />
</svelte:head>

{@render children()}
