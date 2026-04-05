import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { X, Check, Zap, Lightbulb, Fan, Thermometer, Droplets } from 'lucide-react';

const PRESET_VALUES = [
  { label: 'LED Grow Light', value: 150, icon: Lightbulb },
  { label: 'HPS Grow Light', value: 600, icon: Lightbulb },
  { label: 'Fan', value: 45, icon: Fan },
  { label: 'AC Unit', value: 1200, icon: Thermometer },
  { label: 'Humidifier', value: 30, icon: Droplets },
  { label: 'Water Pump', value: 25, icon: Droplets },
  { label: 'Exhaust Fan', value: 80, icon: Fan },
  { label: 'Heater', value: 2000, icon: Thermometer },
  { label: 'Small', value: 5, icon: Zap },
  { label: 'Medium', value: 50, icon: Zap },
  { label: 'Large', value: 500, icon: Zap },
  { label: 'Very Large', value: 2000, icon: Zap },
];

const DeviceWattModal = ({ 
  isOpen, 
  onClose, 
  devices, 
  currentWatts, 
  onSave 
}) => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [bulkValue, setBulkValue] = useState('');
  const [individualWatts, setIndividualWatts] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedDevices([]);
      setBulkValue('');
      setIndividualWatts(currentWatts || {});
    }
  }, [isOpen, currentWatts]);

  const toggleDevice = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const toggleAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map(d => d.id));
    }
  };

  const handleBulkSet = () => {
    const watts = parseFloat(bulkValue);
    if (isNaN(watts) || watts <= 0) return;

    const newWatts = { ...individualWatts };
    selectedDevices.forEach(id => {
      newWatts[id] = watts;
    });
    setIndividualWatts(newWatts);
    setBulkValue('');
    setSelectedDevices([]);
  };

  const handleIndividualChange = (deviceId, value) => {
    setIndividualWatts(prev => ({
      ...prev,
      [deviceId]: value ? parseFloat(value) : null
    }));
  };

  const applyPreset = (value) => {
    if (selectedDevices.length === 0) return;
    
    const newWatts = { ...individualWatts };
    selectedDevices.forEach(id => {
      newWatts[id] = value;
    });
    setIndividualWatts(newWatts);
  };

  const handleSave = () => {
    onSave(individualWatts);
    onClose();
  };

  const hasChanges = Object.keys(individualWatts).some(
    id => individualWatts[id] !== currentWatts?.[id]
  );

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Edit Device Watts</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          <Section>
            <SectionTitle>Select Devices</SectionTitle>
            <SelectAllButton onClick={toggleAll}>
              {selectedDevices.length === devices.length ? 'Deselect All' : 'Select All'}
              <Check size={16} style={{ marginLeft: '8px' }} />
            </SelectAllButton>
            
            <DeviceList>
              {devices.map(device => (
                <DeviceItem 
                  key={device.id}
                  $selected={selectedDevices.includes(device.id)}
                  onClick={() => toggleDevice(device.id)}
                >
                  <DeviceInfo>
                    <DeviceName>{device.title}</DeviceName>
                    <DeviceState $active={device.isOn}>
                      {device.isOn ? 'ON' : 'OFF'}
                    </DeviceState>
                  </DeviceInfo>
                  <DeviceWatts>
                    {individualWatts[device.id] !== undefined 
                      ? `${individualWatts[device.id]} W`
                      : currentWatts?.[device.id] 
                        ? `${currentWatts[device.id]} W`
                        : '-'
                    }
                  </DeviceWatts>
                </DeviceItem>
              ))}
            </DeviceList>
          </Section>

          {selectedDevices.length > 0 && (
            <Section>
              <SectionTitle>
                {selectedDevices.length} device{selectedDevices.length > 1 ? 's' : ''} selected
              </SectionTitle>
              
              <BulkEditRow>
                <BulkInput
                  type="number"
                  placeholder="Enter watts..."
                  value={bulkValue}
                  onChange={e => setBulkValue(e.target.value)}
                />
                <BulkButton onClick={handleBulkSet}>
                  Set
                </BulkButton>
              </BulkEditRow>

              <PresetGrid>
                {PRESET_VALUES.map((preset, index) => {
                  const Icon = preset.icon;
                  return (
                    <PresetButton 
                      key={index}
                      onClick={() => applyPreset(preset.value)}
                    >
                      <Icon size={14} />
                      <span>{preset.label}</span>
                      <span className="value">{preset.value}W</span>
                    </PresetButton>
                  );
                })}
              </PresetGrid>
            </Section>
          )}

          <Section>
            <SectionTitle>Individual Adjustment</SectionTitle>
            {devices.map(device => (
              <IndividualRow key={device.id}>
                <DeviceName>{device.title}</DeviceName>
                <IndividualInput
                  type="number"
                  placeholder="W"
                  value={individualWatts[device.id] ?? currentWatts?.[device.id] ?? ''}
                  onChange={e => handleIndividualChange(device.id, e.target.value)}
                />
              </IndividualRow>
            ))}
          </Section>
        </ModalContent>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SaveButton 
            onClick={handleSave} 
            disabled={!hasChanges}
          >
            Save Changes
          </SaveButton>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--main-shadow-art);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border-light);

  h2 {
    margin: 0;
    color: var(--main-text-color);
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--second-text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-secondary);
    color: var(--main-text-color);
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: var(--main-text-color);
  font-size: 0.95rem;
  font-weight: 600;
`;

const SelectAllButton = styled.button`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  color: var(--main-text-color);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-primary);
    border-color: var(--primary-accent);
  }
`;

const DeviceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
`;

const DeviceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${props => props.$selected ? 'var(--active-bg-color)' : 'var(--glass-bg-secondary)'};
  border: 1px solid ${props => props.$selected ? 'var(--primary-accent)' : 'var(--glass-border)'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-primary);
    border-color: var(--glass-border-light);
  }
`;

const DeviceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DeviceName = styled.span`
  color: var(--main-text-color);
  font-size: 0.85rem;
  font-weight: 500;
`;

const DeviceState = styled.span`
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: ${props => props.$active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.$active ? 'var(--chart-success-color)' : 'var(--chart-error-color)'};
  width: fit-content;
`;

const DeviceWatts = styled.span`
  color: var(--primary-accent);
  font-weight: 500;
  font-size: 0.85rem;
`;

const BulkEditRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const BulkInput = styled.input`
  flex: 1;
  padding: 0.6rem 0.8rem;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  color: var(--main-text-color);
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`;

const BulkButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: var(--primary-button-color);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--primary-button-color);
    opacity: 0.9;
  }
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
`;

const PresetButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--main-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;

  &:hover {
    background: var(--glass-bg-primary);
    border-color: var(--primary-accent);
    transform: translateY(-2px);
  }

  .value {
    font-weight: 600;
    color: var(--primary-accent);
  }
`;

const IndividualRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--glass-border);

  &:last-child {
    border-bottom: none;
  }
`;

const IndividualInput = styled.input`
  width: 80px;
  padding: 0.4rem 0.6rem;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 6px;
  color: var(--main-text-color);
  font-size: 0.85rem;
  text-align: right;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--glass-border-light);
`;

const CancelButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--second-text-color);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-secondary);
    color: var(--main-text-color);
  }
`;

const SaveButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: var(--primary-button-color);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

DeviceWattModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  devices: PropTypes.array.isRequired,
  currentWatts: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default DeviceWattModal;
