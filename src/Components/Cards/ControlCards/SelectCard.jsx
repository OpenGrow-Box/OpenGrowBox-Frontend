
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

    const isTextDomain = entity.entity_id?.startsWith('text.');

    try {
      if (isTextDomain) {
        await sendCommand({
          type: 'call_service',
          domain: 'text',
          service: 'set_value',
          service_data: {
            entity_id: entity.entity_id,
            value: newValue,
          },
        });
      } else {
        await sendCommand({
          type: 'call_service',
          domain: 'select',
          service: 'select_option',
          service_data: {
            entity_id: entity.entity_id,
            option: newValue,
          },
        });
      }
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

          const isWorkMode = entity.entity_id?.includes('workmode');
          const workModeState = entity.state?.toLowerCase() || '';
          const isWorkModeActive = isWorkMode && 
            (workModeState === 'on' || workModeState === 'yes' || workModeState === 'true' || workModeState === 'active' || workModeState === 'work');

          return (
          <Card key={entity.entity_id} $safeModeEnabled={isSafeModeEnabled} $workModeActive={isWorkModeActive}>
            <Tooltip>{entity.tooltip}</Tooltip>
            {isSafeModeEnabled && <SafeModeIndicator title="Safe Mode Active"><Shield size={14} /></SafeModeIndicator>}
            {isWorkModeActive && <WorkModeBadge>ACTIVE</WorkModeBadge>}
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
  ${props => props.$workModeActive && `
    border: 2px solid #ef4444;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, 
      rgba(239, 68, 68, 0.1) 0%, 
      var(--main-bg-card-color) 100%);
  `}
  transition: all 0.2s ease;
  min-height: 50px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    ${props => !props.$safeModeEnabled && !props.$workModeActive && `border-color: transparent;`}
  }

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const WorkModeBadge = styled.div`
  position: absolute;
  top: -10px;
  right: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;

  @keyframes pulse {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    50% { 
      transform: scale(1.05);
      box-shadow: 0 0 24px rgba(239, 68, 68, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
  animation: pulse 1.5s infinite;
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

const ToggleBackground = styled.div`
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

const ToggleCircle = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transform: ${(props) => (props.$isActive ? 'translateX(26px)' : 'translateX(0)')};
  transition: transform 0.3s ease-in-out;
`;

