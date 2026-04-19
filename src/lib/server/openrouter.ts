import { env } from '$env/dynamic/private';

export const MODEL = 'anthropic/claude-sonnet-4.5';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CallOptions {
  messages: ChatMessage[];
  stream?: boolean;
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
}

function headers() {
  const key = env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://deside.local',
    'X-Title': 'deside'
  };
}

export async function callOpenRouter(opts: CallOptions): Promise<Response> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
      stream: !!opts.stream,
      response_format: opts.response_format,
      messages: opts.messages
    })
  });
  if (!res.ok && !opts.stream) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }
  return res;
}

export async function callOpenRouterJSON<T>(
  messages: ChatMessage[],
  { maxTokens = 4000, temperature = 0.8 }: { maxTokens?: number; temperature?: number } = {}
): Promise<T> {
  const res = await callOpenRouter({
    messages,
    response_format: { type: 'json_object' },
    temperature,
    max_tokens: maxTokens
  });
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model did not return JSON');
    return JSON.parse(match[0]) as T;
  }
}
