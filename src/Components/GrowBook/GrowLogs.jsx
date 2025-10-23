import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
const LogItem = ({ room, date, info }) => {
  // Parse the info if it's a string
  const parsedInfo = typeof info === 'string' ? JSON.parse(info) : info;
  
  // Determine log type for styling
    const getLogType = (data) => {
      // Wenn data ein Array ist → erstes Element nehmen
      const entry = Array.isArray(data) ? data[0] : data;

      // msg sicher extrahieren
      const msg = entry?.message?.toLowerCase() || '';

      //console.log(data, msg);

      if (entry.controllerType === "PID") return 'pid-controller';
      if (entry.action) return 'action';
      if (msg.includes('vpd')) return 'vpd';
      if (entry.NightVPDHold !== undefined) return 'night-vpd';
      if (msg.includes('humidity')) return 'humidity';
      if (msg.includes('temperature')) return 'temperature';
      if (entry.VPD !== undefined) return 'sensor';

      if (entry.Device || entry.Action || entry.Cycle !== undefined) return 'device';
      
      return 'default';
    };


  const logType = getLogType(parsedInfo);

  function calculateUptimeFromTimestamp(timestampMs) {
    const now = Date.now(); // aktuelle Zeit in Millisekunden
    const uptimeSeconds = Math.floor((now - timestampMs) / 1000); // Differenz in Sekunden
    return uptimeSeconds >= 0 ? uptimeSeconds : 0; // negative Werte abfangen
  }

  // Format sensor data nicely
  const formatSensorData = (data) => {
    if (data.VPD !== undefined) {
      return (
        <SensorGrid>
          <SensorItem>
            <SensorLabel>VPD</SensorLabel>
            <SensorValue>{data.VPD}</SensorValue>
          </SensorItem>
          <SensorItem>
            <SensorLabel>Temp</SensorLabel>
            <SensorValue>{data.AvgTemp}°C</SensorValue>
          </SensorItem>
          <SensorItem>
            <SensorLabel>Humidity</SensorLabel>
            <SensorValue>{data.AvgHum}%</SensorValue>
          </SensorItem>
          <SensorItem>
            <SensorLabel>Dew Point</SensorLabel>
            <SensorValue>{data.AvgDew}°C</SensorValue>
          </SensorItem>
        </SensorGrid>
      );
    }
    return null;
  };

  // Format device/pump actions
  const formatDeviceAction = (data) => {
    if (data.Device || data.Action) {
      const device = data.Device || 'Device';
      const action = data.Action || 'unknown';
      const cycle = data.Cycle;
      const Dimmable = data.Dimmable;
      const voltage = data.Voltage;
      const sunrise = data.SunRise;
      const sunset = data.SunSet;
      const message = data.Message || '';
      
      const isLightDevice = device.toLowerCase().includes('light') || device.toLowerCase().includes('led');
      
      return (
        <DeviceActionContainer>
          <DeviceHeader>
            <DeviceIcon device={device} isLight={isLightDevice}>
              {getDeviceIcon(device)}
            </DeviceIcon>
            <DeviceInfo>
              <DeviceName>{device}</DeviceName>
              {message && <DeviceMessage>{message}</DeviceMessage>}
            </DeviceInfo>
          </DeviceHeader>
          
          <DeviceDetails>
            <ActionBadge action={action}>{action}</ActionBadge>
            
            {/* Power Status */}
            {cycle !== undefined && (
              <StatusBadge cycle={cycle} isLight={isLightDevice}>
                <StatusIcon>{cycle === true ? '🟢' : '🔴'}</StatusIcon>
                <StatusLabel>Pump Cycle</StatusLabel>
                <StatusValue>{cycle ? 'ON' : 'OFF'}</StatusValue>
              </StatusBadge>
            )}
            
            {/* Light-specific controls */}
            {isLightDevice && (
              <LightControlsContainer>
                {/* Dimming Control */}
                {Dimmable !== undefined && (
                  <DimmingControl>
                    <DimmingHeader>
                      <DimmingLabel>Dimmable</DimmingLabel>
                      {Dimmable == true ?<DimmingIcon>🌝</DimmingIcon>:<DimmingIcon>🌚</DimmingIcon> }
                      

                    </DimmingHeader>
                    <DimmingValue>{Dimmable}</DimmingValue>
                    <DimmingBar>
                      <DimmingFill percentage={Dimmable} />
                    </DimmingBar>
                  </DimmingControl>
                )}
                
                {/* Voltage Display */}
                {voltage !== undefined && (
                  <VoltageDisplay>
                    <VoltageIcon>⚡</VoltageIcon>
                    <VoltageInfo>
                      <VoltageLabel>Voltage</VoltageLabel>
                      <VoltageValue>{Dimmable ? `${voltage}%` : '0%'}</VoltageValue>
                    </VoltageInfo>
                  </VoltageDisplay>
                )}
                
                {/* Sun Schedule */}
                <SunScheduleContainer>
                  <SunScheduleItem active={sunrise}>
                    <SunIcon>🌅</SunIcon>
                    <SunLabel>Sun Rise</SunLabel>
                    <SunStatus active={sunrise}>
                      {sunrise ? 'Aktiv' : 'Inaktiv'}
                    </SunStatus>
                  </SunScheduleItem>
                  
                  <SunScheduleItem active={sunset}>
                    <SunIcon>🌇</SunIcon>
                    <SunLabel>Sun Set</SunLabel>
                    <SunStatus active={sunset}>
                      {sunset ? 'Aktiv' : 'Inaktiv'}
                    </SunStatus>
                  </SunScheduleItem>
                </SunScheduleContainer>
              </LightControlsContainer>
            )}
            
            {/* Non-light devices - original layout */}
            {!isLightDevice && Dimmable !== undefined && (
              <>
                <DataBadge>
                  <CycleLabel>Dimmable</CycleLabel>
                  <CycleValue>{Dimmable}</CycleValue>
                </DataBadge>
                <DataBadge>
                  <CycleLabel>Voltage</CycleLabel>
                  <CycleValue>{Dimmable ? `${voltage}%` : `0%`}</CycleValue>
                </DataBadge>
              </>
            )}
          </DeviceDetails>
        </DeviceActionContainer>
      );
    }
    return null;
  };

  // Format VPD Night Hold Actions actions
  const formatNightVPDData = (data) => {
    if (data.NightVPDHold !== undefined) {
      const status = data.NightVPDHold || '';
      const roomName = data.Name || 'Unknown Room';
      
      return (
        <NightVPDContainer>
          <NightVPDHeader>
            <NightVPDIcon>🌙</NightVPDIcon>
            <NightVPDInfo>
              <NightVPDTitle>Night VPD Hold</NightVPDTitle>
              <NightVPDRoom>{roomName}</NightVPDRoom>
            </NightVPDInfo>
          </NightVPDHeader>
          
          <NightVPDStatus status={status}>
            <StatusIndicator status={status}>
              {status === 'Active' ? '🟢' : status === 'NotActive Ignoring-VPD' ? '🟡' : '🔴'}
            </StatusIndicator>
            <StatusText status={status}>
              {status === 'Active' ? 'Aktiv' : 
              status === 'NotActive Ignoring-VPD' ? 'Inactiv - Ignoring VPD' : 
              status}
            </StatusText>
          </NightVPDStatus>
        </NightVPDContainer>
      );
    }
    return null;
  };

  // Get device icon based on device type
  const getDeviceIcon = (device) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('pump') || deviceLower.includes('water')) return '💧';
    if (deviceLower.includes('fan') || deviceLower.includes('venti')) return '𖣘';
    if (deviceLower.includes('exhaust') || deviceLower.includes('ventil')) return '🌪️';
    if (deviceLower.includes('inhaust') || deviceLower.includes('ventil')) return '🌪️';
    if (deviceLower.includes('light') || deviceLower.includes('led')) return '💡';
    if (deviceLower.includes('heat') || deviceLower.includes('warm')) return '🔥';
    if (deviceLower.includes('cool') || deviceLower.includes('ac')) return '❄️';
    if (deviceLower.includes('dehumidi') || deviceLower.includes('warm')) return '🏜️';
    if (deviceLower.includes('humidi') || deviceLower.includes('ac')) return '🌧️';
    if (deviceLower.includes('climate') || deviceLower.includes('ac')) return '🌦️';
    return '⚙️';
  };

  // Format action data - handle both single actions and arrays of actions
  const formatActionData = (data) => {
    // Handle new PID controller structure with actionData array
   
    if (data?.controlCommands && Array.isArray(data?.controlCommands)) {
      
      return (
        <PIDControllerContainer>
          <PIDHeader>
            <PIDTitle>
              <PIDIcon>🎛️</PIDIcon>
              <PIDInfo>
                <PIDControllerType>{data.controllerType} Controller</PIDControllerType>
                <PIDStatus status={data.status}>
                  <StatusDot status={data.status} />
                  {data.status} - {data.message}
                </PIDStatus>
              </PIDInfo>
            </PIDTitle>
            <PIDMetadata>
            <PIDUptime>
              Uptime: {calculateUptimeFromTimestamp(data.pidStates.vpd.adaptiveHistory[0].time)}s
            </PIDUptime>
              <PIDActionCount>{data.controlCommands.length} Actions</PIDActionCount>
            </PIDMetadata>
          </PIDHeader>
          
          <PIDActionGrid>
            {data.controlCommands.map((action, index) => (
              <PIDActionItem key={index} priority={action.priority}>
                <PIDActionHeader>
                  <DeviceIcon device={action.device}>
                    {getDeviceIcon(action.device)}
                  </DeviceIcon>
                  <PIDActionInfo>
                    <PIDDeviceName>{action.device}</PIDDeviceName>
                    <PIDActionBadge action={action.action}>{action.action}</PIDActionBadge>
                  </PIDActionInfo>
                  <PIDPriorityBadge priority={action.priority}>
                    {action.priority}
                  </PIDPriorityBadge>
                </PIDActionHeader>
                
                <PIDActionDetails>
                  <PIDReason>{action.reason}</PIDReason>
                  <PIDTimestamp>
                    {formatDateTime(action.timestamp)}
                  </PIDTimestamp>
                </PIDActionDetails>
              </PIDActionItem>
            ))}
          </PIDActionGrid>
        </PIDControllerContainer>
      );
    }

    // Check if data is an array (multiple actions) - existing logic
    if (Array.isArray(data)) {
      const actions = data.filter(item => item.action);
      if (actions.length > 0) {
        return (
          <MultiActionContainer>
            <ActionHeader>
              <ActionTitle>{data[0]?.message || 'Actions'}</ActionTitle>
              <ActionCount>{actions.length} Actions</ActionCount>
            </ActionHeader>
            <ActionGrid>
              {actions.map((action, index) => (
              <ActionItem key={index}>
              <ActionBadge action={action.action}>
                {action.action}
                <ActionPriority priority={action.priority}>Prio: {action.priority}</ActionPriority>
              </ActionBadge>

                <ActionCapability>{action.capability}</ActionCapability>
                <DeviceIcon device={action.capability}>
                  {getDeviceIcon(action.capability)}
                </DeviceIcon>
           
              </ActionItem>

              ))}
            </ActionGrid>
          </MultiActionContainer>
        );
      }
    }
    
    // Single action - existing logic
    if (data.action) {
      return (
        <SingleActionContainer>
          <ActionBadge action={data.action}>{data.action}</ActionBadge>
          <ActionDetail>{data.capability}</ActionDetail>
        </SingleActionContainer>
      );
    }
    return null;
  };

  // Format deviation data
  const formatDeviationData = (data) => {
    if (data.tempDeviation !== undefined || data.humDeviation !== undefined) {
      return (
        <DeviationContainer>
          {data.tempDeviation !== undefined && (
            <DeviationItem deviation={data.tempDeviation}>
              <DeviationLabel>Temp Deviation</DeviationLabel>
              <DeviationValue>{data.tempDeviation > 0 ? '+' : ''}{data.tempDeviation}</DeviationValue>
            </DeviationItem>
          )}
          {data.humDeviation !== undefined && (
            <DeviationItem deviation={data.humDeviation}>
              <DeviationLabel>Hum Deviation</DeviationLabel>
              <DeviationValue>{data.humDeviation > 0 ? '+' : ''}{data.humDeviation}</DeviationValue>
            </DeviationItem>
          )}
        </DeviationContainer>
      );
    }
    return null;
  };

  const sensorData = formatSensorData(parsedInfo);
  const actionData = formatActionData(parsedInfo);
  const deviceData = formatDeviceAction(parsedInfo);
  const deviationData = formatDeviationData(parsedInfo);
  const nightVPDData = formatNightVPDData(parsedInfo);
  
  return (
    <LogItemContainer logType={logType}>
      <LogHeader logType={logType}>
        <RoomInfo>
          <RoomName>{room}</RoomName>
          {parsedInfo.message && <MessageText>{parsedInfo.message}</MessageText>}
        </RoomInfo>
        <TimeStamp>{date}</TimeStamp>
      </LogHeader>
      <LogContent>
        {sensorData && sensorData}
        {actionData && actionData}
        {deviceData && deviceData}
        {nightVPDData && nightVPDData}
        {deviationData && deviationData}
        {!sensorData && !actionData && !deviceData && !deviationData && !nightVPDData && (
          <FallbackContent>
            <pre>{JSON.stringify(parsedInfo, null, 2)}</pre>
          </FallbackContent>
        )}
      </LogContent>
    </LogItemContainer>
  );
};

