import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { getAllPdfs, getHeatmapPreview } from '../../lib/analytics/mockAnalytics';
import { HeatmapData } from '../../lib/analytics/types';
import theme from '../../theme';

interface PageHeatmapPreviewProps {
  loading?: boolean;
}

const HeatmapCard = styled(Card)`
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

const HeatmapTitle = styled.h3`
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

const PageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const PagePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: ${theme.typography.fontSize.sm};
  text-align: center;
  padding: ${theme.spacing[4]};
  position: relative;
  z-index: 10;
`;

const PageIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${theme.spacing[2]};
  opacity: 0.3;
  color: rgba(255, 255, 255, 0.6);
`;

const HeatmapOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

const HeatmapPoint = styled.div<{
  x: number;
  y: number;
  intensity: number;
  type: string;
}>`
  position: absolute;
  left: ${props => props.x * 100}%;
  top: ${props => props.y * 100}%;
  width: ${props => Math.max(4, props.intensity * 20)}px;
  height: ${props => Math.max(4, props.intensity * 20)}px;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'click':
        return `rgba(239, 68, 68, ${props.intensity * 0.8})`; // red
      case 'hover':
        return `rgba(59, 130, 246, ${props.intensity * 0.6})`; // blue
      case 'scroll':
        return `rgba(16, 185, 129, ${props.intensity * 0.7})`; // green
      default:
        return `rgba(107, 114, 128, ${props.intensity * 0.5})`; // gray
    }
  }};
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  z-index: 10;
`;

const Legend = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[3]};
  justify-content: center;
  position: relative;
  z-index: 10;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  font-size: ${theme.typography.fontSize.xs};
  color: rgba(255, 255, 255, 0.9);
`;

const LegendDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.md};
`;

const PageHeatmapPreview: React.FC<PageHeatmapPreviewProps> = ({ loading = false }) => {
  const [pdfs, setPdfs] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string>('');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

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

  // Load heatmap data when PDF selection changes
  useEffect(() => {
    if (!selectedPdfId) return;

    const loadHeatmap = async () => {
      setHeatmapLoading(true);
      try {
        const data = await getHeatmapPreview({ pdfId: selectedPdfId });
        setHeatmapData(data);
      } catch (error) {
        console.error('Failed to load heatmap:', error);
      } finally {
        setHeatmapLoading(false);
      }
    };

    loadHeatmap();
  }, [selectedPdfId]);

  if (loading) {
    return (
      <HeatmapCard variant="glass">
        <HeatmapTitle>Page Heatmap</HeatmapTitle>
        <LoadingState>Loading heatmap...</LoadingState>
      </HeatmapCard>
    );
  }

  return (
    <HeatmapCard variant="glass">
      <HeatmapTitle>Page Heatmap</HeatmapTitle>
      
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

      <PageContainer>
        <PagePlaceholder>
          <PageIcon>📄</PageIcon>
          <div>Page Preview</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Representative page thumbnail
          </div>
        </PagePlaceholder>

        {heatmapData && !heatmapLoading && (
          <HeatmapOverlay>
            {heatmapData.points.map((point, index) => (
              <HeatmapPoint
                key={index}
                x={point.x}
                y={point.y}
                intensity={point.intensity}
                type={point.type}
                title={`${point.type} - ${Math.round(point.intensity * 100)}% intensity`}
              />
            ))}
          </HeatmapOverlay>
        )}

        {heatmapLoading && (
          <LoadingState>
            Loading heatmap data...
          </LoadingState>
        )}
      </PageContainer>

      <Legend>
        <LegendItem>
          <LegendDot color="rgba(239, 68, 68, 0.8)" />
          <span>Clicks</span>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(59, 130, 246, 0.6)" />
          <span>Hover</span>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(16, 185, 129, 0.7)" />
          <span>Scroll</span>
        </LegendItem>
      </Legend>
    </HeatmapCard>
  );
};

export default PageHeatmapPreview;
