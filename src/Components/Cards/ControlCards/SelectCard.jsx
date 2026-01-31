
import styled from 'styled-components';
import { Shield } from 'lucide-react';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import { useSafeMode } from "../../../hooks/useSafeMode";
import SafeModeConfirmModal from "../../Common/SafeModeConfirmModal";

const SelectCard = ({ entities }) => {
  const { connection, isConnectionValid, sendCommand } = useHomeAssistant();
  const { isSafeModeEnabled, confirmChange, confirmationState, handleConfirm, handleCancel } = useSafeMode();

  if (!entities || entities.length === 0) {
    return <p>No select entities available</p>;
  }

  const handleChange = async (entity, newValue) => {
    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      entity.title || entity.attributes?.friendly_name || entity.entity_id,
      entity.state,
      newValue
    );

    if (!confirmed) {
      return; // User cancelled the change
    }

    try {
      await sendCommand({
        type: 'call_service',
        domain: 'select',
        service: 'select_option',
        service_data: {
          entity_id: entity.entity_id,
          option: newValue,
        },
      });
    } catch (error) {
      console.error('Error updating select entity:', error);
    }
  };

  return (
    <>
      <Container>
        {entities.map((entity) => {
          const isToggle =
            entity.options.length === 2 &&
            entity.options.every((opt) =>
              ['true', 'false', 'yes', 'no', 'on', 'off'].includes(opt.toLowerCase())
            );

          const isActive =
            entity.state === 'true' || entity.state === 'on' || entity.state === 'YES';

          return (
          <Card key={entity.entity_id} $safeModeEnabled={isSafeModeEnabled}>
            <Tooltip>{entity.tooltip}</Tooltip> {/* Tooltip hier anzeigen */}
            {isSafeModeEnabled && <SafeModeIndicator title="Safe Mode Active"><Shield size={14} /></SafeModeIndicator>}
            <Title $hasSafeMode={isSafeModeEnabled}>{entity.title}</Title>

            {isToggle ? (
              <ToggleWrapper onClick={() => handleChange(entity, isActive ? 'NO' : 'YES')}>
                <ToggleBackground $isActive={isActive}>
                  <ToggleCircle $isActive={isActive} />
                </ToggleBackground>
              </ToggleWrapper>
            ) : (
              <Dropdown
                value={entity.state}
                onChange={(e) => handleChange(entity, e.target.value)}
              >
                {entity.options.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </Dropdown>
            )}
          </Card>
          );
        })}
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

export default SelectCard;

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
  border: ${props => props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.3)' : 'none'};
  transition: all 0.2s ease;
  min-height: 50px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: ${props => props.$safeModeEnabled ? 'rgba(59, 130, 246, 0.5)' : 'transparent'};
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

const Dropdown = styled.select`
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  margin-right: 0.5rem;
  background: var(--input-bg-color);
  box-shadow: var(--main-shadow-art);
  color: var(--main-text-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
  cursor: pointer;
  min-width: 120px;
  transition: all 0.2s ease;

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
`;

/* Toggle Button */
const ToggleWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content:center;
`;

const ToggleBackground = styled.div.attrs({
  part: 'toggle-background',
})`
  margin-right: 0.4rem;
  width: 50px;
  height: 0.8rem;
  border-radius: 12px;
  background: ${(props) => (props.$isActive ? 'var(--chart-success-color)' : 'var(--disabled-text-color)')};
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background 0.3s ease-in-out;
`;

const ToggleCircle = styled.div.attrs({
  part: 'toggle-circle',
})`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transform: ${(props) => (props.$isActive ? 'translateX(26px)' : 'translateX(0)')};
  transition: transform 0.3s ease-in-out;
`;

