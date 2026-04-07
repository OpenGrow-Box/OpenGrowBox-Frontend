import { useMemo, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import BottomBar from '../../Components/Navigation/BottomBar';
import DashboardTitle from '../../Components/Dashboard/DashboardTitle';
import { useHomeAssistant } from '../../Components/Context/HomeAssistantContext';
import { useGlobalState } from '../../Components/Context/GlobalContext';
import { Thermometer, Droplets, Gauge, Lightbulb, Fan, Power, Video, VideoOff } from 'lucide-react';
import RoomSelectCard from '../../Components/Cards/RoomSelectCard';
import LiteControlCard from '../../Components/Dashboard/LiteControlCard';
import formatLabel from '../../misc/formatLabel';
import formatRoomName from '../../misc/formatRoomName';

const LiteHome = () => {
  const { currentRoom, entities, connection, haBaseUrl, haToken: accessToken, haApiBaseUrl, areas } = useHomeAssistant();
  const { state } = useGlobalState();
  
  const [cameraImage, setCameraImage] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Get base URL for API calls - prefer haApiBaseUrl, then haBaseUrl, then fallback
  const baseUrl = import.meta.env.PROD 
    ? (haApiBaseUrl || window.location.origin) 
    : (import.meta.env.VITE_HA_HOST || haBaseUrl || '');

  // Sensor IDs - use currentRoom for API calls (same as PRO mode)
  const sensorIds = useMemo(() => {
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    return {
      vpd: `sensor.ogb_currentvpd_${room}`,
      temperature: `sensor.ogb_avgtemperature_${room}`,
      humidity: `sensor.ogb_avghumidity_${room}`
    };
  }, [currentRoom]);

  // Kamera aus dem aktuellen Raum finden - similar to CameraCard logic
  useEffect(() => {
    if (!entities || !currentRoom) return;
    
    // Find all available cameras first
    const allCameras = Object.entries(entities)
      .filter(([key, entity]) => {
        return key.startsWith('camera.') && 
               entity.state !== 'unavailable';
      })
      .map(([key, entity]) => ({
        entityId: key,
        friendlyName: entity.attributes?.friendly_name || key,
        entity: entity
      }));
    
    // Try to find cameras in current room using HASS devices
    // If no room-specific cameras found, use any available camera
    if (allCameras.length > 0) {
      setSelectedCamera(allCameras[0].entityId);
    }
  }, [entities, currentRoom]);

  // Kamera-Bild laden
  useEffect(() => {
    if (!selectedCamera || !accessToken || !baseUrl) {
      setCameraImage(null);
      return;
    }

    const fetchCameraImage = async () => {
      try {
        const cameraEntity = entities[selectedCamera];
        if (!cameraEntity) return;

        // Versuche zuerst entity_picture aus den Attributen
        const entityPicture = cameraEntity.attributes?.entity_picture;
        
        if (entityPicture) {
          const imageUrl = entityPicture.startsWith('http') 
            ? entityPicture 
            : `${baseUrl}${entityPicture}`;
          
          const headers = {};
          if (!entityPicture.includes('token=')) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          
          const response = await fetch(imageUrl, { headers });
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setCameraImage(url);
            setCameraError(false);
            return;
          }
        }
        
        // Fallback: API-Endpunkt
        const apiUrl = `${baseUrl}/api/camera_proxy/${selectedCamera}`;
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setCameraImage(url);
          setCameraError(false);
        } else {
          setCameraError(true);
        }
      } catch (error) {
        // console.error('Error fetching camera image:', error);
        setCameraError(true);
      }
    };

    fetchCameraImage();
    
    // Bild alle 5 Sekunden aktualisieren
    const interval = setInterval(fetchCameraImage, 5000);
    
    return () => {
      clearInterval(interval);
      if (cameraImage) {
        URL.revokeObjectURL(cameraImage);
      }
    };
  }, [selectedCamera, accessToken, baseUrl, entities]);

  const getSensorValue = (entityId, unit = '') => {
    if (!entities) return '--';
    const entity = entities[entityId];
    if (!entity) return '--';
    const value = entity.state;
    return value !== undefined && value !== null ? `${value}${unit}` : '--';
  };

  const devices = useMemo(() => {
    if (!entities || !currentRoom) return [];
    
    return Object.entries(entities)
      .filter(([key, entity]) => {
        const isRelevantType =
          key.startsWith('switch.') ||
          key.startsWith('light.') ||
          key.startsWith('fan.') ||
          key.startsWith('climate.') ||
          key.startsWith('humidifier.');
        
        const isHidden = entity.hidden === true || entity.attributes?.hidden === true;
        const isDisabled = entity.disabled === true || entity.attributes?.disabled === true;
        
        return isRelevantType && entity.state !== 'unavailable' && !isHidden && !isDisabled;
      })
      .map(([key, entity]) => {
        const domain = key.split('.')[0];
        const title = formatLabel(entity.attributes?.friendly_name || entity.entity_id);
        
        const isClimateOn = domain === 'climate' && entity.state !== 'off' && entity.state !== 'unavailable';
        const isHumidifierOn = domain === 'humidifier' && entity.state === 'on';
        const isOn = entity.state === 'on' || isClimateOn || isHumidifierOn;
        
        return {
          id: key,
          title,
          entity_id: entity.entity_id,
          state: isOn ? 'on' : 'off',
          domain,
          brightness: domain === 'light' && entity.attributes?.brightness !== undefined
            ? Math.round((entity.attributes.brightness / 255) * 100)
            : undefined,
          percentage: domain === 'fan' && entity.attributes?.percentage !== undefined
            ? entity.attributes.percentage
            : undefined,
        };
      })
      .slice(0, 8);
  }, [entities, currentRoom]);

  const toggleDevice = async (deviceId, currentState) => {
    if (!connection) return;
    const newState = currentState === 'on' ? 'off' : 'on';
    
    try {
      await sendCommand({
        type: 'call_service',
        domain: 'homeassistant',
        service: newState === 'on' ? 'turn_on' : 'turn_off',
        service_data: { entity_id: deviceId },
      });
    } catch (error) {
      // console.error('Error toggling device:', error);
    }
  };

  const setDeviceBrightness = async (deviceId, brightness) => {
    if (!connection) return;
    const brightnessValue = Math.round((brightness / 100) * 255);
    
    try {
      await sendCommand({
        type: 'call_service',
        domain: 'light',
        service: 'turn_on',
        service_data: { entity_id: deviceId, brightness: brightnessValue },
      });
    } catch (error) {
      // console.error('Error setting brightness:', error);
    }
  };

  const setDeviceSpeed = async (deviceId, percentage) => {
    if (!connection) return;
    
    try {
      await sendCommand({
        type: 'call_service',
        domain: 'fan',
        service: 'set_percentage',
        service_data: { entity_id: deviceId, percentage: parseInt(percentage) },
      });
    } catch (error) {
      // console.error('Error setting fan speed:', error);
    }
  };

  const getDeviceIcon = (domain) => {
    switch (domain) {
      case 'light': return <Lightbulb size={18} />;
      case 'fan': return <Fan size={18} />;
      default: return <Power size={18} />;
    }
  };

  const temp = getSensorValue(sensorIds.temperature, '°C');
  const hum = getSensorValue(sensorIds.humidity, '%');
  const vpd = getSensorValue(sensorIds.vpd, '');

  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="Open" secondText="Grow" thirdText="Box"/>
      </ContainerHeader>

      <Content>
        <LeftColumn>
          <EnvironmentSection>
            <EnvironmentHeader>
              <EnvironmentTitle>Environment</EnvironmentTitle>
              <SensorTags>
                <SensorTag $type="temp">
                  <Thermometer size={14} />
                  {temp}
                </SensorTag>
                <SensorTag $type="hum">
                  <Droplets size={14} />
                  {hum}
                </SensorTag>
                <SensorTag $type="vpd">
                  <Gauge size={14} />
                  {vpd}
                </SensorTag>
              </SensorTags>
            </EnvironmentHeader>

            <CameraContainer>
              {cameraImage && !cameraError ? (
                <CameraImage src={cameraImage} alt="Camera feed" />
              ) : (
                <CameraPlaceholder>
                  <VideoOff size={48} />
                  <span>No camera available</span>
                </CameraPlaceholder>
              )}
            </CameraContainer>
          </EnvironmentSection>

          <RoomSection>
            <RoomSelectCard title="Select Room" />
          </RoomSection>

          {devices.length > 0 && (
            <DevicesSection>
              <DeviceTitle>Quick Controls</DeviceTitle>
              <DeviceGrid>
                {devices.map(device => (
                  <DeviceCard key={device.id} $isOn={device.state === 'on'}>
                    <DeviceHeader>
                      <DeviceIcon $isOn={device.state === 'on'}>
                        {getDeviceIcon(device.domain)}
                      </DeviceIcon>
                      <DeviceInfo>
                        <DeviceName>{device.title}</DeviceName>
                        <DeviceStatus $isOn={device.state === 'on'}>
                          {device.state === 'on' ? 'ON' : 'OFF'}
                        </DeviceStatus>
                      </DeviceInfo>
                      <DeviceToggleBtn 
                        $isOn={device.state === 'on'}
                        onClick={() => toggleDevice(device.id, device.state)}
                      >
                        <Power size={16} />
                      </DeviceToggleBtn>
                    </DeviceHeader>
                    
                    {(device.domain === 'light' && device.brightness !== undefined) && (
                      <SliderContainer>
                        <Slider 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={device.brightness}
                          onChange={(e) => setDeviceBrightness(device.id, e.target.value)}
                        />
                        <SliderValue>{device.brightness}%</SliderValue>
                      </SliderContainer>
                    )}
                    
                    {(device.domain === 'fan' && device.percentage !== undefined) && (
                      <SliderContainer>
                        <Slider 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={device.percentage}
                          onChange={(e) => setDeviceSpeed(device.id, e.target.value)}
                        />
                        <SliderValue>{device.percentage}%</SliderValue>
                      </SliderContainer>
                    )}
                  </DeviceCard>
                ))}
              </DeviceGrid>
            </DevicesSection>
          )}
        </LeftColumn>

        <ControlSection>
          <LiteControlCard />
        </ControlSection>
      </Content>

      <BottomBar />
    </MainContainer>
  );
};

