/* eslint-disable @typescript-eslint/no-explicit-any */
export const toTool = (r: any) => ({
  id: r.id, slug: r.slug, name: r.name, maker: r.maker, kind: r.kind, platforms: r.platforms, needs: r.needs,
  cost: r.cost, summary: r.summary, url: r.url, status: r.status,
  ratingAvg: r.rating_avg == null ? 0 : Math.round(Number(r.rating_avg) * 10) / 10,
  ratingCount: r.rating_count ?? 0,
  favorited: r.favorited ?? false,
  createdAt: r.created_at,
});
export const toUser = (r: any) => ({ id: r.id, email: r.email, name: r.name, role: r.role, prefs: r.prefs ?? {} });
