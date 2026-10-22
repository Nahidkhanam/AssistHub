export type Tool = {
  id: string; slug: string; name: string; maker: string; kind: string; platforms: string[]; needs: string[];
  cost: string; summary: string; url: string; status: 'published' | 'pending' | 'rejected';
  ratingAvg: number; ratingCount: number; favorited: boolean; submitter?: string | null;
};
export type Prefs = { textSize?: number; contrast?: boolean };
export type User = { id: string; email: string; name: string; role: 'user' | 'admin'; prefs: Prefs };
export type Review = { id: string; rating: number; body: string; author: string; createdAt: string };
export type Issue = { id: string; severity: 'error' | 'warning'; wcag: string; title: string; count: number; fix: string; examples: string[] };
export type CheckResult = { url: string; score: number; rulesChecked: number; rulesPassed: number; issues: Issue[]; note: string };
