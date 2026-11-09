export function countJoinsThisWeek(rows: Array<{ created_at: string }>) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(row.created_at).getTime() >= weekAgo).length;
}
