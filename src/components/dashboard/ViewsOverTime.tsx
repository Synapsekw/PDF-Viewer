import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TimeSeriesDataPoint } from '../../lib/analytics/types';
import theme from '../../theme';

interface ViewsOverTimeProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
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
    const mockDownloads = Math.floor(payload[0]?.value * 0.3 + Math.random() * 50);
    const mockEngagement = Math.floor((payload[0]?.value / 100) * (85 + Math.random() * 15));
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
        minWidth: '200px',
      }}>
        <p style={{ 
          margin: '0 0 12px 0', 
          fontWeight: '600',
          fontSize: '16px',
          color: '#ffffff'
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
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span style={{ color: '#3b82f6', fontWeight: '500' }}>
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
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span style={{ color: '#10b981', fontWeight: '500' }}>
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
              Engagement: {mockEngagement}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ViewsOverTime: React.FC<ViewsOverTimeProps> = ({ data, loading = false }) => {
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

  if (loading) {
    return (
      <ChartCard variant="glass">
        <ChartTitle>Views Over Time</ChartTitle>
        <LoadingState>Loading chart data...</LoadingState>
      </ChartCard>
    );
  }

  return (
    <ChartCard variant="glass">
      <ChartTitle>Views Over Time</ChartTitle>
      <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="viewsStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="50%" stopColor="#60a5fa"/>
              <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255, 255, 255, 0.08)"
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              paddingTop: '20px'
            }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="url(#viewsStrokeGradient)"
            strokeWidth={3}
            fill="url(#viewsGradient)"
            name="Views"
            strokeDasharray={animationProgress === 0 ? `${data.length * 10} ${data.length * 10}` : "0"}
            style={{
              transition: 'stroke-dasharray 1.5s ease-in-out',
            }}
          />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default ViewsOverTime;
