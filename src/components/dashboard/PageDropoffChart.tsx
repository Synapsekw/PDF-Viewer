import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllPdfs, getPageDropoff } from '../../lib/analytics/mockAnalytics';
import { DropoffData } from '../../lib/analytics/types';
import theme from '../../theme';

interface PageDropoffChartProps {
  loading?: boolean;
}

const DropoffCard = styled(Card)`
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

const DropoffTitle = styled.h3`
  color: #ffffff;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[4]} 0;
  letter-spacing: -0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 10;
`;

const SelectContainer = styled.div`
  margin-bottom: ${theme.spacing[4]};
`;

const Select = styled.select`
  background-color: #232f3d;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: ${theme.borderRadius.md};
  font-family: ${theme.typography.fontFamily};
  width: 100%;
  transition: ${theme.transitions.default};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  font-size: ${theme.typography.fontSize.md};
  cursor: pointer;
  position: relative;
  z-index: 10;
  
  &:focus {
    outline: none;
    border-color: #4dabf7;
    box-shadow: 0 0 0 1px #4dabf7;
  }
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  option {
    background: #232f3d;
    color: #ffffff;
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.md};
  }
`;

const ChartContainer = styled.div`
  height: 280px;
  width: 100%;
  position: relative;
  z-index: 10;
`;

const Caption = styled.div`
  text-align: center;
  font-size: ${theme.typography.fontSize.xs};
  color: rgba(255, 255, 255, 0.9);
  margin-top: ${theme.spacing[2]};
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
  position: relative;
  z-index: 10;
`;

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: theme.colors.background.primary,
        border: `1px solid ${theme.colors.ui.border}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[2],
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}>
        <p style={{ margin: 0, color: theme.colors.text.primary }}>
          <strong>Page {label}</strong>
        </p>
        <p style={{ margin: 0, color: theme.colors.text.secondary }}>
          {payload[0].value}% of sessions reached this page
        </p>
      </div>
    );
  }
  return null;
};

const PageDropoffChart: React.FC<PageDropoffChartProps> = ({ loading = false }) => {
  const [pdfs, setPdfs] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string>('');
  const [dropoffData, setDropoffData] = useState<DropoffData | null>(null);
  const [dropoffLoading, setDropoffLoading] = useState(false);

  // Load PDF list
  useEffect(() => {
    const loadPdfs = async () => {
      try {
        const pdfList = await getAllPdfs();
        setPdfs(pdfList);
        if (pdfList.length > 0) {
          setSelectedPdfId(pdfList[0].id);
        }
      } catch (error) {
        console.error('Failed to load PDFs:', error);
      }
    };

    loadPdfs();
  }, []);

  // Load dropoff data when PDF selection changes
  useEffect(() => {
    if (!selectedPdfId) return;

    const loadDropoff = async () => {
      setDropoffLoading(true);
      try {
        const data = await getPageDropoff({ pdfId: selectedPdfId });
        setDropoffData(data);
      } catch (error) {
        console.error('Failed to load dropoff data:', error);
      } finally {
        setDropoffLoading(false);
      }
    };

    loadDropoff();
  }, [selectedPdfId]);

  // Transform data for Recharts
  const chartData = dropoffData?.pages.map(page => ({
    page: page.pageNumber,
    percentage: page.percentage,
  })) || [];

  if (loading) {
    return (
      <DropoffCard variant="glass">
        <DropoffTitle>Drop-off by Page</DropoffTitle>
        <LoadingState>Loading drop-off data...</LoadingState>
      </DropoffCard>
    );
  }

  return (
    <DropoffCard variant="glass">
      <DropoffTitle>Drop-off by Page</DropoffTitle>
      
      <SelectContainer>
        <Select
          value={selectedPdfId}
          onChange={(e) => setSelectedPdfId(e.target.value)}
          disabled={pdfs.length === 0}
        >
          {pdfs.map(pdf => (
            <option key={pdf.id} value={pdf.id}>
              {pdf.title}
            </option>
          ))}
        </Select>
      </SelectContainer>

      <ChartContainer>
        {dropoffLoading ? (
          <LoadingState>Loading drop-off data...</LoadingState>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="dropoffBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                  <stop offset="30%" stopColor="#f87171" stopOpacity={0.7}/>
                  <stop offset="70%" stopColor="#fca5a5" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="dropoffBarStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0}/>
                  <stop offset="50%" stopColor="#f87171" stopOpacity={0}/>
                  <stop offset="100%" stopColor="#fca5a5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.08)"
                vertical={false}
              />
              <XAxis 
                dataKey="page" 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="percentage" 
                fill="url(#dropoffBarGradient)"
                stroke="url(#dropoffBarStrokeGradient)"
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>

      <Caption>
        % of sessions that reached each page
      </Caption>
    </DropoffCard>
  );
};

export default PageDropoffChart;
