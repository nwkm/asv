export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export const offset = (q: { page: number; pageSize: number }) => (q.page - 1) * q.pageSize;
export const like = (s: string) => `%${s.replace(/[%_\\]/g, '\\$&')}%`;