const GrowLogs = () => {
  const [logs, setLogs] = useState([]);
  const { connection } = useHomeAssistant();

  useEffect(() => {
    if (!connection) return;

    const handleNewEvent = (event) => {
      // Debug: Log the entire event structure
       //console.log('Full event:', event);
       //console.log('Event data:', event.data);
      
      // Try multiple ways to find the room name
      const findRoomName = (data) => {
        // Direct access
        if (data.Name) return data.Name;
        if (data.name) return data.name;
        if (data.room) return data.room;
        if (data.Room) return data.Room;
        
        // Search in arrays and nested objects
        const searchInStructure = (obj, depth = 0) => {
          if (depth > 5) return null; // Prevent infinite recursion
          
          // If it's an array, search each element
          if (Array.isArray(obj)) {
            for (const item of obj) {
              if (typeof item === 'object' && item !== null) {
                // Check direct properties first
                if (item.Name) return item.Name;
                if (item.name) return item.name;
                if (item.room) return item.room;
                if (item.Room) return item.Room;
                
                // Recursively search
                const result = searchInStructure(item, depth + 1);
                if (result) return result;
              }
            }
          }
          
          // If it's an object, search properties
          if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
              // Check if this key is what we're looking for
              if (key === 'Name' || key === 'name' || key === 'room' || key === 'Room') {
                return value;
              }
              
              // Recursively search nested structures
              if (typeof value === 'object' && value !== null) {
                const result = searchInStructure(value, depth + 1);
                if (result) return result;
              }
            }
          }
          
          return null;
        };
        
        return searchInStructure(data) || 'Missing Devices for Action';
      };

      const roomName = findRoomName(event.data);
      
      // Enhanced debug logging
      if (roomName === 'Unkown Data or Missing Devices') {
        console.warn('Could not find room name in event:', {
          eventData: event.data,
          dataType: typeof event.data,
          isArray: Array.isArray(event.data),
          keys: typeof event.data === 'object' ? Object.keys(event.data) : 'Not an object'
        });
      }
      
      const newLog = {
        room: roomName,
        date: formatDateTime(event.time_fired),
        info: JSON.stringify(event.data)
      };
      setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 199)]); // Keep only last 200 logs for performance
    };

    const subscribe = async () => {
      const unsubscribe = await connection.subscribeEvents(
        handleNewEvent,
        'LogForClient'
      );
      return unsubscribe;
    };

    const unsubscribePromise = subscribe();

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };
  }, [connection]);

  const displayedLogs = logs.slice(0, 50); // Show only 50 logs for better performance

  return (
    <LogContainer>
      <GrowLogContainer>
        {displayedLogs.length === 0 ? (
          <NoLogsMessage>
            <LoadingDots>Waiting for Logs...</LoadingDots>
          </NoLogsMessage>
        ) : (
          displayedLogs.map((log, index) => (
            <LogItem
              key={`${log.room}-${log.date}-${index}`}
              room={log.room || ''}
              date={log.date}
              info={log.info}
            />
          ))
        )}
      </GrowLogContainer>
    </LogContainer>
  );
};

