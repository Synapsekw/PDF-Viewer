/**
 * Types for the Share Link feature
 */

export type ShareToken = string;

export interface ShareMeta {
  title: string;
  size: number;
  createdAt: string;
}

export interface ShareLink {
  token: ShareToken;
  docId: string;
  meta: ShareMeta;
}

export interface ShareRepository {
  createShare(docId: string): Promise<{ token: string; meta: ShareMeta }>;
  resolveToken(token: string): Promise<{ docId: string; meta: ShareMeta } | null>;
  listShares(): Promise<Array<{ token: string; meta: ShareMeta }>>;
  revokeShare(token: string): Promise<void>;
}

// Public analytics event types
export type PublicAnalyticsEvent = 
  | PublicSessionStartEvent
  | PublicDocOpenEvent
  | PublicPageViewEvent
  | PublicHeartbeatEvent
  | PublicTextSelectedEvent
  | PublicSessionEndEvent;

export interface PublicSessionStartEvent {
  type: 'public_session_start';
  token: string;
  docId: string;
  sessionId: string;
  ts: number;
}

export interface PublicDocOpenEvent {
  type: 'public_doc_open';
  token: string;
  docId: string;
  sessionId: string;
  ts: number;
}

export interface PublicPageViewEvent {
  type: 'public_page_view';
  token: string;
  docId: string;
  sessionId: string;
  pageIndex: number;
  ts: number;
}

export interface PublicHeartbeatEvent {
  type: 'public_heartbeat';
  token: string;
  docId: string;
  sessionId: string;
  secondsVisible: number;
  ts: number;
}

export interface PublicTextSelectedEvent {
  type: 'public_text_selected';
  token: string;
  docId: string;
  sessionId: string;
  pageIndex: number;
  textLen: number;
  rectsCount: number;
  ts: number;
}

export interface PublicSessionEndEvent {
  type: 'public_session_end';
  token: string;
  docId: string;
  sessionId: string;
  durationSec: number;
  pagesViewed: number;
  ts: number;
}

export interface PublicSession {
  sessionId: string;
  token: string;
  docId: string;
  startTime: number;
  pagesViewed: Set<number>;
  events: PublicAnalyticsEvent[];
}

export interface PublicSessionHandle {
  track(event: Omit<PublicAnalyticsEvent, 'token' | 'docId' | 'sessionId' | 'ts'>): void;
  end(): Promise<void>;
}

// Reports types
export interface ReportSummary {
  totalViews: number;
  uniqueSessions: number;
  avgDuration: number;
  topPages: Array<{ pageIndex: number; views: number }>;
  selectionsCount: number;
  lastViewed: string;
}

export interface Report {
  id: string;
  token: string;
  docId: string;
  docTitle: string;
  createdAt: string;
  summary: ReportSummary;
  htmlBlobRef?: string;
}

export interface ReportsRepository {
  createReport(sessionData: PublicSession): Promise<Report>;
  getReport(id: string): Promise<Report | null>;
  listReports(): Promise<Report[]>;
  generateHtmlReport(reportId: string): Promise<Blob>;
  deleteReport(id: string): Promise<void>;
}