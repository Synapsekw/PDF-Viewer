import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { QuestionData } from '../../lib/analytics/types';
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import theme from '../../theme';

interface TopQuestionsTableProps {
  data: QuestionData[];
  loading?: boolean;
}

const TableCard = styled(Card)`
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
  display: flex;
  flex-direction: column;
  
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

const TableTitle = styled.h3`
  color: #ffffff;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[4]} 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  letter-spacing: -0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 10;
`;

const SearchContainer = styled.div`
  margin-bottom: ${theme.spacing[4]};
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${theme.typography.fontSize.sm};
  position: relative;
  z-index: 10;
`;

const TableHeader = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TableBody = styled.tbody`
  overflow-y: auto;
`;

const Th = styled.th`
  text-align: left;
  padding: ${theme.spacing[3]} ${theme.spacing[2]};
  color: rgba(255, 255, 255, 1);
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  position: relative;
  z-index: 10;
`;

const Td = styled.td`
  padding: ${theme.spacing[3]} ${theme.spacing[2]};
  color: rgba(255, 255, 255, 1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: ${theme.typography.fontSize.md};
  position: relative;
  z-index: 10;
  
  &:first-child {
    font-weight: ${theme.typography.fontWeight.semibold};
  }
`;

const Tr = styled.tr`
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const CountBadge = styled.span`
  background: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.semibold};
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  z-index: 10;
`;

const DateText = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: ${theme.typography.fontSize.xs};
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.md};
  text-align: center;
  gap: ${theme.spacing[2]};
  position: relative;
  z-index: 10;
`;

const ScrollableBody = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
`;

const TopQuestionsTable: React.FC<TopQuestionsTableProps> = ({ data, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(question =>
      question.question.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <TableCard variant="glass">
        <TableTitle>
          <FiMessageSquare />
          Top AI Questions
        </TableTitle>
        <LoadingState>Loading questions...</LoadingState>
      </TableCard>
    );
  }

  return (
    <TableCard variant="glass">
      <TableTitle>
        <FiMessageSquare />
        Top AI Questions
      </TableTitle>
      
      <SearchContainer>
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<FiSearch />}
          fullWidth
        />
      </SearchContainer>

      <TableContainer>
        {filteredData.length === 0 ? (
          <EmptyState>
            <FiMessageSquare size={24} />
            {searchTerm ? 'No questions match your search' : 'No questions available'}
          </EmptyState>
        ) : (
          <ScrollableBody>
            <Table>
              <TableHeader>
                <tr>
                  <Th>Question</Th>
                  <Th>Count</Th>
                  <Th>Last Asked</Th>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredData.map((question) => (
                  <Tr key={question.id}>
                    <Td>{question.question}</Td>
                    <Td>
                      <CountBadge>{question.count}</CountBadge>
                    </Td>
                    <Td>
                      <DateText>{formatDate(question.lastAsked)}</DateText>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </ScrollableBody>
        )}
      </TableContainer>
    </TableCard>
  );
};

export default TopQuestionsTable;
