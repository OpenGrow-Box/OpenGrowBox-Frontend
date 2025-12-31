import React from 'react';
import styled from 'styled-components';
import { Leaf, Globe, Lock } from 'lucide-react';

const PlanMetadata = ({
  startDate,
  growPlanName,
  isPublic,
  onUpdateStartDate,
  onUpdatePlanName,
  onTogglePublic
}) => {
  const validateDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const now = new Date();
    return selectedDate >= now;
  };

  const isValidDate = validateDate(startDate);

  return (
    <Container>
      <CardHeader>
        <CardTitle>
          <Leaf size={20} />
          Plan Settings
        </CardTitle>
      </CardHeader>

      <InputsWrapper>
        <InputGroup>
          <Label>Start Date</Label>
          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => onUpdateStartDate(e.target.value)}
            className={!isValidDate ? 'invalid' : ''}
          />
          {!isValidDate && (
            <ErrorText>Start date must be in the future</ErrorText>
          )}
        </InputGroup>

        <InputGroup>
          <Label>Grow Plan Name</Label>
          <TextInput
            type="text"
            value={growPlanName}
            onChange={(e) => onUpdatePlanName(e.target.value)}
            placeholder="Enter plan name..."
            maxLength={50}
          />
          <CharCount>{growPlanName.length}/50</CharCount>
        </InputGroup>
      </InputsWrapper>

      <CompactSection>
        <CardHeader>
          <CardTitle>Sharing</CardTitle>
          <ModernToggle
            checked={isPublic}
            onChange={onTogglePublic}
            label="Make Plan Public"
          />
        </CardHeader>
        <InfoText>
          {isPublic ? (
            <>
              <Globe size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
              Public plans are visible to other users and can be used as templates
            </>
          ) : (
            <>
              <Lock size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
              Private plans are only visible to you
            </>
          )}
        </InfoText>
      </CompactSection>
    </Container>
  );
};

export default PlanMetadata;

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const CardTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const InputsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-color);
  opacity: 0.9;
`;

const DateInput = styled.input`
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }

  &.invalid {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
`;

const TextInput = styled.input`
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }

  &::placeholder {
    color: var(--main-text-muted);
    opacity: 0.6;
  }
`;

const CharCount = styled.span`
  font-size: 0.75rem;
  color: var(--main-text-muted);
  opacity: 0.8;
  align-self: flex-end;
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 500;
`;

const CompactSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModernToggle = ({ checked, onChange, label }) => (
  <ToggleContainer onClick={onChange}>
    <ToggleSwitch checked={checked}>
      <ToggleKnob checked={checked} />
    </ToggleSwitch>
    <ToggleText>{label}</ToggleText>
  </ToggleContainer>
);

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${props => props.checked ? '#22c55e' : '#6b7280'};
  border-radius: 24px;
  transition: background-color 0.3s ease;
`;

const ToggleKnob = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.checked ? '22px' : '2px'};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s ease;
`;

const ToggleText = styled.span`
  font-size: 0.875rem;
  color: var(--main-text-color);
  opacity: 0.9;
`;

const InfoText = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: var(--main-text-muted);
  opacity: 0.8;
  font-style: italic;
`;