export default LiteHome;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  padding-bottom: 80px;
  background: var(--main-bg-color);
`;

const ContainerHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RoomSection = styled.div`
  margin-bottom: 0.5rem;
`;

const EnvironmentSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EnvironmentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const EnvironmentTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const SensorTags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SensorTag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  
  ${props => props.$type === 'temp' && `
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  `}
  
  ${props => props.$type === 'hum' && `
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  `}
  
  ${props => props.$type === 'vpd' && `
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  `}
`;

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--glass-bg-primary);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
`;

const CameraImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CameraPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--placeholder-text-color);
  font-size: 0.9rem;
  
  svg {
    opacity: 0.5;
  }
`;

const DevicesSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--main-shadow-art);
`;

const DeviceTitle = styled.h3`
  color: var(--main-text-color);
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
`;

const DeviceButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: ${props => props.$isOn ? 'var(--active-bg-color)' : 'var(--glass-bg-primary)'};
  border: 2px solid ${props => props.$isOn ? 'var(--primary-accent)' : 'var(--glass-border)'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 140px;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-accent);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const DeviceIcon = styled.div`
  color: ${props => props.$isOn ? 'var(--primary-accent)' : 'var(--placeholder-text-color)'};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const DeviceName = styled.div`
  font-size: 1rem;
  color: var(--main-text-color);
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  font-weight: 500;
  line-height: 1.3;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DeviceStatus = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.$isOn ? '#4ade80' : 'var(--placeholder-text-color)'};
  flex-shrink: 0;
`;

const DeviceCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: ${props => props.$isOn ? 'var(--active-bg-color)' : 'var(--glass-bg-primary)'};
  border: 2px solid ${props => props.$isOn ? 'var(--primary-accent)' : 'var(--glass-border)'};
  border-radius: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-accent);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DeviceInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

const DeviceToggleBtn = styled.button`
  background: ${props => props.$isOn ? 'var(--primary-accent)' : 'var(--glass-border)'};
  border: none;
  color: ${props => props.$isOn ? '#000' : 'var(--main-text-color)'};
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  min-width: 44px;
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:hover {
    transform: scale(1.05);
  }
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--glass-border);
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--glass-bg-secondary);
  appearance: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-accent);
    cursor: pointer;
  }
`;

const SliderValue = styled.span`
  font-size: 0.9rem;
  color: var(--main-text-color);
  text-align: center;
  font-weight: 600;
`;

const ControlSection = styled.div`
  margin-top: 0.5rem;
`;