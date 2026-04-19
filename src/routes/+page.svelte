<script lang="ts">
  import { decision } from "$lib/stores/decision.svelte";
  import ChatPanel from "$lib/components/ChatPanel.svelte";
  import DecisionMatrix from "$lib/components/DecisionMatrix.svelte";
  import DebatePanel from "$lib/components/DebatePanel.svelte";
  import { MessageSquare, LayoutGrid, MessagesSquare } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { fade } from "svelte/transition";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  onMount(() => {
    if (
      browser &&
      new URLSearchParams(window.location.search).get("demo") === "1"
    ) {
      const options = ["Charlotte", "New York"];
      const criteria = [
        { name: "Cost of Living", weight: 9 },
        { name: "Career Opportunities", weight: 8 },
        { name: "Quality of Life", weight: 7 },
        { name: "Walkability / Transit", weight: 4 },
      ];
      const pairs: Record<string, [string, string]> = {
        "Cost of Living": [
          "How well does Charlotte fit your budget? (10 = very affordable, 0 = still stretching)",
          "How well does New York fit your budget? (10 = comfortable, 0 = bleeding savings)",
        ],
        "Career Opportunities": [
          "How strong are career options in Charlotte for your field? (10 = rich market, 0 = desert)",
          "How strong is your career upside staying in New York right now? (10 = elite, 0 = stagnant)",
        ],
        "Quality of Life": [
          "How much would Charlotte improve your daily quality of life? (10 = huge, 0 = none)",
          "How much does New York's daily quality of life energize you? (10 = thrives, 0 = drains)",
        ],
        "Walkability / Transit": [
          "How well does Charlotte's transit fit how you want to move? (10 = seamless, 0 = car-trapped)",
          "How well does NYC transit serve you day-to-day? (10 = effortless, 0 = nightmare)",
        ],
      };
      const prompts: { option: number; criterion: number; question: string }[] = [];
      criteria.forEach((c, ci) => {
        const pair = pairs[c.name];
        options.forEach((_, oi) => {
          prompts.push({ option: oi, criterion: ci, question: pair?.[oi] ?? "" });
        });
      });
      decision.seed(
        "Move to Charlotte or stay in New York?",
        options,
        criteria,
        prompts,
      );
    }
  });

  const hasMatrix = $derived(decision.options.length > 0);
  const drawerView = $derived<"chat" | "debate">(
    decision.stage === "debate" ? "debate" : "chat",
  );

  function setMobile(p: "chat" | "matrix" | "debate") {
    decision.mobilePanel = p;
  }

  // Auto-advance mobilePanel ONLY when stage changes (not when user taps a tab).
  let lastStage = $state(decision.stage);
  $effect(() => {
    const s = decision.stage;
    if (s !== lastStage) {
      lastStage = s;
      if (s === "matrix") decision.mobilePanel = "matrix";
      else if (s === "debate") decision.mobilePanel = "debate";
      else if (s === "chat") decision.mobilePanel = "chat";
    }
  });
</script>

<main
  class="relative flex h-dvh w-full flex-col overflow-hidden bg-zinc-950 text-zinc-50"
  style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);"
>
  <!-- Top ambient gradient (very subtle) -->
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-linear-to-b from-emerald-500/4 via-transparent to-transparent"
  ></div>

  <!-- Desktop layout: lg+ -->
  <div class="hidden min-h-0 flex-1 lg:flex">
    <!-- Matrix / empty state on left -->
    <section class="relative flex min-h-0 flex-1 flex-col">
      {#if hasMatrix}
        <DecisionMatrix />
      {:else}
        <div class="flex min-h-0 flex-1 flex-col">
          <ChatPanel />
        </div>
      {/if}
    </section>

    {#if hasMatrix}
      <!-- Right drawer: chat (no-op) or debate -->
      <aside
        class="flex w-[420px] min-h-0 min-w-0 flex-col border-l border-zinc-900 bg-zinc-950/60"
      >
        {#if drawerView === "debate"}
          <DebatePanel />
        {:else}
          <div class="flex flex-1 items-center justify-center px-6 text-center">
            <p class="max-w-xs text-sm text-zinc-500">
              Score the matrix and hit <span class="text-zinc-300">Done</span> to
              start the Socratic debate.
            </p>
          </div>
        {/if}
      </aside>
    {/if}
  </div>

  <!-- Mobile layout: <lg -->
  <div class="flex min-h-0 flex-1 flex-col lg:hidden">
    <section class="relative flex min-h-0 flex-1 flex-col">
      {#if decision.mobilePanel === "chat" || !hasMatrix}
        <div class="flex min-h-0 flex-1 flex-col" in:fade={{ duration: 160 }}>
          <ChatPanel />
        </div>
      {:else if decision.mobilePanel === "matrix"}
        <div class="flex min-h-0 flex-1 flex-col" in:fade={{ duration: 160 }}>
          <DecisionMatrix />
        </div>
      {:else if decision.mobilePanel === "debate"}
        <div class="flex min-h-0 flex-1 flex-col" in:fade={{ duration: 160 }}>
          <DebatePanel />
        </div>
      {/if}
    </section>

    {#if hasMatrix}
      <nav
        class="flex-none border-t border-zinc-900 bg-zinc-950/90 backdrop-blur"
        aria-label="Primary"
      >
        <div
          class="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5"
        >
          {#each [{ id: "chat", label: "Chat", Icon: MessageSquare }, { id: "matrix", label: "Matrix", Icon: LayoutGrid }, { id: "debate", label: "Debate", Icon: MessagesSquare }] as { id, label, Icon } (id)}
            {@const active = decision.mobilePanel === id}
            <button
              type="button"
              onclick={() => setMobile(id as "chat" | "matrix" | "debate")}
              class={cn(
                "relative flex h-11 min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-md px-3 text-[10px] font-medium tracking-wide uppercase transition-colors",
                active ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
              {#if active}
                <span
                  class="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-emerald-400"
                ></span>
              {/if}
            </button>
          {/each}
        </div>
      </nav>
    {/if}
  </div>
</main>
