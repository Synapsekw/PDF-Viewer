import React from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { FiEye, FiUsers, FiClock, FiDownload } from 'react-icons/fi';
import { KpiDelta } from '../../lib/analytics/types';
import theme from '../../theme';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  delta?: KpiDelta;
}

// MOCK_DATA_START
const generateMockSparklineData = (trend: 'up' | 'down' | 'neutral' = 'up') => {
  const baseValue = 50;
  const variance = 15;
  const dataPoints = 12;
  
  return Array.from({ length: dataPoints }, (_, i) => {
    let value;
    if (trend === 'up') {
      value = baseValue + (i * 3) + (Math.random() - 0.5) * variance;
    } else if (trend === 'down') {
      value = baseValue + ((dataPoints - i) * 2) + (Math.random() - 0.5) * variance;
    } else {
      value = baseValue + (Math.random() - 0.5) * variance;
    }
    return Math.max(0, Math.min(100, value));
  });
};
// MOCK_DATA_END

const StyledCard = styled(Card)`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  height: 450px;
  padding: ${theme.spacing[6]};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(35, 47, 61, 0.9);
    pointer-events: none;
    z-index: 0;
  }
  
  &:hover {
    transform: scale(1.02);
    box-shadow: ${theme.shadows.xl};
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const CardContent = styled.div`
  padding: ${theme.spacing[6]};
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[4]};
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: ${theme.borderRadius.xl};
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: scale(1.05);
  }
`;

const Title = styled.h3`
  color: #ffffff;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 10;
`;

const Value = styled.div`
  color: #ffffff;
  font-size: 3rem;
  font-weight: ${theme.typography.fontWeight.bold};
  margin-bottom: ${theme.spacing[3]};
  line-height: 1.1;
  letter-spacing: -0.025em;
  position: relative;
  z-index: 10;
`;

const ContentRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
`;

const Trend = styled.div<{ direction: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  
  ${props => {
    switch (props.direction) {
      case 'up':
        return `color: #10b981;`; // green
      case 'down':
        return `color: #ef4444;`; // red
      default:
        return `color: rgba(255, 255, 255, 0.9);`;
    }
  }}
`;

const SparklineContainer = styled.div`
  width: 80px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Sparkline = styled.svg`
  width: 100%;
  height: 100%;
`;

const SparklinePath = styled.path<{ direction: 'up' | 'down' | 'neutral' }>`
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  
  ${props => {
    switch (props.direction) {
      case 'up':
        return `stroke: #10b981;`; // green
      case 'down':
        return `stroke: #ef4444;`; // red
      default:
        return `stroke: ${theme.colors.text.secondary};`;
    }
  }}
`;

const SparklineArea = styled.path<{ direction: 'up' | 'down' | 'neutral' }>`
  fill: url(#sparklineGradient);
  opacity: 0.3;
`;

// Skeleton loader components
const SkeletonCard = styled(StyledCard)`
  overflow: hidden;
`;

const SkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[4]};
`;

const SkeletonTitle = styled.div`
  width: 80px;
  height: 16px;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
`;

const SkeletonIcon = styled.div`
  width: 56px;
  height: 56px;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: ${theme.borderRadius.xl};
`;

const SkeletonValue = styled.div`
  width: 120px;
  height: 48px;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: ${theme.spacing[3]};
`;

const SkeletonTrend = styled.div`
  width: 60px;
  height: 14px;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
`;

const SkeletonSparkline = styled.div`
  width: 80px;
  height: 40px;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
`;

const SkeletonLoader = styled.div`
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

export const KpiCardSkeleton: React.FC = () => (
  <SkeletonLoader>
    <SkeletonCard variant="glass">
      <CardContent>
        <SkeletonHeader>
          <SkeletonTitle />
          <SkeletonIcon />
        </SkeletonHeader>
        <SkeletonValue />
        <ContentRow>
          <SkeletonTrend />
          <SkeletonSparkline />
        </ContentRow>
      </CardContent>
    </SkeletonCard>
  </SkeletonLoader>
);

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  delta
}) => {
  // MOCK_DATA_START
  const sparklineData = generateMockSparklineData(delta?.direction || 'up');
  // MOCK_DATA_END

  const createSparklinePath = (data: number[]) => {
    const width = 80;
    const height = 40;
    const padding = 4;
    const stepX = (width - padding * 2) / (data.length - 1);
    
    const points = data.map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (value / 100) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const createSparklineArea = (data: number[]) => {
    const width = 80;
    const height = 40;
    const padding = 4;
    const stepX = (width - padding * 2) / (data.length - 1);
    
    const points = data.map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (value / 100) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    const bottomRight = `${width - padding},${height - padding}`;
    const bottomLeft = `${padding},${height - padding}`;
    
    return `M ${points.join(' L ')} L ${bottomRight} L ${bottomLeft} Z`;
  };

  return (
    <StyledCard variant="glass">
      <CardContent>
        <Header>
          <Title>{title}</Title>
          <IconWrapper>{icon}</IconWrapper>
        </Header>
        <Value>{value}</Value>
        <ContentRow>
          {delta && (
            <Trend direction={delta.direction}>
              {delta.direction === 'up' && '↗'}
              {delta.direction === 'down' && '↘'}
              {delta.direction === 'neutral' && '→'}
              {delta.value > 0 ? '+' : ''}{delta.value.toFixed(1)}%
            </Trend>
          )}
          <SparklineContainer>
            <Sparkline viewBox="0 0 80 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={delta?.direction === 'up' ? '#10b981' : delta?.direction === 'down' ? '#ef4444' : theme.colors.text.secondary} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={delta?.direction === 'up' ? '#10b981' : delta?.direction === 'down' ? '#ef4444' : theme.colors.text.secondary} stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <SparklineArea 
                d={createSparklineArea(sparklineData)} 
                direction={delta?.direction || 'neutral'}
              />
              <SparklinePath 
                d={createSparklinePath(sparklineData)} 
                direction={delta?.direction || 'neutral'}
              />
            </Sparkline>
          </SparklineContainer>
        </ContentRow>
      </CardContent>
    </StyledCard>
  );
};

// Predefined KPI card components for common metrics
export const TotalViewsCard: React.FC<{ value: number; delta?: KpiDelta }> = ({ value, delta }) => (
  <KpiCard
    title="Total Views"
    value={value.toLocaleString()}
    icon={<FiEye />}
    delta={delta}
  />
);

export const UniqueViewersCard: React.FC<{ value: number; delta?: KpiDelta }> = ({ value, delta }) => (
  <KpiCard
    title="Unique Viewers"
    value={value.toLocaleString()}
    icon={<FiUsers />}
    delta={delta}
  />
);

export const AvgTimeCard: React.FC<{ value: number; delta?: KpiDelta }> = ({ value, delta }) => (
  <KpiCard
    title="Avg. Time"
    value={`${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`}
    icon={<FiClock />}
    delta={delta}
  />
);

export const DownloadsCard: React.FC<{ value: number; delta?: KpiDelta }> = ({ value, delta }) => (
  <KpiCard
    title="Downloads"
    value={value.toLocaleString()}
    icon={<FiDownload />}
    delta={delta}
  />
);

export default KpiCard;
