import React from 'react';
import styled from 'styled-components';
import { ChevronDown, Save, Eye, Plus, Minus } from 'lucide-react';

const PlanHeader = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  onAddWeek,
  onRemoveWeek,
  onShowJson,
  onSave,
  weeksCount,
  canRemoveWeek,
  isValid
}) => {
  return (
    <Container>
      <Header onClick={onToggle}>
        <TitleSection>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </TitleSection>

        <ToggleIcon $isOpen={isOpen}>
          <ChevronDown size={24} />
        </ToggleIcon>
      </Header>

      {isOpen && (
        <ControlsSection>
          <ActionButtonsWrapper>
            <StyledButton onClick={onAddWeek} variant="success">
              <Plus size={18} /> Add Week
            </StyledButton>
            <StyledButton onClick={onRemoveWeek} variant="danger" disabled={!canRemoveWeek}>
              <Minus size={18} /> Remove Week
            </StyledButton>
            <StyledButton onClick={onShowJson}>
              <Eye size={18} /> Show JSON
            </StyledButton>
            <ApplyButton onClick={onSave} disabled={!isValid}>
              <Save size={18} /> Save Grow-Plan
            </ApplyButton>
          </ActionButtonsWrapper>
        </ControlsSection>
      )}
    </Container>
  );
};

export default PlanHeader;

const Container = styled.div`
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--main-bg-card-color);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--main-text-muted);
  opacity: 0.8;
`;

const ToggleIcon = styled.div`
  transition: transform 0.3s ease;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: var(--main-text-color);
`;

const ControlsSection = styled.div`
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 0.5rem 0.5rem;
`;

const ActionButtonsWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
`;

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  background-color: ${props => {
    switch (props.variant) {
      case 'success': return '#22c55e';
      case 'danger': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};

  color: ${props => props.variant ? 'white' : 'var(--main-text-color)'};

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ApplyButton = styled(StyledButton)`
  background-color: #3b82f6;
  color: white;
  font-weight: 600;

  &:hover:not(:disabled) {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #6b7280;
  }
`;