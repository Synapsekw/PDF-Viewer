export type ShareToken = string;

export interface ShareMeta {
  title: string;
  size: number;
  createdAt: string;
}

export interface ShareRepository {
  createShare(docId: string): Promise<{ token: string; meta: ShareMeta }>;
  resolveToken(token: string): Promise<{ docId: string; meta: ShareMeta } | null>;
  listShares(): Promise<Array<{ token: string; meta: ShareMeta }>>;
  revokeShare(token: string): Promise<void>;
}
