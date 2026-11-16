export function pageQuery(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(query.pageSize) || 24));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function useCache(value: string | undefined) {
  return value !== "false" && value !== "0";
}
