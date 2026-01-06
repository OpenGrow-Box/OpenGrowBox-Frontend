import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Shield } from 'lucide-react';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import { useSafeMode } from '../../../hooks/useSafeMode';
import SafeModeConfirmModal from "../../Common/SafeModeConfirmModal";

// Single time input component with local state
const TimeInputCard = ({ entity, connection, isSafeModeEnabled, confirmChange }) => {
  const [localValue, setLocalValue] = useState(entity.state || '00:00');

  // Sync with entity state when it changes from external source
  useEffect(() => {
    if (entity.state && entity.state !== localValue) {
      setLocalValue(entity.state);
    }
  }, [entity.state]);

  const handleTimeChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleBlur = async () => {
    // Only send if value actually changed
    if (localValue === entity.state) return;

    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      entity.title || entity.entity_id,
      entity.state,
      localValue
    );

    if (!confirmed) {
      // User cancelled, revert to original value
      setLocalValue(entity.state);
      return;
    }

    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'opengrowbox', 
          service: 'update_time',
          service_data: {
            entity_id: entity.entity_id,
            time: localValue,
          },
        });
      } catch (error) {
        console.error('Error updating entity:', error);
        // Revert to original value on error
        setLocalValue(entity.state);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Trigger blur to save
    }
  };

  return (
    <Card $safeModeEnabled={isSafeModeEnabled}>
      <Tooltip>{entity.tooltip}</Tooltip>
      {isSafeModeEnabled && (
        <SafeModeIndicator title="Safe Mode Active">
          <Shield size={14} />
        </SafeModeIndicator>
      )}
      <Title $hasLockIcons={isSafeModeEnabled}>{entity.title}</Title>
      <TimeInput
        type="time"
        value={localValue}
        onChange={handleTimeChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </Card>
  );
};

const TimeCard = ({ entities }) => {
  const { connection } = useHomeAssistant();
  const { isSafeModeEnabled, confirmChange, confirmationState, handleConfirm, handleCancel } = useSafeMode();

  if (!entities || entities.length === 0) {
    return <p>No time entities available</p>;
  }

  return (
    <>
      <Container>
        {entities.map((entity) => (
          <TimeInputCard
            key={entity.entity_id}
            entity={entity}
            connection={connection}
            isSafeModeEnabled={isSafeModeEnabled}
            confirmChange={confirmChange}
          />
        ))}
      </Container>

      {/* Safe Mode Confirmation Modal */}
      <SafeModeConfirmModal
        isOpen={confirmationState.isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        entityName={confirmationState.entityName}
        currentValue={confirmationState.currentValue}
        newValue={confirmationState.newValue}
      />
    </>
  );
};

export default TimeCard;

const Container = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  margin-top: 0.5rem;
  gap: 0.6rem;
  padding: 0 0.5rem;
`;


const Tooltip = styled.div`
  position: absolute;
  top: -1.5rem;
  left: 1rem;
  background-color: var(--main-bg-color);
  color: var(--main-text-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
`;


const Card = styled.div`
  position: relative;
  background: var(--main-bg-card-color);
  border-radius: 12px;
  box-shadow: var(--main-shadow-art);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  transition: all 0.2s ease;
  min-height: 50px;
  border: ${props => props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.3)' : 'none'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const SafeModeIndicator = styled.div`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  z-index: 2;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }

  @media (max-width: 640px) {
    left: 8px;
  }
`;


const Title = styled.p`
  margin: 0;
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: bold;
  flex: 1;
  margin-left: ${({ $hasLockIcons }) => $hasLockIcons ? '1.5rem' : '0'};

  @media (max-width: 640px) {
    width: 100%;
    margin-left: ${({ $hasLockIcons }) => $hasLockIcons ? '1.5rem' : '0'};
  }
`;

const TimeInput = styled.input`
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--input-bg-color);
  box-shadow: var(--main-shadow-art);
  color: var(--main-text-color);
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 140px;
  text-align: center;
  transition: all 0.2s ease;

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  &:hover {
    background: var(--active-bg-color);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
  }
`;
