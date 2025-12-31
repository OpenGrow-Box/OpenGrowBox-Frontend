
import styled from 'styled-components';
import { Shield } from 'lucide-react';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import { getThemeColor } from "../../../utils/themeColors";
import { useSafeMode } from "../../../hooks/useSafeMode";
import SafeModeConfirmModal from "../../Common/SafeModeConfirmModal";

const SwitchCard = ({ entities }) => {
  const { connection, isConnectionValid, sendCommand } = useHomeAssistant();
  const { isSafeModeEnabled, confirmChange, confirmationState, handleConfirm, handleCancel } = useSafeMode();

  if (!entities || entities.length === 0) {
    return <p>No switch entities available</p>;
  }

  const handleToggle = async (entity) => {
    const isOn = entity.state === 'on';
    const newState = isOn ? 'off' : 'on';

    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      entity.title || entity.attributes?.friendly_name || entity.entity_id,
      isOn,
      !isOn
    );

    if (!confirmed) {
      return; // User cancelled the change
    }

    try {
      await sendCommand({
        type: 'call_service',
        domain: 'homeassistant',
        service: isOn ? 'turn_off' : 'turn_on',
        service_data: {
          entity_id: entity.entity_id,
        },
      });
    } catch (error) {
      console.error('Error updating switch entity:', error);
    }
  };

  return (
    <>
      <Container>
        {entities.map((entity) => (
        <Card key={entity.entity_id} $safeModeEnabled={isSafeModeEnabled}>
          <CardHeader>
            <Tooltip>{entity.tooltip}</Tooltip> {/* Tooltip anzeigen */}
            {isSafeModeEnabled && <SafeModeIndicator title="Safe Mode Active"><Shield size={14} /></SafeModeIndicator>}
            <Title>{entity.title || entity.entity_id}</Title>
            <ToggleSwitch>
              <SwitchInput
                type="checkbox"
                checked={entity.state === 'on'}
                onChange={() => handleToggle(entity)}
              />
              <SliderTrack />
            </ToggleSwitch>
          </CardHeader>
        </Card>

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
        changeType="toggle"
      />
    </>
  );
};

export default SwitchCard;

const Container = styled.div`
  display: flex;
  width:100%;
  flex-direction: column;
  justify-content:center;
  margin-top:0.2rem;
  gap: 0.4rem;
`;

const Tooltip = styled.div`
  position: absolute;
  top: -1.5rem;
  left: 0;
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
  position: relative; /* Für Tooltip-Positionierung */
  background: var(--main-bg-card-color);
  border-radius: 8px;
  box-shadow: var(--main-shadow-art);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: ${props => props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'};

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const SafeModeIndicator = styled.span`
  display: flex;
  align-items: center;
  font-size: 14px;
  opacity: 0.8;
  color: #ef4444;
  filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.3));
  transition: all 0.2s ease;
  margin-right: 0.5rem;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;


const CardHeader = styled.div`
  display: flex;
  margin-left: 1rem;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const Title = styled.p`
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--main-text-color);
  flex: 1;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  margin-right: 0.3rem;
  display: inline-block;
  width: 42px;
  height: 24px;

  @media (max-width: 640px) {
    margin-right: 0;
    align-self: flex-end;
  }
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: var(--primary-accent);
  }

  &:checked + span:before {
    transform: translateX(18px);
  }
`;

const SliderTrack = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--disabled-text-color);
  transition: 0.4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;
