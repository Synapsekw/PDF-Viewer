/**
 * User Activity Monitor - Real-time user activity tracking
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  FileText, 
  Share, 
  Eye, 
  Clock,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Loader
} from 'lucide-react';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { Card } from '../ui';

interface ActivityData {
  totalSessions: number;
  totalViews: number;
  totalDocuments: number;
  totalShares: number;
  activeUsers: number;
  recentActivity: ActivityEvent[];
  popularDocuments: PopularDocument[];
  userGrowth: UserGrowthData[];
}

interface ActivityEvent {
  id: string;
  type: 'login' | 'document_view' | 'document_upload' | 'share_create';
  userId: string;
  userEmail: string;
  timestamp: string;
  metadata?: any;
}

interface PopularDocument {
  id: string;
  name: string;
  views: number;
  shares: number;
  createdAt: string;
}

interface UserGrowthData {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export const UserActivityMonitor: React.FC = () => {
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadActivityData();
    
    // Set up real-time subscriptions
    const supabase = SupabaseClientManager.getClient();
    if (supabase) {
      const subscription = supabase
        .channel('admin_activity')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'analytics_sessions' },
          () => loadActivityData()
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'documents' },
          () => loadActivityData()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [timeRange]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) return;

      const now = new Date();
      const timeRanges = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };
      const fromDate = timeRanges[timeRange];

      // Get sessions data
      const { data: sessions } = await supabase
        .from('analytics_sessions')
        .select(`
          *,
          profiles:user_id(email, display_name),
          documents:document_id(name)
        `)
        .gte('created_at', fromDate.toISOString());

      // Get documents data
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .gte('created_at', fromDate.toISOString());

      // Get shares data
      const { data: shares } = await supabase
        .from('document_shares')
        .select('*')
        .gte('created_at', fromDate.toISOString());

      // Get user profiles for active users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', fromDate.toISOString());

      // Process the data
      const processedData: ActivityData = {
        totalSessions: sessions?.length || 0,
        totalViews: sessions?.reduce((acc, s) => acc + (s.pages_viewed?.length || 0), 0) || 0,
        totalDocuments: documents?.length || 0,
        totalShares: shares?.length || 0,
        activeUsers: new Set(sessions?.map(s => s.user_id).filter(Boolean)).size,
        recentActivity: generateRecentActivity(sessions, documents, shares),
        popularDocuments: generatePopularDocuments(sessions, documents),
        userGrowth: generateUserGrowth(profiles, sessions)
      };

      setActivityData(processedData);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (sessions: any[], documents: any[], shares: any[]): ActivityEvent[] => {
    const events: ActivityEvent[] = [];

    // Add session events
    sessions?.forEach(session => {
      if (session.profiles?.email) {
        events.push({
          id: session.id,
          type: 'document_view',
          userId: session.user_id,
          userEmail: session.profiles.email,
          timestamp: session.start_time || session.created_at,
          metadata: { documentName: session.documents?.name }
        });
      }
    });

    // Add document upload events
    documents?.forEach(doc => {
      events.push({
        id: doc.id,
        type: 'document_upload',
        userId: doc.user_id,
        userEmail: 'Unknown', // We'd need to join with profiles
        timestamp: doc.created_at,
        metadata: { documentName: doc.name }
      });
    });

    // Add share events
    shares?.forEach(share => {
      events.push({
        id: share.token,
        type: 'share_create',
        userId: share.created_by,
        userEmail: 'Unknown', // We'd need to join with profiles
        timestamp: share.created_at,
        metadata: { shareToken: share.token }
      });
    });

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const generatePopularDocuments = (sessions: any[], documents: any[]): PopularDocument[] => {
    const documentStats = new Map<string, { views: number; name: string; createdAt: string }>();

    sessions?.forEach(session => {
      if (session.document_id && session.documents?.name) {
        const existing = documentStats.get(session.document_id) || { 
          views: 0, 
          name: session.documents.name, 
          createdAt: session.created_at 
        };
        documentStats.set(session.document_id, {
          ...existing,
          views: existing.views + 1
        });
      }
    });

    return Array.from(documentStats.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        views: stats.views,
        shares: 0, // Would need to count shares
        createdAt: stats.createdAt
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const generateUserGrowth = (profiles: any[], sessions: any[]): UserGrowthData[] => {
    const growthData: UserGrowthData[] = [];
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const newUsers = profiles?.filter(p => 
        p.created_at?.startsWith(dateStr)
      ).length || 0;

      const activeUsers = new Set(
        sessions?.filter(s => 
          s.start_time?.startsWith(dateStr)
        ).map(s => s.user_id)
      ).size;

      growthData.push({
        date: dateStr,
        newUsers,
        activeUsers
      });
    }

    return growthData;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_view': return <Eye className="w-4 h-4" />;
      case 'document_upload': return <FileText className="w-4 h-4" />;
      case 'share_create': return <Share className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'document_view': return 'Viewed document';
      case 'document_upload': return 'Uploaded document';
      case 'share_create': return 'Created share';
      default: return 'Activity';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Activity Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load activity data. Please check your connection and try again.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Activity Monitor
        </h2>
        <div className="flex items-center gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activityData.totalSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activityData.totalViews}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activityData.totalDocuments}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Share className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Shares</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activityData.totalShares}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activityData.activeUsers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {activityData.recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activity
              </p>
            ) : (
              activityData.recentActivity.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    {getActivityIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatActivityType(event.type)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {event.userEmail} {event.metadata?.documentName && `• ${event.metadata.documentName}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Popular Documents */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Popular Documents
          </h3>
          <div className="space-y-3">
            {activityData.popularDocuments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No documents data
              </p>
            ) : (
              activityData.popularDocuments.map((doc, index) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0 w-6 text-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {doc.views} views
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          User Growth
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {activityData.userGrowth.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t">
                <div 
                  className="bg-blue-500 rounded-t transition-all duration-300"
                  style={{ 
                    height: `${Math.max(4, (data.activeUsers / Math.max(...activityData.userGrowth.map(d => d.activeUsers), 1)) * 200)}px` 
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                <div>{new Date(data.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                <div className="font-medium">{data.activeUsers}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Active Users</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
