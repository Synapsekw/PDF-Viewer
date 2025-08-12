import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card, Button } from '../../components/ui';
import theme from '../../theme';
import { aiUsageAnalytics } from './AIUsageAnalytics';
import { AIUsageStats, AIUsageFilters, AIUsageReport } from './types';
import { FiDownload, FiTrash2, FiFilter, FiTrendingUp, FiClock, FiDollarSign, FiMessageSquare, FiBox, FiBarChart } from 'react-icons/fi';

const DashboardContainer = styled.div`
  padding: ${theme.spacing[6]};
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing[8]};
`;

const Title = styled.h1`
  font-size: ${theme.typography.fontSize['3xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: ${theme.typography.fontSize.md};
  color: ${theme.colors.text.secondary};
  margin: ${theme.spacing[2]} 0 0 0;
`;

const Controls = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing[6]};
  margin-bottom: ${theme.spacing[8]};
`;

const StatCard = styled.div`
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: ${theme.borderRadius.xl};
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  padding: ${theme.spacing[6]};
  text-align: center;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: rgba(71, 85, 105, 0.5);
  }
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: ${theme.borderRadius.lg};
  color: ${theme.colors.ui.accent};
  font-size: 1.5rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(71, 85, 105, 0.3);
  transition: all 0.3s ease;
  margin: 0 auto ${theme.spacing[4]};
  
  &:hover {
    background: rgba(51, 65, 85, 0.7);
    transform: scale(1.05);
  }
`;

const StatValue = styled.div`
  font-size: ${theme.typography.fontSize['3xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: ${theme.typography.fontWeight.medium};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing[12]};
  color: ${theme.colors.text.secondary};
  background: rgba(30, 41, 59, 0.3);
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid rgba(51, 65, 85, 0.3);
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${theme.spacing[6]};
  opacity: 0.6;
`;

const EmptyStateTitle = styled.h3`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[3]};
`;

const EmptyStateText = styled.p`
  font-size: ${theme.typography.fontSize.md};
  max-width: 500px;
  margin: 0 auto;
  line-height: ${theme.typography.lineHeight.relaxed};
`;

export const AIUsageDashboard: React.FC = () => {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await aiUsageAnalytics.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load AI usage data:', error);
      // Set default values on error
      setStats({
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        successRate: 0,
        requestsByModel: {},
        requestsByDocument: {},
        requestsByHour: {},
        requestsByDay: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <DashboardContainer>
        <EmptyState>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-6" />
          <EmptyStateTitle>Loading AI Usage Analytics</EmptyStateTitle>
          <EmptyStateText>
            Gathering your AI interaction data...
          </EmptyStateText>
        </EmptyState>
      </DashboardContainer>
    );
  }

  if (!stats || stats.totalRequests === 0) {
    return (
      <DashboardContainer>
        <Header>
          <div>
            <Title>AI Usage Analytics</Title>
            <Subtitle>Track your AI interactions, costs, and performance metrics</Subtitle>
          </div>
        </Header>

        <EmptyState>
          <EmptyStateIcon>
            <FiBox />
          </EmptyStateIcon>
          <EmptyStateTitle>No AI Usage Data</EmptyStateTitle>
          <EmptyStateText>
            Start using the AI assistant to see usage analytics, costs, and performance metrics here.
          </EmptyStateText>
        </EmptyState>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>AI Usage Analytics</Title>
          <Subtitle>Track your AI interactions, costs, and performance metrics</Subtitle>
        </div>
        <Controls>
          <Button variant="glass" onClick={() => console.log('Export clicked')}>
            <FiDownload />
            Export
          </Button>
          <Button variant="secondary" onClick={() => console.log('Clear clicked')}>
            <FiTrash2 />
            Clear Data
          </Button>
        </Controls>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon>
            <FiMessageSquare />
          </StatIcon>
          <StatValue>{formatNumber(stats.totalRequests)}</StatValue>
          <StatLabel>Total Requests</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FiTrendingUp />
          </StatIcon>
          <StatValue>{formatNumber(stats.totalTokens)}</StatValue>
          <StatLabel>Total Tokens</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FiDollarSign />
          </StatIcon>
          <StatValue>{formatCurrency(stats.totalCost)}</StatValue>
          <StatLabel>Total Cost</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FiClock />
          </StatIcon>
          <StatValue>{formatTime(stats.averageResponseTime)}</StatValue>
          <StatLabel>Avg Response Time</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FiBarChart />
          </StatIcon>
          <StatValue>{stats.successRate.toFixed(1)}%</StatValue>
          <StatLabel>Success Rate</StatLabel>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FiBox />
          </StatIcon>
          <StatValue>{Object.keys(stats.requestsByModel).length}</StatValue>
          <StatLabel>Models Used</StatLabel>
        </StatCard>
      </StatsGrid>
    </DashboardContainer>
  );
};

export default AIUsageDashboard;
