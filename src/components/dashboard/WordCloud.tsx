import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { KeywordData } from '../../lib/analytics/types';
import theme from '../../theme';

interface WordCloudProps {
  data: KeywordData[];
  loading?: boolean;
}

// Types for grid system
interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  occupied: boolean;
  wordIndex?: number;
}

interface WordPosition {
  x: number;
  y: number;
  rotation: 0 | 90;
  fontSize: number;
}

// Styled components
const CloudCard = styled(Card)`
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

const CloudTitle = styled.h3`
  color: #ffffff;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[4]} 0;
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

const CloudContainer = styled.div`
  position: relative;
  width: 100%;
  height: calc(100% - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 10;
`;

const WordSpan = styled.span<{ 
  fontSize: number;
  rotation: number;
  color: string;
}>`
  position: absolute;
  color: ${props => props.color};
  font-weight: 600;
  font-size: ${props => props.fontSize}px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
  z-index: 10;
  
  &:hover {
    transform: scale(1.1) rotate(${props => props.rotation}deg);
    z-index: 20;
  }
`;

// Utility functions
const getSourceColor = (source: string): string => {
  switch (source) {
    case 'pdf':
      return '#3b82f6'; // blue
    case 'chat':
      return '#10b981'; // green
    case 'clicks':
      return '#f59e0b'; // amber
    default:
      return '#6b7280'; // gray
  }
};

