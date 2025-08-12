// TODO: Replace MOCK layer with real analytics API when backend is ready.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TotalViewsCard, 
  UniqueViewersCard, 
  AvgTimeCard, 
  DownloadsCard,
  KpiCardSkeleton
} from '../components/dashboard/KpiCard';
import ViewsOverTime from '../components/dashboard/ViewsOverTime';
import TopPdfsBar from '../components/dashboard/TopPdfsBar';
import WordCloud from '../components/dashboard/WordCloud';
import TopQuestionsTable from '../components/dashboard/TopQuestionsTable';
import PageHeatmapPreview from '../components/dashboard/PageHeatmapPreview';
import PageDropoffChart from '../components/dashboard/PageDropoffChart';
import { getKpis, getViewsTimeSeries, getTopPdfsByViews, getTopKeywords, getTopQuestions } from '../lib/analytics/mockAnalytics';
import { Kpis, TimeSeriesDataPoint, TopPdfData, KeywordData, QuestionData } from '../lib/analytics/types';
import { USE_MOCK_ANALYTICS } from '../lib/analytics/config';







const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [viewsTimeSeries, setViewsTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const [topPdfs, setTopPdfs] = useState<TopPdfData[]>([]);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_ANALYTICS) {
        const data = await getKpis();
        setKpis(data);
      } else {
        // TODO: Replace with real analytics API when backend is ready
        console.log('TODO: Implement real analytics API call');
        setError('Real analytics API not implemented yet');
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error fetching KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      
      if (USE_MOCK_ANALYTICS) {
        const [timeSeriesData, topPdfsData] = await Promise.all([
          getViewsTimeSeries({ days: 30 }),
          getTopPdfsByViews({ limit: 5 })
        ]);
        setViewsTimeSeries(timeSeriesData);
        setTopPdfs(topPdfsData);
      } else {
        // TODO: Replace with real analytics API when backend is ready
        console.log('TODO: Implement real analytics API call for charts');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  const fetchIntelligenceData = async () => {
    try {
      setIntelligenceLoading(true);
      
      if (USE_MOCK_ANALYTICS) {
        const [keywordsData, questionsData] = await Promise.all([
          getTopKeywords({ limit: 100 }),
          getTopQuestions({ limit: 10 })
        ]);
        setKeywords(keywordsData);
        setQuestions(questionsData);
      } else {
        // TODO: Replace with real analytics API when backend is ready
        console.log('TODO: Implement real analytics API call for intelligence data');
      }
    } catch (err) {
      console.error('Error fetching intelligence data:', err);
    } finally {
      setIntelligenceLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchChartData();
    fetchIntelligenceData();
  }, []);



    return (
    <div className="transition-[margin] duration-200 ease-out min-w-0">
      <div className="w-full space-y-6">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center min-h-[200px] text-red-500 text-lg">
            {error}
          </div>
        )}

        {kpis && !loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <TotalViewsCard value={kpis.totalViews} delta={kpis.deltas.totalViews} />
            <UniqueViewersCard value={kpis.uniqueViewers} delta={kpis.deltas.uniqueViewers} />
            <AvgTimeCard value={kpis.avgTimeSec} delta={kpis.deltas.avgTimeSec} />
            <DownloadsCard value={kpis.totalDownloads} delta={kpis.deltas.totalDownloads} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 min-w-0">
          <ViewsOverTime 
            data={viewsTimeSeries} 
            loading={chartsLoading} 
          />
          <TopPdfsBar 
            data={topPdfs} 
            loading={chartsLoading}
            onPdfClick={(pdfId) => {
              // TODO: Navigate to PDF viewer with the selected PDF
              console.log('TODO: Navigate to PDF viewer with ID:', pdfId);
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 min-w-0">
          <WordCloud 
            data={keywords} 
            loading={intelligenceLoading} 
          />
          <TopQuestionsTable 
            data={questions} 
            loading={intelligenceLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 min-w-0">
          <PageHeatmapPreview loading={false} />
          <PageDropoffChart loading={false} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
