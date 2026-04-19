import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { callOpenRouterJSON } from '$lib/server/openrouter';
import type { RequestHandler } from './$types';

const ResponseSchema = z.object({
  options: z.array(z.string().min(1)).min(2).max(8),
  criteria: z
    .array(
      z.object({
        name: z.string().min(1),
        weight: z.number().min(1).max(10)
      })
    )
    .min(3)
    .max(10),
  prompts: z.array(
    z.object({
      option: z.number().int().nonnegative(),
      criterion: z.number().int().nonnegative(),
      question: z.string().min(1)
    })
  )
});

const SYSTEM = `You are a decision-framing assistant. The user has a dilemma.
Your job: propose concrete OPTIONS the user is choosing between, the CRITERIA that matter for judging them, and a 0-10 RUBRIC QUESTION for every (option, criterion) cell.

Rules:
- 3 to 6 options; each a short noun phrase (e.g. "Focus on DSA practice"), 2-6 words.
- 5 to 8 criteria; each a short noun phrase (e.g. "Career timeline urgency"), 2-5 words.
- Weight each criterion 1-10 by typical importance for this kind of decision.

RUBRIC QUESTIONS (critical):
- Every question MUST be answerable on a 0-10 scale. The user reads the question, understands what a high vs low score means, and slides a number.
- Structure every question in TWO parts:
    1. A brief plain-English explanation of what's being evaluated (1 sentence, no jargon).
    2. The scoring anchor: what 0 means and what 10 means for this specific (option, criterion) pair.
- Format: "[Plain explanation]. Rate 0-10 where 0 = [bad extreme] and 10 = [good extreme]."
- Example GOOD: "'Focus on DSA practice' is all-in on interview prep, not side projects. Does this match how urgently you need a job offer? Rate 0-10 where 0 = you have no timeline pressure and 10 = you need an offer within 60 days."
- Example BAD: "How many months until this becomes irrelevant?" (not 0-10 scorable, no anchors, no context)
- Reference BOTH the option and criterion by name inside the explanation.
- Keep each question under 40 words total. Sharp, concrete, no hedging.
- Never start the scoring anchor with "How many", "When", "Will you", or "Is it".

"prompts" MUST contain exactly options.length * criteria.length entries. Use zero-based indices that match the arrays.

Do not answer the dilemma. Only frame it. Respond with STRICT JSON only:
{
  "options": [string,...],
  "criteria": [{"name":string,"weight":number},...],
  "prompts": [{"option": number, "criterion": number, "question": string}, ...]
}`;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) throw error(400, 'question required');

  try {
    const raw = await callOpenRouterJSON<unknown>(
      [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: question }
      ],
      { maxTokens: 4000 }
    );
    const parsed = ResponseSchema.parse(raw);
    return json(parsed);
  } catch (e) {
    console.error('[generate]', e);
    throw error(500, e instanceof Error ? e.message : 'generation failed');
  }
};
