/**
 * Local IndexedDB implementation of ReportsRepository
 */

import { ReportsRepository, Report, ReportSummary } from '../share/types';
import { PublicSession } from '../share/types';

const DB_NAME = 'PDFReports';
const DB_VERSION = 1;
const REPORTS_STORE = 'reports';

class LocalReportsRepository implements ReportsRepository {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(REPORTS_STORE)) {
          const store = db.createObjectStore(REPORTS_STORE, { keyPath: 'id' });
          store.createIndex('token', 'token', { unique: false });
          store.createIndex('docId', 'docId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private generateReportId(): string {
    return 'rpt_' + Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 16);
  }

  private calculateSummary(sessions: PublicSession[]): ReportSummary {
    if (sessions.length === 0) {
      return {
        totalViews: 0,
        uniqueSessions: 0,
        avgDuration: 0,
        topPages: [],
        selectionsCount: 0,
        lastViewed: new Date().toISOString()
      };
    }

    const totalViews = sessions.length;
    const uniqueSessions = new Set(sessions.map(s => s.sessionId)).size;
    
    // Calculate average duration
    const durations = sessions
      .map(s => s.events.find(e => e.type === 'public_session_end'))
      .filter(e => e && 'durationSec' in e)
      .map(e => (e as any).durationSec);
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;

    // Calculate top pages
    const pageViews = new Map<number, number>();
    sessions.forEach(session => {
      session.events
        .filter(e => e.type === 'public_page_view')
        .forEach(e => {
          if ('pageIndex' in e) {
            const count = pageViews.get(e.pageIndex) || 0;
            pageViews.set(e.pageIndex, count + 1);
          }
        });
    });

    const topPages = Array.from(pageViews.entries())
      .map(([pageIndex, views]) => ({ pageIndex, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Count text selections
    const selectionsCount = sessions.reduce((total, session) => {
      return total + session.events.filter(e => e.type === 'public_text_selected').length;
    }, 0);

    // Find last viewed
    const lastViewed = sessions
      .map(s => s.startTime)
      .sort((a, b) => b - a)[0];

    return {
      totalViews,
      uniqueSessions,
      avgDuration: Math.round(avgDuration),
      topPages,
      selectionsCount,
      lastViewed: new Date(lastViewed).toISOString()
    };
  }

  async createReport(sessionData: PublicSession): Promise<Report> {
    // For now, we'll aggregate by token when creating reports
    // In a real implementation, this might be triggered differently
    
    const reportId = this.generateReportId();
    
    // Get all sessions for this token to create comprehensive report
    // This is a simplified version - in practice you'd get this from the analytics system
    const sessions = [sessionData]; // For now, just this session
    
    const summary = this.calculateSummary(sessions);
    
    const report: Report = {
      id: reportId,
      token: sessionData.token,
      docId: sessionData.docId,
      docTitle: `Document ${sessionData.docId}`, // Would get actual title
      createdAt: new Date().toISOString(),
      summary
    };

    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REPORTS_STORE], 'readwrite');
      const store = transaction.objectStore(REPORTS_STORE);
      const request = store.add(report);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(report);
    });
  }

  async getReport(id: string): Promise<Report | null> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REPORTS_STORE], 'readonly');
      const store = transaction.objectStore(REPORTS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async listReports(): Promise<Report[]> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REPORTS_STORE], 'readonly');
      const store = transaction.objectStore(REPORTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as Report[];
        // Sort by creation date, newest first
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
    });
  }

  async generateHtmlReport(reportId: string): Promise<Blob> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const html = this.buildHtmlReport(report);
    return new Blob([html], { type: 'text/html' });
  }

  private buildHtmlReport(report: Report): string {
    const { summary } = report;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Viewer Analytics Report - ${report.docTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .pages-list {
            list-style: none;
            padding: 0;
        }
        .pages-list li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .pages-list li:last-child {
            border-bottom: none;
        }
        .page-bar {
            background: #eee;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            flex: 1;
            margin: 0 15px;
        }
        .page-bar-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            transition: width 0.3s ease;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Analytics Report</h1>
        <p>${report.docTitle}</p>
        <p>Generated on ${new Date(report.createdAt).toLocaleDateString()}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${summary.totalViews}</div>
            <div class="stat-label">Total Views</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${summary.uniqueSessions}</div>
            <div class="stat-label">Unique Sessions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Math.round(summary.avgDuration / 60)}m</div>
            <div class="stat-label">Avg Duration</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${summary.selectionsCount}</div>
            <div class="stat-label">Text Selections</div>
        </div>
    </div>

    ${summary.topPages.length > 0 ? `
    <div class="section">
        <h2>Top Pages</h2>
        <ul class="pages-list">
            ${summary.topPages.map(page => {
              const maxViews = Math.max(...summary.topPages.map(p => p.views));
              const percentage = (page.views / maxViews) * 100;
              return `
                <li>
                    <span>Page ${page.pageIndex + 1}</span>
                    <div class="page-bar">
                        <div class="page-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span>${page.views} views</span>
                </li>
              `;
            }).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="section">
        <h2>Report Details</h2>
        <p><strong>Share Token:</strong> ${report.token}</p>
        <p><strong>Document ID:</strong> ${report.docId}</p>
        <p><strong>Last Viewed:</strong> ${new Date(summary.lastViewed).toLocaleString()}</p>
        <p><strong>Report Generated:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
    </div>

    <div class="footer">
        <p>Generated by PDF Viewer Analytics System</p>
    </div>
</body>
</html>
    `.trim();
  }

  async deleteReport(id: string): Promise<void> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([REPORTS_STORE], 'readwrite');
      const store = transaction.objectStore(REPORTS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export singleton instance
export const localReportsRepo = new LocalReportsRepository();