// Accurate text measurement using Canvas API
const measureText = (text: string, fontSize: number): { width: number; height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: 100, height: fontSize };
  
  ctx.font = `600 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
  const metrics = ctx.measureText(text);
  
  return {
    width: Math.ceil(metrics.width),
    height: Math.ceil(fontSize * 1.2) // Line height
  };
};

// Create grid system
const createGrid = (width: number, height: number, cellSize: number = 5): GridCell[][] => {
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const grid: GridCell[][] = [];
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      grid[row][col] = {
        row,
        col,
        x: col * cellSize,
        y: row * cellSize,
        width: cellSize,
        height: cellSize,
        occupied: false
      };
    }
  }
  
  return grid;
};

// Check if a word can fit at a specific position
const canPlaceWord = (
  grid: GridCell[][],
  startRow: number,
  startCol: number,
  wordWidth: number,
  wordHeight: number,
  rotation: 0 | 90
): boolean => {
  const cellSize = grid[0]?.[0]?.width || 10;
  
  // Calculate how many cells the word occupies
  let cellsWide = Math.ceil(wordWidth / cellSize);
  let cellsHigh = Math.ceil(wordHeight / cellSize);
  
  // Swap dimensions if vertical
  if (rotation === 90) {
    [cellsWide, cellsHigh] = [cellsHigh, cellsWide];
  }
  
  // Check bounds
  if (startRow + cellsHigh > grid.length || startCol + cellsWide > grid[0].length) {
    return false;
  }
  
  // Check if all required cells are free
  for (let r = startRow; r < startRow + cellsHigh; r++) {
    for (let c = startCol; c < startCol + cellsWide; c++) {
      if (grid[r]?.[c]?.occupied) {
        return false;
      }
    }
  }
  
  return true;
};

// Mark cells as occupied
const markCellsOccupied = (
  grid: GridCell[][],
  startRow: number,
  startCol: number,
  wordWidth: number,
  wordHeight: number,
  rotation: 0 | 90,
  wordIndex: number
): void => {
  const cellSize = grid[0]?.[0]?.width || 10;
  
  let cellsWide = Math.ceil(wordWidth / cellSize);
  let cellsHigh = Math.ceil(wordHeight / cellSize);
  
  if (rotation === 90) {
    [cellsWide, cellsHigh] = [cellsHigh, cellsWide];
  }
  
  // Add minimal padding (0 cells = touching allowed, just not overlapping)
  const paddingCells = 0;
  const padStartRow = Math.max(0, startRow - paddingCells);
  const padStartCol = Math.max(0, startCol - paddingCells);
  const padEndRow = Math.min(grid.length - 1, startRow + cellsHigh + paddingCells);
  const padEndCol = Math.min(grid[0].length - 1, startCol + cellsWide + paddingCells);
  
  for (let r = padStartRow; r <= padEndRow; r++) {
    for (let c = padStartCol; c <= padEndCol; c++) {
      if (grid[r] && grid[r][c]) {
        grid[r][c].occupied = true;
        grid[r][c].wordIndex = wordIndex;
      }
    }
  }
};

// Get zone bounds for word placement
const getZoneBounds = (gridRows: number, gridCols: number, zone: number): { 
  minRow: number; 
  maxRow: number; 
  minCol: number; 
  maxCol: number;
} => {
  const centerRow = Math.floor(gridRows / 2);
  const centerCol = Math.floor(gridCols / 2);
  
  switch(zone) {
    case 1: // Center zone - for largest word
      return {
        minRow: centerRow - Math.floor(gridRows * 0.05),
        maxRow: centerRow + Math.floor(gridRows * 0.05),
        minCol: centerCol - Math.floor(gridCols * 0.05),
        maxCol: centerCol + Math.floor(gridCols * 0.05)
      };
    case 2: // Inner ring - much tighter
      return {
        minRow: centerRow - Math.floor(gridRows * 0.15),
        maxRow: centerRow + Math.floor(gridRows * 0.15),
        minCol: centerCol - Math.floor(gridCols * 0.15),
        maxCol: centerCol + Math.floor(gridCols * 0.15)
      };
    case 3: // Middle ring - closer
      return {
        minRow: centerRow - Math.floor(gridRows * 0.25),
        maxRow: centerRow + Math.floor(gridRows * 0.25),
        minCol: centerCol - Math.floor(gridCols * 0.25),
        maxCol: centerCol + Math.floor(gridCols * 0.25)
      };
    case 4: // Outer ring - use more space
      return {
        minRow: 1,
        maxRow: gridRows - 2,
        minCol: 1,
        maxCol: gridCols - 2
      };
    default:
      return { minRow: 0, maxRow: gridRows - 1, minCol: 0, maxCol: gridCols - 1 };
  }
};

// Find position for word in zone
const findPositionInZone = (
  grid: GridCell[][],
  wordWidth: number,
  wordHeight: number,
  zone: number,
  preferredRotation: 0 | 90
): { row: number; col: number; rotation: 0 | 90 } | null => {
  const bounds = getZoneBounds(grid.length, grid[0].length, zone);
  const rotations: (0 | 90)[] = preferredRotation === 0 ? [0, 90] : [90, 0];
  
  // Try both rotations
  for (const rotation of rotations) {
    // Try center of zone first
    const centerRow = Math.floor((bounds.minRow + bounds.maxRow) / 2);
    const centerCol = Math.floor((bounds.minCol + bounds.maxCol) / 2);
    
    if (canPlaceWord(grid, centerRow, centerCol, wordWidth, wordHeight, rotation)) {
      return { row: centerRow, col: centerCol, rotation };
    }
    
    // Spiral outward from center
    const maxRadius = Math.max(
      bounds.maxRow - bounds.minRow,
      bounds.maxCol - bounds.minCol
    );
    
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const row = Math.round(centerRow + radius * Math.sin(angle));
        const col = Math.round(centerCol + radius * Math.cos(angle));
        
        if (row >= bounds.minRow && row <= bounds.maxRow &&
            col >= bounds.minCol && col <= bounds.maxCol) {
          if (canPlaceWord(grid, row, col, wordWidth, wordHeight, rotation)) {
            return { row, col, rotation };
          }
        }
      }
    }
  }
  
  return null;
};

// Main positioning function
const positionWords = (
  words: KeywordData[],
  containerWidth: number,
  containerHeight: number
): Map<number, WordPosition> => {
  const positions = new Map<number, WordPosition>();
  
  // Sort words by weight (largest first)
  const sortedWords = [...words].sort((a, b) => b.weight - a.weight);
  const topWords = sortedWords.slice(0, 25); // More words for fuller cloud
  
  // Create grid with smaller cells for tighter packing
  const grid = createGrid(containerWidth, containerHeight, 5);
  const cellSize = grid[0]?.[0]?.width || 5;
  
  // Calculate font sizes
  const maxWeight = topWords[0]?.weight || 100;
  const minWeight = topWords[topWords.length - 1]?.weight || 10;
  
  topWords.forEach((word, index) => {
    // Calculate font size with dramatic difference for largest word
    let fontSize: number;
    if (index === 0) {
      fontSize = Math.min(72, Math.max(48, maxWeight * 0.8));
    } else {
      const normalizedWeight = (word.weight - minWeight) / (maxWeight - minWeight);
      fontSize = Math.min(32, Math.max(14, 14 + normalizedWeight * 18));
    }
    
    // Measure word
    const dimensions = measureText(word.word, fontSize);
    
    // Determine zone based on index
    let zone: number;
    if (index === 0) zone = 1;
    else if (index <= 4) zone = 2;
    else if (index <= 10) zone = 3;
    else zone = 4;
    
    // Prefer horizontal for largest words, mix for others
    const preferredRotation: 0 | 90 = index < 3 ? 0 : (index % 2 === 0 ? 0 : 90);
    
    // Try to place word in its zone
    let position = findPositionInZone(grid, dimensions.width, dimensions.height, zone, preferredRotation);
    
    // If failed, try adjacent zones
    if (!position && zone > 1) {
      for (let fallbackZone = zone + 1; fallbackZone <= 4; fallbackZone++) {
        position = findPositionInZone(grid, dimensions.width, dimensions.height, fallbackZone, preferredRotation);
        if (position) break;
      }
    }
    
    if (position) {
      // Mark cells as occupied
      markCellsOccupied(grid, position.row, position.col, dimensions.width, dimensions.height, position.rotation, index);
      
      // Calculate actual pixel position (center of word)
      let x = position.col * cellSize + dimensions.width / 2;
      let y = position.row * cellSize + dimensions.height / 2;
      
      // Adjust for rotation
      if (position.rotation === 90) {
        x = position.col * cellSize + dimensions.height / 2;
        y = position.row * cellSize + dimensions.width / 2;
      }
      
      positions.set(index, { x, y, rotation: position.rotation, fontSize });
    }
  });
  
  return positions;
};

const WordCloud: React.FC<WordCloudProps> = ({ data, loading = false }) => {
  const [positions, setPositions] = useState<Map<number, WordPosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Memoize sorted words
  const sortedWords = useMemo(() => {
    return [...data].sort((a, b) => b.weight - a.weight).slice(0, 25);
  }, [data]);
  
  useEffect(() => {
    if (containerRef.current && sortedWords.length > 0) {
      const updatePositions = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          const newPositions = positionWords(sortedWords, rect.width, rect.height);
          setPositions(newPositions);
        }
      };
      
      // Initial positioning
      updatePositions();
      
      // Handle resize
      const resizeObserver = new ResizeObserver(updatePositions);
      resizeObserver.observe(containerRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [sortedWords]);
  
  if (loading) {
    return (
      <CloudCard variant="glass">
        <CloudTitle>Most Discussed Topics</CloudTitle>
        <LoadingState>Loading word cloud...</LoadingState>
      </CloudCard>
    );
  }
  
  return (
    <CloudCard variant="glass">
      <CloudTitle>Most Discussed Topics</CloudTitle>
      <CloudContainer ref={containerRef}>
        {sortedWords.map((keyword, index) => {
          const position = positions.get(index);
          if (!position) return null;
          
          return (
            <WordSpan
              key={`${keyword.word}-${index}`}
              fontSize={position.fontSize}
              rotation={position.rotation}
              color={getSourceColor(keyword.source)}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
              }}
              title={`${keyword.word} (${keyword.source}) - Weight: ${keyword.weight}`}
            >
              {keyword.word}
            </WordSpan>
          );
        })}
      </CloudContainer>
    </CloudCard>
  );
};

export default WordCloud;