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
  const roomLabel = formatRoomName(currentRoom || 'default');
  const activeDevices = devices.filter(device => device.state === 'on').length;

  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="Open" secondText="Grow" thirdText="Box"/>
      </ContainerHeader>

      <Content>
        <LeftColumn>
          <EnvironmentSection>
            <EnvironmentHeader>
              <SectionHeaderBlock>
                <SectionEyebrow>Lite Overview</SectionEyebrow>
                <EnvironmentTitle>{roomLabel}</EnvironmentTitle>
                <SectionDescription>Live camera and current climate in one focused room view.</SectionDescription>
              </SectionHeaderBlock>
              <HeaderMetaPill>{cameraImage && !cameraError ? 'Camera Online' : 'No Camera'}</HeaderMetaPill>
            </EnvironmentHeader>

            <CameraContainer>
              {cameraImage && !cameraError ? (
                <>
                  <CameraImage src={cameraImage} alt="Camera feed" />
                  <CameraTopBar>
                    <CameraBadge>
                      <Video size={14} />
                      Live View
                    </CameraBadge>
                    <CameraRoomBadge>{roomLabel}</CameraRoomBadge>
                  </CameraTopBar>
                </>
              ) : (
                <CameraPlaceholder>
                  <CameraPlaceholderIcon>
                    <VideoOff size={48} />
                  </CameraPlaceholderIcon>
                  <CameraPlaceholderTitle>No camera available</CameraPlaceholderTitle>
                  <CameraPlaceholderText>Live climate values stay available for this room.</CameraPlaceholderText>
                </CameraPlaceholder>
              )}
              <CameraOverlay>
                <CameraMetricsRow>
                  <CameraMetricCard $type="temp">
                    <CameraMetricLabel $type="temp" aria-label="Temperature">
                      <Thermometer size={13} />
                    </CameraMetricLabel>
                    <CameraMetricValue>{temp}</CameraMetricValue>
                  </CameraMetricCard>
                  <CameraMetricCard $type="hum">
                    <CameraMetricLabel $type="hum" aria-label="Humidity">
                      <Droplets size={13} />
                    </CameraMetricLabel>
                    <CameraMetricValue>{hum}</CameraMetricValue>
                  </CameraMetricCard>
                  <CameraMetricCard $type="vpd">
                    <CameraMetricLabel $type="vpd" aria-label="VPD">
                      <Gauge size={13} />
                    </CameraMetricLabel>
                    <CameraMetricValue>{vpd || '--'}</CameraMetricValue>
                  </CameraMetricCard>
                </CameraMetricsRow>
              </CameraOverlay>
            </CameraContainer>
          </EnvironmentSection>

          <RoomSection>
            <LiteSectionCard>
              <SectionTopRow>
                <SectionHeaderBlock>
                  <SectionEyebrow>Room</SectionEyebrow>
                  <SectionTitleText>Select Grow Room</SectionTitleText>
                  <SectionDescription>Switch quickly between rooms to update sensors, devices and control targets.</SectionDescription>
                </SectionHeaderBlock>
                <HeaderMetaPill>{roomLabel}</HeaderMetaPill>
              </SectionTopRow>
              <RoomCardWrap>
                <RoomSelectCard title="Select Room" />
              </RoomCardWrap>
            </LiteSectionCard>
          </RoomSection>

          {devices.length > 0 && (
            <DevicesSection>
              <SectionTopRow>
                <SectionHeaderBlock>
                  <SectionEyebrow>Devices</SectionEyebrow>
                  <DeviceTitle>Quick Controls</DeviceTitle>
                  <SectionDescription>Direct access to your most relevant room devices with instant status feedback.</SectionDescription>
                </SectionHeaderBlock>
                <HeaderStatsWrap>
                  <StatsPill>{devices.length} Devices</StatsPill>
                  <StatsPill $active>{activeDevices} Active</StatsPill>
                </HeaderStatsWrap>
              </SectionTopRow>
              <DeviceGrid>
                {devices.map(device => (
                  <DeviceCard key={device.id} $isOn={device.state === 'on'}>
                    <DeviceHeader>
                      <DeviceIconWrap>
                        <DeviceIcon $isOn={device.state === 'on'}>
                          {getDeviceIcon(device.domain)}
                        </DeviceIcon>
                        <DeviceDomainBadge>{device.domain}</DeviceDomainBadge>
                      </DeviceIconWrap>
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
                        <SliderHeader>
                          <SliderLabel>Brightness</SliderLabel>
                          <SliderValue>{device.brightness}%</SliderValue>
                        </SliderHeader>
                        <Slider 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={device.brightness}
                          onChange={(e) => setDeviceBrightness(device.id, e.target.value)}
                        />
                      </SliderContainer>
                    )}
                    
                    {(device.domain === 'fan' && device.percentage !== undefined) && (
                      <SliderContainer>
                        <SliderHeader>
                          <SliderLabel>Speed</SliderLabel>
                          <SliderValue>{device.percentage}%</SliderValue>
                        </SliderHeader>
                        <Slider 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={device.percentage}
                          onChange={(e) => setDeviceSpeed(device.id, e.target.value)}
                        />
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

const LiteSectionCard = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--main-shadow-art);
  border: 1px solid var(--glass-border);
`;

const EnvironmentSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  border: 1px solid var(--glass-border);
  overflow: hidden;
`;

const EnvironmentHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const SectionTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const SectionHeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const SectionEyebrow = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-accent);
`;

const SectionDescription = styled.p`
  margin: 0;
  color: var(--placeholder-text-color);
  font-size: 0.88rem;
  line-height: 1.45;
  max-width: 46ch;
`;

const HeaderMetaPill = styled.div`
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  color: var(--main-text-color);
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
`;

const HeaderStatsWrap = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StatsPill = styled.div`
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: ${props => props.$active ? 'rgba(74, 222, 128, 0.12)' : 'var(--glass-bg-primary)'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 222, 128, 0.22)' : 'var(--glass-border)'};
  color: ${props => props.$active ? '#86efac' : 'var(--main-text-color)'};
  font-size: 0.78rem;
  font-weight: 700;
`;

const EnvironmentTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
`;

const SectionTitleText = styled.h3`
  color: var(--main-text-color);
  font-size: 1.05rem;
  font-weight: 700;
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
  background: linear-gradient(180deg, rgba(18, 24, 30, 0.96), rgba(10, 14, 18, 1));
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  min-height: 320px;

  @media (max-width: 640px) {
    min-height: 280px;
  }
`;

const CameraOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.1rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(7, 10, 14, 0.82) 68%, rgba(7, 10, 14, 0.96) 100%);
`;

const CameraTopBar = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  z-index: 2;
`;

const CameraRoomBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(15, 15, 15, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
`;

const CameraBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 15, 15, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
`;

const CameraMetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
  width: min(380px, 100%);
  margin: 0 auto;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    width: 100%;
  }
`;

const CameraMetricCard = styled.div`
  padding: 0.52rem 0.58rem;
  border-radius: 12px;
  background: rgba(10, 14, 18, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;

  ${props => props.$type === 'temp' && `
    box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.18);
    background: linear-gradient(180deg, rgba(16, 26, 18, 0.88), rgba(10, 14, 18, 0.78));
  `}

  ${props => props.$type === 'hum' && `
    box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18);
    background: linear-gradient(180deg, rgba(12, 22, 34, 0.88), rgba(10, 14, 18, 0.78));
  `}

  ${props => props.$type === 'vpd' && `
    box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.2);
    background: linear-gradient(180deg, rgba(32, 24, 8, 0.9), rgba(10, 14, 18, 0.78));
  `}
`;

const CameraMetricLabel = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: ${props => {
    if (props.$type === 'temp') return '#86efac';
    if (props.$type === 'hum') return '#7dd3fc';
    if (props.$type === 'vpd') return '#fcd34d';
    return 'rgba(255, 255, 255, 0.76)';
  }};

  svg {
    display: block;
  }
`;

const CameraMetricValue = styled.div`
  color: #fff;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
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
  padding: 1.5rem;
  text-align: center;
`;

const CameraPlaceholderIcon = styled.div`
  opacity: 0.5;
`;

const CameraPlaceholderTitle = styled.div`
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 700;
`;

const CameraPlaceholderText = styled.div`
  max-width: 24rem;
  color: var(--placeholder-text-color);
  font-size: 0.85rem;
  line-height: 1.4;
`;

const DevicesSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--main-shadow-art);
  border: 1px solid var(--glass-border);
`;

const DeviceTitle = styled.h3`
  color: var(--main-text-color);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
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
  gap: 0.9rem;
  padding: 1.25rem;
  background: ${props => props.$isOn
    ? 'linear-gradient(180deg, rgba(74, 222, 128, 0.10), var(--glass-bg-primary))'
    : 'linear-gradient(180deg, var(--glass-bg-secondary), var(--glass-bg-primary))'};
  border: 1px solid ${props => props.$isOn ? 'rgba(74, 222, 128, 0.35)' : 'var(--glass-border)'};
  border-radius: 18px;
  transition: all 0.2s ease;
   
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-accent);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const DeviceIconWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
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
  border: 1px solid ${props => props.$isOn ? 'rgba(74, 222, 128, 0.22)' : 'transparent'};
  color: ${props => props.$isOn ? '#000' : 'var(--main-text-color)'};
  padding: 0.75rem;
  border-radius: 12px;
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
    border-color: var(--primary-accent);
  }
`;

const DeviceDomainBadge = styled.div`
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  color: var(--placeholder-text-color);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--glass-border);
`;

const SliderHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const SliderLabel = styled.span`
  font-size: 0.8rem;
  color: var(--placeholder-text-color);
  font-weight: 600;
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
  font-size: 0.85rem;
  color: var(--main-text-color);
  text-align: center;
  font-weight: 700;
`;

const ControlSection = styled.div`
  margin-top: 0.5rem;
`;

const RoomCardWrap = styled.div`
  border-radius: 16px;
  overflow: visible;
  position: relative;
  z-index: 6;
`;