export default GrowLogs;

// Styled Components

const LogContainer = styled.div`
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const GrowLogContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  
  @media (max-width: 1200px) {
    width: 350px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    position: relative;
    height: 100%;
    max-height: none;
  }
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--primary-accent);
    border-radius: 4px;
    
    &:hover {
      background: var(--primary-accent-hover, var(--primary-accent));
    }
  }
`;

const LogItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: ${props => {
    switch(props.logType) {
      case 'pid-controller': return 'linear-gradient(135deg, rgba(116, 75, 162, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%)'; // New
      case 'sensor': return 'linear-gradient(135deg, rgba(34, 193, 195, 0.1) 0%, rgba(253, 187, 45, 0.1) 100%)';
      case 'action': return 'linear-gradient(135deg, rgba(255, 94, 77, 0.1) 0%, rgba(255, 154, 0, 0.1) 100%)';
      case 'device': return 'linear-gradient(135deg, rgba(116, 75, 162, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%)';
      case 'vpd': return 'linear-gradient(135deg, rgba(131, 58, 180, 0.1) 0%, rgba(253, 29, 29, 0.1) 100%)';
      case 'night-vpd': return 'linear-gradient(135deg, rgba(44, 62, 80, 0.1) 0%, rgba(52, 152, 219, 0.1) 100%)'; 
      case 'humidity': return 'linear-gradient(135deg, rgba(45, 134, 255, 0.1) 0%, rgba(45, 253, 159, 0.1) 100%)';
      case 'temperature': return 'linear-gradient(135deg, rgba(255, 94, 77, 0.1) 0%, rgba(255, 203, 95, 0.1) 100%)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  min-height: fit-content;
  flex-shrink: 0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--primary-accent);
  }
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const RoomName = styled.div`
  color: var(--primary-accent);
  font-size: 1rem;
  font-weight: 600;
`;

const MessageText = styled.div`
  color: var(--main-text-color);
  font-size: 0.85rem;
  opacity: 0.8;
`;

const TimeStamp = styled.div`
  color: var(--second-text-color);
  font-size: 0.75rem;
  white-space: nowrap;
  margin-left: 1rem;
`;

const LogContent = styled.div`
  padding: 1rem 1.25rem 1.25rem;
`;

const DeviceActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DeviceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DeviceIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => {
    const device = props.device?.toLowerCase() || '';
    if (device.includes('light') || device.includes('led')) {
      return props.isLight 
        ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)'
        : 'linear-gradient(135deg, #696969 0%, #404040 100%)';
    }
    // ... rest of your existing device backgrounds
    if (device.includes('pump') || device.includes('water')) return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
    if (device.includes('vent'))  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (device.includes('exhaust'))  return 'linear-gradient(135deg, #aa7eea 0%, #764ba2 100%)';
    if (device.includes('inhaust'))  return 'linear-gradient(135deg, #aa7eea 0%, #777ba2 100%)';
    if (device.includes('heater'))  return 'linear-gradient(135deg, #fffeea 0%, #777ba2 100%)';
    if (device.includes('cooler'))  return 'linear-gradient(135deg, #00ffea 0%, #777ba2 100%)';
    if (device.includes('dehumidifer'))  return 'linear-gradient(135deg, #fffeea 0%, #777bff 100%)';
    if (device.includes('humidifer'))  return 'linear-gradient(135deg, #00ffea 0%, #777fff 100%)';


    // ... etc
    return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: ${props => props.isLight 
    ? '0 4px 15px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.1)'
    : '0 4px 15px rgba(0, 0, 0, 0.1)'
  };
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.isLight 
      ? '0 6px 20px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.2)'
      : '0 6px 20px rgba(0, 0, 0, 0.15)'
    };
  }
