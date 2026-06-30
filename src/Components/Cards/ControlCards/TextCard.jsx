import { useState, useEffect } from "react";
import styled from "styled-components";
import { Shield } from 'lucide-react';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import { useSafeMode } from "../../../hooks/useSafeMode";
import SafeModeConfirmModal from "../../Common/SafeModeConfirmModal";

// Single text input component with local state
const TextInputCard = ({ entity, sendCommand, isSafeModeEnabled, confirmChange }) => {
  const [localValue, setLocalValue] = useState(entity.state || '');

  // Sync with entity state when it changes from external source
  useEffect(() => {
    if (entity.state !== undefined && entity.state !== localValue) {
      setLocalValue(entity.state);
    }
  }, [entity.state]);

  const handleTextChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = async () => {
    // Skip if value hasn't changed
    if (localValue === entity.state) {
      return;
    }

    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      entity.title || entity.friendly_name || entity.entity_id,
      entity.state,
      localValue
    );

    if (!confirmed) {
      // Revert to original value
      setLocalValue(entity.state);
      return;
    }

    try {
      await sendCommand({
        type: "call_service",
        domain: "text",
        service: "set_value",
        service_data: {
          entity_id: entity.entity_id,
          value: localValue,
        },
      });
    } catch (error) {
      console.error("Error updating text entity:", error);
      // Revert to original value on error
      setLocalValue(entity.state);
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
      <CardHeader>
        {isSafeModeEnabled && <SafeModeIndicator title="Safe Mode Active"><Shield size={14} /></SafeModeIndicator>}
        <Title $hasSafeMode={isSafeModeEnabled}>{entity.title || entity.friendly_name}</Title>
      </CardHeader>
      <InputWrapper>
        {entity.unit && <Unit>{entity.unit}</Unit>}
        <TextInput
          type="text"
          value={localValue}
          placeholder={entity.placeholder || "Enter value..."}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </InputWrapper>
    </Card>
  );
};

const TextCard = ({ entities }) => {
  const { sendCommand } = useHomeAssistant();
  const { isSafeModeEnabled, confirmChange, confirmationState, handleConfirm, handleCancel } = useSafeMode();

  if (!entities || entities.length === 0) {
    return <p>No text entities available</p>;
  }

  return (
    <>
      <Container>
        {entities.map((entity) => (
          <TextInputCard
            key={entity.entity_id}
            entity={entity}
            sendCommand={sendCommand}
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
        changeType="input"
      />
    </>
  );
};

export default TextCard;

// ==== STYLES ====

const Container = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  margin-top: 0.5rem;
  gap: 0.6rem;
  padding: 0 0.5rem;
  color: var(--main-text-color);
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
  border: ${props => props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.3)' : 'none'};
  transition: all 0.2s ease;
  min-height: 50px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    ${props => !props.$safeModeEnabled && `border-color: transparent;`}
  }

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const SafeModeIndicator = styled.span`
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 14px;
  opacity: 0.8;
  color: #ef4444;
  filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.3));
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: 0.5rem;
`;

const Title = styled.p`
  margin: 0;
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  flex: 1;
  padding-left: ${({ $hasSafeMode }) => $hasSafeMode ? '1.5rem' : '0'};

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TextInput = styled.input`
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  background: var(--input-bg-color);
  box-shadow: var(--main-shadow-art);
  color: var(--main-text-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
  outline: none;
  min-width: 120px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--active-bg-color);
    border-color: rgba(59, 130, 246, 0.3);
  }

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const Value = styled.div`
  color: var(--main-value-color);
  font-size: 0.85rem;
`;

const Unit = styled.div`
  color: var(--main-unit-color);
  font-size: 0.8rem;
`;
