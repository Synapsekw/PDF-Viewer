// TODO: Replace MOCK layer with real analytics API when backend is ready.

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
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
import { Button } from '../components/ui/Button';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import theme from '../theme';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #334155 50%, #0f172a 100%);
  font-family: ${theme.typography.fontFamily};
  position: relative;
  
  /* Background gradient overlay with blur effect - matches landing page exactly */
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(51, 65, 85, 0.95) 50%, rgba(15, 23, 42, 0.9) 100%);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    pointer-events: none;
  }
`;

const Header = styled.header`
  position: relative;
  z-index: 10;
  padding: ${theme.spacing[6]} ${theme.spacing[6]} ${theme.spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing[4]};
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize['3xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[1]} 0;
  letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.md};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  align-items: center;
`;

const MainContent = styled.main`
  position: relative;
  z-index: 10;
  padding: 0 ${theme.spacing[6]} ${theme.spacing[8]};
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${theme.spacing[6]};
  margin-top: ${theme.spacing[6]};
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${theme.spacing[6]};
  margin-top: ${theme.spacing[8]};
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const IntelligenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${theme.spacing[6]};
  margin-top: ${theme.spacing[8]};
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const EngagementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${theme.spacing[6]};
  margin-top: ${theme.spacing[8]};
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SectionTitle = styled.h2`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  margin: ${theme.spacing[8]} 0 ${theme.spacing[6]} 0;
  letter-spacing: -0.025em;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.lg};
`;

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #ef4444;
  font-size: ${theme.typography.fontSize.lg};
  text-align: center;
`;

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

  const handleBackToApp = () => {
    navigate('/app');
  };

  const handleRefresh = () => {
    fetchKpis();
    fetchChartData();
    fetchIntelligenceData();
  };

  return (
    <DashboardContainer>
      <Header>
        <HeaderContent>
          <Title>PDF Engagement Dashboard</Title>
          <Subtitle>Overview</Subtitle>
        </HeaderContent>
        <HeaderActions>
          <Button
            variant="glass"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            variant="glass"
            onClick={handleBackToApp}
          >
            <FiArrowLeft />
            Back to App
          </Button>
        </HeaderActions>
      </Header>

      <MainContent>
        {loading && (
          <KpiGrid>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </KpiGrid>
        )}

        {error && (
          <ErrorState>
            {error}
            <br />
            <Button
              variant="primary"
              onClick={fetchKpis}
              style={{ marginTop: theme.spacing[4] }}
            >
              Try Again
            </Button>
          </ErrorState>
        )}

        {kpis && !loading && !error && (
          <KpiGrid>
            <TotalViewsCard value={kpis.totalViews} delta={kpis.deltas.totalViews} />
            <UniqueViewersCard value={kpis.uniqueViewers} delta={kpis.deltas.uniqueViewers} />
            <AvgTimeCard value={kpis.avgTimeSec} delta={kpis.deltas.avgTimeSec} />
            <DownloadsCard value={kpis.totalDownloads} delta={kpis.deltas.totalDownloads} />
          </KpiGrid>
        )}

        <ChartsGrid>
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
        </ChartsGrid>

        <IntelligenceGrid>
          <WordCloud 
            data={keywords} 
            loading={intelligenceLoading} 
          />
          <TopQuestionsTable 
            data={questions} 
            loading={intelligenceLoading}
          />
        </IntelligenceGrid>

        <EngagementGrid>
          <PageHeatmapPreview loading={false} />
          <PageDropoffChart loading={false} />
        </EngagementGrid>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;