`;

const DeviceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const DeviceName = styled.div`
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: capitalize;
`;

const DeviceMessage = styled.div`
  color: var(--second-text-color);
  font-size: 0.85rem;
  opacity: 0.8;
`;

const DeviceDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DataBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const CycleLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const CycleValue = styled.div`
  color: ${props => props.children === 'ON' ? '#4ecdc4' : '#ff6b6b'};
  font-size: 0.9rem;
  font-weight: 600;
`;

const SensorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const SensorItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SensorLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const SensorValue = styled.div`
  color: var(--primary-accent);
  font-size: 1.1rem;
  font-weight: 600;
`;

const MultiActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ActionTitle = styled.div`
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 600;
`;

const ActionCount = styled.div`
  color: var(--primary-accent);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const SingleActionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionBadge = styled.div`
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: ${props => {
    switch(props.action?.toLowerCase()) {
      case 'reduce': 
        return 'linear-gradient(135deg, #00ff6b 0%, #00aaff 100%)'; // Grün → Blau
      case 'increase': 
        return 'linear-gradient(135deg, #ff7f00 0%, #ffff00 50%)'; // Orange → Rot
      case 'maintain': 
        return 'linear-gradient(135deg, #45b7d1 0%, #96c93d 100%)';
      case 'start':
        return 'linear-gradient(135deg, #96c93d 0%, #02aab0 100%)';
      case 'stop':
        return 'linear-gradient(135deg, #ff8a80 0%, #ff5722 100%)';
      case 'on':
        return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
      case 'off':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
      default: 
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

const ActionDetail = styled.div`
  color: var(--main-text-color);
  font-size: 0.9rem;
  opacity: 0.8;
