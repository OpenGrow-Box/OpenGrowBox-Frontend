import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlusCircle, FaCheck, FaTimes, FaCog } from 'react-icons/fa';
import useDeviceDiscovery from '../../hooks/useDeviceDiscovery';
import { useHomeAssistant } from '../Context/HomeAssistantContext';

const AVAILABLE_LABELS = [
  { value: 'light', label: 'Light' },
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'intake', label: 'Intake' },
  { value: 'ventilation', label: 'Ventilation' },
  { value: 'humidifier', label: 'Humidifier' },
  { value: 'dehumidifier', label: 'Dehumidifier' },
  { value: 'cooler', label: 'Cooler' },
  { value: 'heater', label: 'Heater' },
  { value: 'pump', label: 'Pump' },
  { value: 'sensor', label: 'Sensor' },
];

const DeviceDiscoveryToast = () => {
  const { proposals, acceptProposal, ignoreProposal, dismissProposal } = useDeviceDiscovery();
  const { roomOptions, currentRoom } = useHomeAssistant();
  const [visibleProposals, setVisibleProposals] = useState([]);
  const [activeWizard, setActiveWizard] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [deviceName, setDeviceName] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    setVisibleProposals(proposals.filter(p => !p.dismissed));
  }, [proposals]);

  const openWizard = (proposal) => {
    setActiveWizard(proposal);
    setSelectedRoom(currentRoom || roomOptions[0] || '');
    setSelectedLabels([]);
    setDeviceName(proposal.name || proposal.device_info?.name || 'Unknown Device');
    setCustomLabel('');
  };

  const closeWizard = () => {
    setActiveWizard(null);
    setSelectedRoom('');
    setSelectedLabels([]);
    setDeviceName('');
    setCustomLabel('');
  };

  const getAllLabels = () => {
    const labels = [...selectedLabels];
    if (customLabel.trim()) {
      labels.push(customLabel.trim().toLowerCase().replace(/\s+/g, '_'));
    }
    return labels;
  };

  const toggleLabel = (labelValue) => {
    setSelectedLabels(prev => 
      prev.includes(labelValue) 
        ? prev.filter(l => l !== labelValue)
        : [...prev, labelValue]
    );
  };

  const handleAccept = async () => {
    if (!activeWizard) return;
    const allLabels = getAllLabels();
    await acceptProposal(activeWizard.id, selectedRoom, allLabels, deviceName);
    closeWizard();
  };

  if (visibleProposals.length === 0 && !activeWizard) return null;

  return (
    <>
      <ToastContainer>
        {visibleProposals.map((proposal) => (
          <ToastItem key={proposal.id}>
            <ToastHeader>
              <ToastIcon><FaPlusCircle /></ToastIcon>
              <ToastTitle>New Device Found</ToastTitle>
            </ToastHeader>
            
            <ToastContent>
              <DeviceName>{proposal.name || proposal.device_info?.name || 'Unknown Device'}</DeviceName>
              <DeviceType>{proposal.device_type || 'generic'} ({proposal.confidence ? Math.round(proposal.confidence * 100) + '%' : '?'})</DeviceType>
              <DeviceDetails>
                {proposal.ip_address && <span>IP: {proposal.ip_address}</span>}
                {proposal.device_info?.manufacturer && <span>Maker: {proposal.device_info.manufacturer}</span>}
                {proposal.suggested_room && <span>Suggested: {proposal.suggested_room}</span>}
              </DeviceDetails>
            </ToastContent>
            
            <ToastActions>
              <ActionButton 
                variant="accept" 
                onClick={() => openWizard(proposal)}
              >
                <FaCog /> Configure
              </ActionButton>
              <ActionButton 
                variant="ignore" 
                onClick={() => ignoreProposal(proposal.id)}
              >
                <FaTimes /> Ignore
              </ActionButton>
            </ToastActions>
            
            <DismissButton onClick={() => dismissProposal(proposal.id)}>
              <FaTimes />
            </DismissButton>
          </ToastItem>
        ))}
      </ToastContainer>

      {activeWizard && (
        <WizardOverlay onClick={closeWizard}>
          <WizardModal onClick={e => e.stopPropagation()}>
            <WizardHeader>
              <WizardTitle>Configure Device</WizardTitle>
              <CloseButton onClick={closeWizard}><FaTimes /></CloseButton>
            </WizardHeader>

            <WizardContent>
              <DeviceInfo>
                <FormGroup>
                  <Label>Device Name</Label>
                  <NameInput 
                    type="text" 
                    value={deviceName} 
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Enter device name..."
                  />
                </FormGroup>
                <DeviceMeta>
                  {activeWizard.device_type || 'generic'} • {activeWizard.manufacturer || 'Unknown'} • {activeWizard.ip_address || 'No IP'}
                  {activeWizard.confidence && (
                    <ConfidenceBadge confidence={activeWizard.confidence}>
                      {Math.round(activeWizard.confidence * 100)}% erkannt
                    </ConfidenceBadge>
                  )}
                </DeviceMeta>
              </DeviceInfo>

              <FormGroup>
                <Label>Room</Label>
                <Select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                  {roomOptions.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Device Labels</Label>
                <LabelsGrid>
                  {AVAILABLE_LABELS.map((label) => (
                    <LabelChip 
                      key={label.value}
                      $active={selectedLabels.includes(label.value)}
                      onClick={() => toggleLabel(label.value)}
                    >
                      {label.label}
                    </LabelChip>
                  ))}
                </LabelsGrid>
              </FormGroup>

              <FormGroup>
                <Label>Custom Label (optional)</Label>
                <CustomLabelInput
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Main_Light, Backup_Pump..."
                />
                <HintText>Use underscores instead of spaces</HintText>
              </FormGroup>
            </WizardContent>

            <WizardFooter>
              <ActionButton variant="secondary" onClick={closeWizard}>
                Cancel
              </ActionButton>
              <ActionButton variant="accept" onClick={handleAccept}>
                <FaCheck /> Add to Home Assistant
              </ActionButton>
            </WizardFooter>
          </WizardModal>
        </WizardOverlay>
      )}
    </>
  );
};

const ToastContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
`;

const ToastItem = styled.div`
  position: relative;
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.3s ease-out;
  backdrop-filter: blur(10px);
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ToastHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const ToastIcon = styled.div`
  color: #4CAF50;
  font-size: 20px;
`;

const ToastTitle = styled.h4`
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

const ToastContent = styled.div`
  margin-bottom: 14px;
`;

const DeviceName = styled.div`
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const DeviceType = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  margin-bottom: 8px;
  text-transform: capitalize;
`;

const DeviceDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  span {
    background: rgba(255, 255, 255, 0.08);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const ToastActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'accept' ? `
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
      transform: translateY(-1px);
    }
  ` : props.variant === 'secondary' ? `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }
  `}
`;

const DismissButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  
  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`;

// Wizard Styles
const WizardOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 11000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
`;

const WizardModal = styled.div`
  background: rgba(30, 30, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const WizardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const WizardTitle = styled.h3`
  margin: 0;
  color: #fff;
  font-size: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  
  &:hover {
    color: white;
  }
`;

const WizardContent = styled.div`
  padding: 20px;
`;

const DeviceInfo = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
`;

const DeviceNameLarge = styled.div`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const DeviceMeta = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ConfidenceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.confidence >= 0.9) return 'rgba(76, 175, 80, 0.3)';
    if (props.confidence >= 0.7) return 'rgba(255, 193, 7, 0.3)';
    return 'rgba(244, 67, 54, 0.3)';
  }};
  color: ${props => {
    if (props.confidence >= 0.9) return '#4CAF50';
    if (props.confidence >= 0.7) return '#FFC107';
    return '#F44336';
  }};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--primary-accent, #4CAF50);
  }
  
  option {
    background: #2a2a3a;
    color: #fff;
  }
`;

const NameInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-accent, #4CAF50);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const CustomLabelInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-accent, #4CAF50);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const HintText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
`;

const LabelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
`;

const LabelChip = styled.button`
  padding: 8px 12px;
  border: 2px solid ${props => props.$active ? 'var(--primary-accent, #4CAF50)' : 'rgba(255, 255, 255, 0.2)'};
  background: ${props => props.$active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
  color: ${props => props.$active ? '#4CAF50' : 'rgba(255, 255, 255, 0.8)'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-accent, #4CAF50);
    background: rgba(76, 175, 80, 0.1);
  }
`;

const WizardFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export default DeviceDiscoveryToast;
