export type Stage = 'chat' | 'matrix' | 'debate';

export interface Criterion {
  id: string;
  name: string;
  weight: number; // 0-10
}

export interface Option {
  id: string;
  name: string;
  scores: Record<string, number>; // keyed by Criterion.id, 0-10
  prompts: Record<string, string>; // keyed by Criterion.id - helper question
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateResponse {
  options: string[];
  criteria: { name: string; weight: number }[];
  prompts: { option: number; criterion: number; question: string }[];
}
