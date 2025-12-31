import React from 'react';
import styled from 'styled-components';
import { ChevronRight, CheckCircle, Clock, Circle } from 'lucide-react';

const WeekNavigator = ({ weeks, selectedWeekIndex, onWeekSelect }) => {
  const getWeekStatus = (index) => {
    if (index < selectedWeekIndex) return 'completed';
    if (index === selectedWeekIndex) return 'current';
    return 'upcoming';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} color="#22c55e" />;
      case 'current': return <Clock size={14} color="#3b82f6" />;
      case 'upcoming': return <Circle size={14} color="#6b7280" />;
      default: return <Circle size={14} color="#6b7280" />;
    }
  };

  return (
    <Container>
      {weeks.map((week, index) => {
        const status = getWeekStatus(index);
        const isLast = index === weeks.length - 1;

        return (
          <React.Fragment key={index}>
            <WeekButton
              active={index === selectedWeekIndex}
              status={status}
              onClick={() => onWeekSelect(index)}
              aria-label={`Select Week ${index + 1}`}
            >
              <WeekBadge active={index === selectedWeekIndex} status={status}>
                {index + 1}
              </WeekBadge>
              <WeekText>Week</WeekText>
              <StatusIcon>
                {getStatusIcon(status)}
              </StatusIcon>
            </WeekButton>
            {!isLast && (
              <ArrowContainer>
                <ChevronRight size={16} color="var(--main-text-muted)" />
              </ArrowContainer>
            )}
          </React.Fragment>
        );
      })}
    </Container>
  );
};

export default WeekNavigator;

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

const WeekButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  min-width: 60px;
  border: 2px solid ${props => {
    if (props.active) return '#22c55e';
    if (props.status === 'completed') return '#22c55e';
    if (props.status === 'current') return '#3b82f6';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  border-radius: 0.5rem;
  background: ${props => {
    if (props.active) return 'rgba(34, 197, 94, 0.1)';
    if (props.status === 'completed') return 'rgba(34, 197, 94, 0.05)';
    if (props.status === 'current') return 'rgba(59, 130, 246, 0.05)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  color: var(--main-text-color);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WeekBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => {
    if (props.active) return '#22c55e';
    if (props.status === 'completed') return '#22c55e';
    if (props.status === 'current') return '#3b82f6';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => (props.active || props.status === 'completed' || props.status === 'current') ? 'white' : 'var(--main-text-color)'};
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
`;

const WeekText = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
`;

const StatusIcon = styled.div`
  margin-top: 0.25rem;
`;

const ArrowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;