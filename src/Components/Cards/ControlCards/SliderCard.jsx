import { useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import { useSafeMode } from "../../../hooks/useSafeMode";
import SafeModeConfirmModal from "../../Common/SafeModeConfirmModal";
import { Shield, Lock } from 'lucide-react';

const SliderCard = ({ entities }) => {
  const { connection, isConnectionValid, sendCommand } = useHomeAssistant();
  const { isSafeModeEnabled, confirmChange, confirmationState, handleConfirm, handleCancel } = useSafeMode();

  // Local state for visual feedback during slider drag
  const [localValues, setLocalValues] = useState({});

  // Helper functions to manage local values per entity
  const getLocalValue = (entityId) => {
    return localValues[entityId] ?? null;
  };

  const setLocalValue = (entityId, value) => {
    setLocalValues(prev => ({ ...prev, [entityId]: value }));
  };

  const clearLocalValue = (entityId) => {
    setLocalValues(prev => {
      const { [entityId]: _, ...rest } = prev;
      return rest;
    });
  };

  if (!entities || entities.length === 0) {
    return <p>No slider entities available</p>;
  }

  // Get value prefix for offset values
  const getValuePrefix = (entityId) => {
    if (entityId.includes('leaftemp_offset')) return '-';
    return '';
  };

  const handleSliderChange = async (entity, value) => {
    // Check if entity is disabled/locked
    const isLocked = entity.disabled || entity.attributes?.disabled || entity.attributes?.locked;
    if (isLocked) {
      return;
    }

    // Request confirmation if Safe Mode is enabled
    const confirmed = await confirmChange(
      entity.title || entity.entity_id,
      entity.state,
      value
    );

    if (!confirmed) {
      return;
    }

    try {
      await sendCommand({
        type: 'call_service',
        domain: 'number',
        service: 'set_value',
        service_data: {
          entity_id: entity.entity_id,
          value: value,
        },
      });
    } catch (error) {
      console.error('Error updating number entity:', error);
    }
  };

  // Handle keyboard navigation for sliders
  const handleKeyDown = (e, entity) => {
    const isLocked = entity.disabled || entity.attributes?.disabled || entity.attributes?.locked;
    if (isLocked) return;

    const currentValue = parseFloat(entity.state);
    const min = parseFloat(entity.min);
    const max = parseFloat(entity.max);
    const step = parseFloat(entity.step) || 1;
    const largeStep = step * 10; // For Page Up/Down
    
    let newValue = currentValue;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
      case '+':
      case '=': // + without shift
        e.preventDefault();
        newValue = Math.min(max, currentValue + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
      case '-':
      case '_': // - without shift on some keyboards
        e.preventDefault();
        newValue = Math.max(min, currentValue - step);
        break;
      case 'PageUp':
        e.preventDefault();
        newValue = Math.min(max, currentValue + largeStep);
        break;
      case 'PageDown':
        e.preventDefault();
        newValue = Math.max(min, currentValue - largeStep);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      default:
        return; // Don't process other keys
    }

    // Round to step precision to avoid floating point issues
    const precision = step.toString().includes('.') 
      ? step.toString().split('.')[1].length 
      : 0;
    newValue = parseFloat(newValue.toFixed(precision));

    if (newValue !== currentValue) {
      handleSliderChange(entity, newValue);
    }
  };

  return (
    <Container>
      {entities.map((entity) => {
        const isLocked = entity.disabled || entity.attributes?.disabled || entity.attributes?.locked;
        
        return (
          <Card key={entity.entity_id} $isLocked={isLocked} $safeModeEnabled={isSafeModeEnabled}>
            <CardHeader>
              <Tooltip>{entity.tooltip}</Tooltip>
               <Title $hasLockIcons={isSafeModeEnabled || isLocked}>{entity.title}</Title>
              <Value>{getValuePrefix(entity.entity_id)}{getLocalValue(entity.entity_id) ?? entity.state}</Value>
              <Unit>{entity.unit}</Unit>
              
              {/* Lock indicators */}
              {isSafeModeEnabled && (
                <SafeModeIndicator title="Safe Mode Active">
                  <Shield size={14} />
                </SafeModeIndicator>
              )}
              {isLocked && (
                <LockIndicator title="Slider Locked">
                  <Lock size={14} />
                </LockIndicator>
              )}
            </CardHeader>
            <SliderWrapper>
              <Slider
                type="range"
                min={entity.min}
                max={entity.max}
                step={entity.step}
                value={getLocalValue(entity.entity_id) ?? entity.state}
                disabled={isLocked}
                onChange={(e) => setLocalValue(entity.entity_id, parseFloat(e.target.value))}
                onPointerUp={(e) => {
                  const value = parseFloat(e.target.value);
                  clearLocalValue(entity.entity_id);
                  handleSliderChange(entity, value);
                }}
                onKeyDown={(e) => handleKeyDown(e, entity)}
                tabIndex={isLocked ? -1 : 0}
                aria-label={entity.title}
                aria-valuemin={entity.min}
                aria-valuemax={entity.max}
                aria-valuenow={getLocalValue(entity.entity_id) ?? entity.state}
              />
            </SliderWrapper>
          </Card>
        );
      })}
      
      {/* Safe Mode Confirmation Modal */}
      <SafeModeConfirmModal
        isOpen={confirmationState.isOpen}
        entityName={confirmationState.entityName}
        currentValue={confirmationState.currentValue}
        newValue={confirmationState.newValue}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default SliderCard;

const Container = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  margin-top: 0.2rem;
  gap: 0.25rem;
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
  border-radius: 8px;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;
  border: ${props => 
    props.$isLocked ? '1px solid var(--disabled-text-color)' : 
    props.$safeModeEnabled ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'
  };
  opacity: ${props => props.$isLocked ? '0.6' : '1'};
  transition: all 0.2s ease;
  padding: 0.5rem 0.75rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:hover ${Tooltip} {
    opacity: 1;
  }

  @media (max-width: 640px) {
    padding: 0.4rem 0.5rem;
  }
 `;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0;
  gap: 0.5rem;

  @media (max-width: 640px) {
    gap: 0.25rem;
  }
`;

const Title = styled.p`
  margin-left: ${({ $hasLockIcons }) => $hasLockIcons ? '2rem' : '0'};
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--main-text-color);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 640px) {
    margin-left: ${({ $hasLockIcons }) => $hasLockIcons ? '1.5rem' : '0'};
    font-size: 0.75rem;
  }
`;

const SliderWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0 0 0;

  @media (max-width: 640px) {
    padding: 0.2rem 0 0 0;
  }
`;

const Slider = styled.input.attrs(props => ({
    type: 'range',
    style: {
      '--min': props.min,
      '--max': props.max,
      '--val': props.value,
      '--step': props.step,
    }
  }))`
  flex-grow: 1;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    rgb(189, 252, 192) 0%,
    rgb(13, 234, 20) calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
    #777 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
    #777 100%
  );
  appearance: none;
  transition: background 0.3s ease, box-shadow 0.2s ease;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? '0.5' : '1'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(13, 234, 20, 0.3);
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(13, 234, 20, 0.5);
  }
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: var(--main-unit-color);
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
    border: none;
  }

  &:focus::-webkit-slider-thumb {
    transform: scale(1.1);
    box-shadow: 0 0 0 3px rgba(13, 234, 20, 0.4);
  }
  
  &::-moz-range-thumb {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: var(--main-unit-color);
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
    border: none;
  }

  &:focus::-moz-range-thumb {
    transform: scale(1.1);
    box-shadow: 0 0 0 3px rgba(13, 234, 20, 0.4);
  }
`;

const Value = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--main-value-color);
`;

const Unit = styled.div`
  padding-left: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--main-unit-color);
  white-space: nowrap;
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

const LockIndicator = styled.span`
  position: absolute;
  top: 6px;
  left: 24px;
  font-size: 14px;
  opacity: 0.8;
  color: var(--disabled-text-color);
  filter: drop-shadow(0 0 3px rgba(107, 114, 128, 0.3));
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;