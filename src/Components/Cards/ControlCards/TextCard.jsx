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
      <CardHeader>
        <Tooltip>{entity.tooltip}</Tooltip>
        <Title>{entity.title || entity.friendly_name}</Title>
        {isSafeModeEnabled && <SafeModeIndicator title="Safe Mode Active"><Shield size={14} /></SafeModeIndicator>}
        <Value>{entity.state}</Value>
        {entity.unit && <Unit>{entity.unit}</Unit>}
      </CardHeader>
      <InputWrapper>
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
  margin-top: 0.45rem;
  gap: 0.5rem;
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
  background: var(--main-bg-Innercard-color);
  border-radius: 8px;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;
  border: ${props => props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'};

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
  justify-content: space-around;
  align-items: center;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const Title = styled.p`
  margin-left: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  width: 80%;

  @media (max-width: 640px) {
    width: 100%;
    margin-left: 0;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.4rem 1rem 1rem 1rem;

  @media (max-width: 640px) {
    padding: 0.4rem 0.8rem 0.8rem 0.8rem;
  }
`;

const TextInput = styled.input`
  flex-grow: 1;
  background: transparent;
  border: 1px solid var(--main-unit-color);
  color: var(--main-value-color);
  font-size: 0.9rem;
  padding: 0.4rem;
  border-radius: 6px;
  outline: none;
  transition: 0.2s ease border-color;

  &:focus {
    border-color: var(--main-value-color);
  }
`;

const Value = styled.div`
  color: var(--main-value-color);
`;

const Unit = styled.div`
  padding-left: 0.3rem;
  margin-right: 0.4rem;
  width: 15%;
  color: var(--main-unit-color);
`;