`;

const ActionCapability = styled.div`
  color: var(--second-text-color);
  font-size: 0.85rem;
  flex: 1;
`;

const DeviationContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DeviationItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: ${props => 
    props.deviation > 0 
      ? 'rgba(255, 107, 107, 0.1)' 
      : props.deviation < 0 
        ? 'rgba(74, 144, 226, 0.1)'
        : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => 
    props.deviation > 0 
      ? 'rgba(255, 107, 107, 0.3)' 
      : props.deviation < 0 
        ? 'rgba(74, 144, 226, 0.3)'
        : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 8px;
  min-width: 120px;
`;

const priorityColors = {
  high: "red",
  medium: "orange",
  low: "green",
};

const ActionPriority = styled.div`
  font-size: 0.6rem;
  color: ${({ priority }) => priorityColors[priority] || "orange"};
`;



const DeviationLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const DeviationValue = styled.div`
  color: ${props => 
    props.children?.toString().includes('+') 
      ? '#ff6b6b' 
      : props.children?.toString().includes('-')
        ? '#4a90e2'
        : 'var(--primary-accent)'
  };
  font-size: 1.1rem;
  font-weight: 600;
`;

const FallbackContent = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--main-text-color);
  overflow-x: auto;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
  }
`;

const NoLogsMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--second-text-color);
  font-size: 1.1rem;
`;

