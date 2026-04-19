import { json, error } from '@sveltejs/kit';
import { callOpenRouter, type ChatMessage } from '$lib/server/openrouter';
import type { RequestHandler } from './$types';

interface Payload {
  question: string;
  options: { name: string; total: number }[];
  criteria: { name: string; weight: number }[];
  history: { role: 'user' | 'assistant'; content: string }[];
}

const SYSTEM = `You are a Socratic interlocutor helping the user pressure-test a decision they have just scored.
Style:
- Ask probing questions ONE at a time. Keep each turn short (1-3 sentences).
- Surface blindspots: hidden assumptions, second-order effects, regret scenarios, missing stakeholders, framing biases, and reversed hypotheses ("what would make the opposite choice obviously right?").
- Do not give advice. Do not recommend an option. Do not summarize. Never agree reflexively.
- Reference the user's actual options, criteria, and weights specifically.
- If the user asks for your opinion, gently redirect with another question.
- End only when the user types "done" or clearly disengages.`;

function contextMessage(p: Payload): string {
  const crit = p.criteria.map((c) => `  - ${c.name} (weight ${c.weight})`).join('\n');
  const opts = p.options
    .map((o) => `  - ${o.name} (score ${o.total.toFixed(1)}/100)`)
    .join('\n');
  return `DECISION CONTEXT\n\nQuestion: ${p.question}\n\nOptions (with current weighted score):\n${opts}\n\nCriteria:\n${crit}\n\nBegin the Socratic debate. Open with ONE pointed question tailored to the highest-weighted criterion or the closest score gap.`;
}

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as Payload | null;
  if (!body?.question || !Array.isArray(body.options) || !Array.isArray(body.criteria)) {
    throw error(400, 'invalid payload');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: contextMessage(body) },
    ...body.history.map((m) => ({ role: m.role, content: m.content }) as ChatMessage)
  ];

  let upstream: Response;
  try {
    upstream = await callOpenRouter({
      messages,
      stream: false,
      temperature: 0.9,
      max_tokens: 600
    });
  } catch (e) {
    throw error(500, e instanceof Error ? e.message : 'debate failed');
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    throw error(502, `upstream ${upstream.status}: ${text}`);
  }

  const data = await upstream.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  if (!content.trim()) throw error(502, 'empty response from model');

  return json({ content });
};
