import type { Criterion, Message, Option, Stage } from '$lib/types';
import { uid } from '$lib/utils';

class DecisionStore {
  stage = $state<Stage>('chat');
  question = $state('');
  criteria = $state<Criterion[]>([]);
  options = $state<Option[]>([]);
  chat = $state<Message[]>([]);
  debate = $state<Message[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  mobilePanel = $state<'chat' | 'matrix' | 'debate'>('chat');
  debateKicked = $state(false);

  totals = $derived.by(() => {
    const weightSum = this.criteria.reduce((s, c) => s + c.weight, 0) || 1;
    const map: Record<string, { raw: number; pct: number }> = {};
    for (const o of this.options) {
      let raw = 0;
      for (const c of this.criteria) {
        const score = o.scores[c.id] ?? 0;
        raw += score * c.weight;
      }
      const maxPossible = weightSum * 10;
      map[o.id] = { raw, pct: maxPossible ? (raw / maxPossible) * 100 : 0 };
    }
    return map;
  });

  winningId = $derived.by(() => {
    let best: { id: string; pct: number } | null = null;
    for (const o of this.options) {
      const pct = this.totals[o.id]?.pct ?? 0;
      if (!best || pct > best.pct) best = { id: o.id, pct };
    }
    return best?.id ?? null;
  });

  // "Rated" means the user has touched the slider — 0 is a valid rating.
  allScored = $derived(
    this.options.length > 1 &&
      this.criteria.length > 0 &&
      this.options.every((o) =>
        this.criteria.every((c) => typeof o.scores[c.id] === 'number')
      )
  );

  reset() {
    this.stage = 'chat';
    this.question = '';
    this.criteria = [];
    this.options = [];
    this.chat = [];
    this.debate = [];
    this.loading = false;
    this.error = null;
    this.mobilePanel = 'chat';
    this.debateKicked = false;
  }

  seed(
    question: string,
    options: string[],
    criteria: { name: string; weight: number }[],
    prompts: { option: number; criterion: number; question: string }[] = []
  ) {
    this.question = question;
    const crits = criteria.map((c) => ({ id: uid('c'), name: c.name, weight: c.weight }));
    const initialScores = Object.fromEntries(crits.map((c) => [c.id, 0]));
    const opts = options.map((name) => ({
      id: uid('o'),
      name,
      scores: { ...initialScores },
      prompts: {} as Record<string, string>
    }));
    for (const p of prompts) {
      const opt = opts[p.option];
      const crit = crits[p.criterion];
      if (opt && crit) opt.prompts[crit.id] = p.question;
    }
    this.criteria = crits;
    this.options = opts;
    this.stage = 'matrix';
    this.mobilePanel = 'matrix';
  }

  addOption(name = 'New option') {
    const scores = Object.fromEntries(this.criteria.map((c) => [c.id, 0]));
    this.options = [
      ...this.options,
      { id: uid('o'), name, scores, prompts: {} }
    ];
  }

  removeOption(id: string) {
    this.options = this.options.filter((o) => o.id !== id);
  }

  renameOption(id: string, name: string) {
    const o = this.options.find((o) => o.id === id);
    if (o) o.name = name;
  }

  addCriterion(name = 'New criterion', weight = 5) {
    const id = uid('c');
    this.criteria = [...this.criteria, { id, name, weight }];
    for (const o of this.options) o.scores[id] = 0;
  }

  removeCriterion(id: string) {
    this.criteria = this.criteria.filter((c) => c.id !== id);
    for (const o of this.options) delete o.scores[id];
  }

  renameCriterion(id: string, name: string) {
    const c = this.criteria.find((c) => c.id === id);
    if (c) c.name = name;
  }

  setWeight(id: string, weight: number) {
    const c = this.criteria.find((c) => c.id === id);
    if (c) c.weight = weight;
  }

  setScore(optionId: string, criterionId: string, score: number) {
    const o = this.options.find((o) => o.id === optionId);
    if (o) o.scores[criterionId] = score;
  }
}

export const decision = new DecisionStore();