const LoadingDots = styled.div`
  &::after {
    content: '';
    animation: dots 2s infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: ''; }
    25%, 45% { content: '.'; }
    50%, 70% { content: '..'; }
    75%, 95% { content: '...'; }
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.isLight 
    ? (props.cycle 
      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
      : 'linear-gradient(135deg, rgba(105, 105, 105, 0.2) 0%, rgba(64, 64, 64, 0.2) 100%)')
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.isLight 
    ? (props.cycle ? 'rgba(255, 215, 0, 0.3)' : 'rgba(105, 105, 105, 0.3)')
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatusIcon = styled.div`
  font-size: 1rem;
`;

const StatusLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusValue = styled.div`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
`;

const LightControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 165, 0, 0.05) 100%);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 0.5rem;
`;

const DimmingControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DimmingHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DimmingIcon = styled.div`
  font-size: 1.2rem;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
`;

const DimmingLabel = styled.div`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
`;

const DimmingValue = styled.div`
  color: var(--primary-accent);
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
`;

const DimmingBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const DimmingFill = styled.div`
  width: ${props => props.percentage}%;
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(255, 215, 0, 0.8) 0%, 
    rgba(255, 165, 0, 0.9) 50%, 
    rgba(255, 140, 0, 1) 100%
  );
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 3px;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 0 4px 4px 0;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
  }
`;

const VoltageDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const VoltageIcon = styled.div`
  font-size: 1.1rem;
  filter: drop-shadow(0 0 3px rgba(255, 255, 0, 0.6));
`;

const VoltageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const VoltageLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const VoltageValue = styled.div`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
`;

const SunScheduleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const SunScheduleItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, rgba(255, 140, 0, 0.2) 0%, rgba(255, 69, 0, 0.2) 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.active 
    ? 'rgba(255, 140, 0, 0.3)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const SunIcon = styled.div`
  font-size: 1.5rem;
  filter: ${props => props.children?.includes('🌅') 
    ? 'drop-shadow(0 0 6px rgba(255, 140, 0, 0.6))'
    : 'drop-shadow(0 0 6px rgba(255, 69, 0, 0.6))'
  };
`;

const SunLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
`;

const SunStatus = styled.div`
  color: ${props => props.active ? '#ff8c00' : 'var(--second-text-color)'};
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
`;

const NightVPDContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NightVPDHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NightVPDIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  }
`;

const NightVPDInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const NightVPDTitle = styled.div`
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

const NightVPDRoom = styled.div`
  color: var(--second-text-color);
  font-size: 0.85rem;
  opacity: 0.8;
`;

const NightVPDStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => {
    switch(props.status) {
      case 'Active': 
        return 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.15) 100%)';
      case 'NotActive Ignoring-VPD': 
        return 'linear-gradient(135deg, rgba(241, 196, 15, 0.15) 0%, rgba(243, 156, 18, 0.15) 100%)';
      default: 
        return 'linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(192, 57, 43, 0.15) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.status) {
      case 'Active': return 'rgba(46, 204, 113, 0.3)';
      case 'NotActive Ignoring-VPD': return 'rgba(241, 196, 15, 0.3)';
      default: return 'rgba(231, 76, 60, 0.3)';
    }
  }};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatusIndicator = styled.div`
  font-size: 1.2rem;
  filter: drop-shadow(0 0 4px ${props => {
    switch(props.status) {
      case 'Active': return 'rgba(46, 204, 113, 0.6)';
      case 'NotActive Ignoring-VPD': return 'rgba(241, 196, 15, 0.6)';
      default: return 'rgba(231, 76, 60, 0.6)';
    }
  }});
`;

const StatusText = styled.div`
  color: ${props => {
    switch(props.status) {
      case 'Active': return '#2ecc71';
      case 'NotActive Ignoring-VPD': return '#f1c40f';
      default: return '#e74c3c';
    }
  }};
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
`;

const PIDControllerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(116, 75, 162, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%);
  border: 1px solid rgba(116, 75, 162, 0.3);
  border-radius: 12px;
  padding: 1rem;
`;

const PIDHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const PIDTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PIDIcon = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 15px rgba(116, 75, 162, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(116, 75, 162, 0.4);
  }
`;

const PIDInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PIDControllerType = styled.div`
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PIDStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => {
    switch(props.status) {
      case 'success': return '#2ecc71';
      case 'warning': return '#f1c40f';
      case 'error': return '#e74c3c';
      default: return 'var(--second-text-color)';
    }
  }};
  font-size: 0.85rem;
  font-weight: 500;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch(props.status) {
      case 'success': return '#2ecc71';
      case 'warning': return '#f1c40f';
      case 'error': return '#e74c3c';
      default: return 'var(--second-text-color)';
    }
  }};
  box-shadow: 0 0 8px ${props => {
    switch(props.status) {
      case 'success': return 'rgba(46, 204, 113, 0.5)';
      case 'warning': return 'rgba(241, 196, 15, 0.5)';
      case 'error': return 'rgba(231, 76, 60, 0.5)';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  }};
`;

const PIDMetadata = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const PIDUptime = styled.div`
  color: var(--second-text-color);
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const PIDActionCount = styled.div`
  color: var(--primary-accent);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
`;

const PIDActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
`;

const PIDActionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => {
    switch(props.priority) {
      case 'high': return 'rgba(231, 76, 60, 0.4)';
      case 'medium': return 'rgba(241, 196, 15, 0.4)';
      case 'low': return 'rgba(46, 204, 113, 0.4)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => {
      switch(props.priority) {
        case 'high': return '#e74c3c';
        case 'medium': return '#f1c40f';
        case 'low': return '#2ecc71';
        default: return 'var(--primary-accent)';
      }
    }};
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const PIDActionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PIDActionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const PIDDeviceName = styled.div`
  color: var(--main-text-color);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: capitalize;
`;

const PIDActionBadge = styled.div`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch(props.action?.toLowerCase()) {
      case 'reduce': 
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
      case 'increase': 
        return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
      case 'maintain': 
        return 'linear-gradient(135deg, #45b7d1 0%, #96c93d 100%)';
      case 'start':
        return 'linear-gradient(135deg, #96c93d 0%, #02aab0 100%)';
      case 'stop':
        return 'linear-gradient(135deg, #ff8a80 0%, #ff5722 100%)';
      default: 
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const PIDPriorityBadge = styled.div`
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: ${props => {
    switch(props.priority) {
      case 'high': 
        return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      case 'medium': 
        return 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)';
      case 'low': 
        return 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
      default: 
        return 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
    }
  }};
  color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const PIDActionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 0.25rem;
`;

const PIDReason = styled.div`
  color: var(--main-text-color);
  font-size: 0.85rem;
  opacity: 0.9;
  font-style: italic;
`;

const PIDTimestamp = styled.div`
  color: var(--second-text-color);
  font-size: 0.75rem;
  opacity: 0.7;
`;