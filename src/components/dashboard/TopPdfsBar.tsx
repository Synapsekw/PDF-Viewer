import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TopPdfData } from '../../lib/analytics/types';
import theme from '../../theme';

interface TopPdfsBarProps {
  data: TopPdfData[];
  loading?: boolean;
  onPdfClick?: (pdfId: string) => void;
}

const ChartCard = styled(Card)`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  height: 450px;
  padding: ${theme.spacing[6]};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
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
    box-shadow: ${theme.shadows.xl};
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const ChartTitle = styled.h3`
  color: #ffffff;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[6]} 0;
  letter-spacing: -0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 10;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.9);
  font-size: ${theme.typography.fontSize.md};
`;

// Enhanced tooltip component with mock downloads
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // MOCK_DATA_START
    const mockDownloads = Math.floor(payload[0]?.value * 0.25 + Math.random() * 30);
    const mockAvgTime = Math.floor(payload[0]?.value * 0.8 + Math.random() * 120);
    const mockEngagement = Math.floor((payload[0]?.value / 1000) * (70 + Math.random() * 25));
    // MOCK_DATA_END
    
    return (
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '16px',
        color: 'white',
        fontSize: '14px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        maxWidth: '300px',
      }}>
        <p style={{ 
          margin: '0 0 12px 0', 
          fontWeight: '600',
          fontSize: '16px',
          color: '#ffffff',
          lineHeight: '1.4'
        }}>
          {label}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '4px 0'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span style={{ color: '#10b981', fontWeight: '500' }}>
              Views: {payload[0]?.value.toLocaleString()}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '4px 0'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span style={{ color: '#3b82f6', fontWeight: '500' }}>
              Downloads: {mockDownloads.toLocaleString()}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '4px 0'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span style={{ color: '#f59e0b', fontWeight: '500' }}>
              Avg. Time: {Math.floor(mockAvgTime / 60)}:{(mockAvgTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '4px 0'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#8b5cf6',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span style={{ color: '#8b5cf6', fontWeight: '500' }}>
              Engagement: {mockEngagement}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 25) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const TopPdfsBar: React.FC<TopPdfsBarProps> = ({ data, loading = false, onPdfClick }) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!loading && data.length > 0) {
      setAnimationProgress(0);
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data, loading]);

  // Debug logging
  console.log('TopPdfsBar - data:', data);
  console.log('TopPdfsBar - loading:', loading);
  console.log('TopPdfsBar - data length:', data?.length);

  if (loading) {
    return (
      <ChartCard variant="glass">
        <ChartTitle>Top PDFs by Views</ChartTitle>
        <LoadingState>Loading chart data...</LoadingState>
      </ChartCard>
    );
  }

  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <ChartCard variant="glass">
        <ChartTitle>Top PDFs by Views</ChartTitle>
        <LoadingState>No data available</LoadingState>
      </ChartCard>
    );
  }

  // Transform data for horizontal bar chart
  const chartData = data.map(item => ({
    ...item,
    title: truncateText(item.title),
    fullTitle: item.title, // Keep full title for tooltip
  }));

  console.log('TopPdfsBar - chartData:', chartData);

  // Use the actual chart data instead of test data
  const chartDataForDisplay = chartData.map(item => ({
    name: item.title,
    views: item.views
  }));

  console.log('TopPdfsBar - chartDataForDisplay:', chartDataForDisplay);
  console.log('TopPdfsBar - first item:', chartDataForDisplay[0]);
  console.log('TopPdfsBar - views values:', chartDataForDisplay.map(item => item.views));

  return (
    <ChartCard variant="glass">
      <ChartTitle>Top PDFs by Views</ChartTitle>
      <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartDataForDisplay}
          margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#047857" stopOpacity={0.9}/>
              <stop offset="30%" stopColor="#10b981" stopOpacity={0.7}/>
              <stop offset="70%" stopColor="#6ee7b7" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="barStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#047857" stopOpacity={0}/>
              <stop offset="50%" stopColor="#10b981" stopOpacity={0}/>
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255, 255, 255, 0.08)"
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(255, 255, 255, 1)', fontSize: 11 }}
            interval={0}
            height={60}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            wrapperStyle={{
              outline: 'none',
              border: 'none',
              background: 'transparent'
            }}
            cursor={false}
          />
          <Bar 
            dataKey="views" 
            fill="url(#barGradient)" 
            stroke="url(#barStrokeGradient)"
            strokeWidth={1}
            animationDuration={1500}
            animationBegin={animationProgress * 1000}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default TopPdfsBar;
