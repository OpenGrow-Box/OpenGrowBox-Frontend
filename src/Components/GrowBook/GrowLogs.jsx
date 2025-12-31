import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMemo } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
import { SiApacheairflow } from "react-icons/si";
import { MdOutlineWaterDrop, MdAir, MdTune } from "react-icons/md";
import {
  FaSeedling, FaCheck, FaRegCircle, FaArrowUp, FaArrowDown, FaMinus,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaQuestionCircle,
  FaThermometerHalf, FaMoon, FaWater, FaSync, FaExclamationCircle,
  FaFlask, FaCog, FaPlug, FaBolt, FaClock, FaSpinner, FaLeaf, FaStickyNote, FaSearch,
  FaBullseye, FaChartBar
} from "react-icons/fa";
import { LuHeater } from "react-icons/lu";
import { GiIceCube, GiSunset, GiSunrise, GiSun, GiMoon } from "react-icons/gi";
import { WiHumidity, WiWindy } from "react-icons/wi";

// Generate a consistent color from a string (room name)
const stringToColor = (str) => {
  if (!str) return { bg: 'rgba(100, 100, 100, 0.8)', text: '#ffffff' };
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  
  // Generate hue from hash (0-360)
  const hue = Math.abs(hash) % 360;
  // Use fixed saturation and darker lightness for better contrast with white text
  const saturation = 60 + (Math.abs(hash >> 8) % 25); // 60-85%
  const lightness = 30 + (Math.abs(hash >> 16) % 15); // 30-45% (darker for white text)
  
  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: '#ffffff',
    border: `hsl(${hue}, ${saturation}%, ${lightness + 15}%)`
  };
};

// Determine log type for styling - moved to top for global access
const getLogType = (data) => {
  // Wenn data ein Array ist → erstes Element nehmen
  const entry = Array.isArray(data) ? data[0] : data;

  // msg sicher extrahieren
  const msg = entry?.message?.toLowerCase() || '';

  if (data.rotation_success === true) return 'rotation-success';
  
  if (data.Type === "INVALID PUMPS") return 'missing-pumps';
  if (data.Mode === "Hydro") return 'hydro-mode';
  if (data.Type === "CSLOG") return 'cs-log';

  if (entry.action) return 'action';
  if (entry.controllerType === "PID") return 'pid-controller';
  if (entry.controllerType === "MPC") return 'pid-controller';
  if (entry.medium === true) return 'medium-stats';
  if (entry.NightVPDHold !== undefined) return 'night-vpd';

  if (msg.Mode === "Plant-Watering") return 'hydro-mode';
  if (msg.Mode === "Crop-Steering") return 'hydro-mode';

  if (msg.includes('vpd')) return 'vpd';
  if (msg.includes('humidity')) return 'humidity';
  if (msg.includes('temperature')) return 'temperature';
  if (msg.includes("blocked")) return 'device-cd';

  if (entry.VPD !== undefined) return 'sensor';
  
  if (entry.Device || entry.Action || entry.Cycle !== undefined) return 'device';
  
  return 'default';
};

// Configuration object for optimal ranges (to be replaced with API data)
const GROW_METRICS_CONFIG = {
  // Environmental metrics
  vpd: {
    optimal: { min: 1.1, max: 1.35 },
    warning: { min: 0.8, max: 1.8 },
    unit: 'kPa',
    icon: <WiWindy size={18} />,
    label: 'Vapor Pressure Deficit'
  },
  temperature: {
    optimal: { min: 18, max: 25 },
    warning: { min: 15, max: 30 },
    unit: '°C',
    icon: <FaThermometerHalf size={18} />,
    label: 'Temperature'
  },
  humidity: {
    optimal: { min: 40, max: 60 },
    warning: { min: 30, max: 70 },
    unit: '%',
    icon: <WiHumidity size={18} />,
    label: 'Humidity'
  },
  dewpoint: {
    optimal: { min: 10, max: 18 },
    warning: { min: 5, max: 25 },
    unit: '°C',
    icon: <GiIceCube size={18} />,
    label: 'Dew Point'
  },

  // Medium metrics
  moisture: {
    optimal: { min: 40, max: 60 },
    warning: { min: 30, max: 70 },
    unit: '%',
    icon: <FaWater size={18} />,
    label: 'Moisture'
  },
  ec: {
    optimal: { min: 1.0, max: 2.5 },
    warning: { min: 0.5, max: 4.0 },
    unit: 'mS/cm',
    icon: <FaBolt size={18} />,
    label: 'Electrical Conductivity'
  },
  ph: {
    optimal: { min: 5.8, max: 6.5 },
    warning: { min: 5.5, max: 7.0 },
    unit: '',
    icon: <FaFlask size={18} />,
    label: 'pH Level'
  },

  // Status colors
  statusColors: {
    optimal: 'var(--main-arrow-up)',
    warning: 'var(--warning-text-color)',
    critical: 'var(--error-text-color)',
    unknown: 'var(--disabled-text-color)'
  }
};

// Utility functions for status determination
const getMetricStatus = (metric, value) => {
  if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
    return 'unknown';
  }

  const numValue = parseFloat(value);
  const config = GROW_METRICS_CONFIG[metric];

  if (!config) return 'unknown';

  if (numValue >= config.optimal.min && numValue <= config.optimal.max) {
    return 'optimal';
  }

  if (numValue >= config.warning.min && numValue <= config.warning.max) {
    return 'warning';
  }

  return 'critical';
};

const getStatusColor = (status) => {
  return GROW_METRICS_CONFIG.statusColors[status] || GROW_METRICS_CONFIG.statusColors.unknown;
};

const getStatusText = (status) => {
  switch (status) {
    case 'optimal': return 'Optimal';
    case 'warning': return 'Warning';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
};

// Status indicator components
const StatusIndicatorIcon = ({ status, size = 16 }) => {
  switch (status) {
    case 'optimal':
      return <FaCheckCircle color="var(--main-arrow-up)" size={size} />;
    case 'warning':
      return <FaExclamationTriangle color="var(--warning-text-color)" size={size} />;
    case 'critical':
      return <FaTimesCircle color="var(--error-text-color)" size={size} />;
    default:
      return <FaQuestionCircle color="var(--disabled-text-color)" size={size} />;
  }
};



const LogItem = ({ room, date, info }) => {
  // Parse the info if it's a string with error handling
  const parsedInfo = (() => {
    try {
      return typeof info === 'string' ? JSON.parse(info) : info;
    } catch (e) {
      console.warn('Failed to parse log info JSON:', e);
      return info; // fallback to original
    }
  })();

  const logType = getLogType(parsedInfo);
  function calculateUptimeFromTimestamp(timestampMs) {
    const now = Date.now(); // aktuelle Zeit in Millisekunden
    const uptimeSeconds = Math.floor((now - timestampMs) / 1000); // Differenz in Sekunden
    return uptimeSeconds >= 0 ? uptimeSeconds : 0; // negative Werte abfangen
  }

  // Format sensor data with enhanced visual design
  const formatSensorData = (data) => {
    if (data.VPD !== undefined) {
      const vpdStatus = getMetricStatus('vpd', data.VPD);
      const tempStatus = getMetricStatus('temperature', data.AvgTemp);
      const humStatus = getMetricStatus('humidity', data.AvgHum);
      const dewStatus = getMetricStatus('dewpoint', data.AvgDew);

      return (
        <EnhancedSensorContainer>
          <EnhancedSensorHeader>
            <EnhancedSensorIcon><FaThermometerHalf size={20} color="#ff6b35" /></EnhancedSensorIcon>
            <EnhancedSensorTitle>Environmental Sensors</EnhancedSensorTitle>
          </EnhancedSensorHeader>

          <EnhancedSensorGrid>
            <EnhancedSensorCard status={vpdStatus}>
              <EnhancedSensorIconSmall>
                <WiWindy size={16} />
              </EnhancedSensorIconSmall>
              <EnhancedSensorInfo>
                <EnhancedSensorLabel>VPD</EnhancedSensorLabel>
                <EnhancedSensorValue status={vpdStatus}>
                  {data.VPD} {GROW_METRICS_CONFIG.vpd.unit}
                </EnhancedSensorValue>
                <EnhancedSensorStatus status={vpdStatus}>
                  {getStatusText(vpdStatus)}
                </EnhancedSensorStatus>
              </EnhancedSensorInfo>
            </EnhancedSensorCard>

            <EnhancedSensorCard status={tempStatus}>
              <EnhancedSensorIconSmall>
                <FaThermometerHalf size={16} />
              </EnhancedSensorIconSmall>
              <EnhancedSensorInfo>
                <EnhancedSensorLabel>Temp</EnhancedSensorLabel>
                <EnhancedSensorValue status={tempStatus}>
                  {data.AvgTemp}°C
                </EnhancedSensorValue>
                <EnhancedSensorStatus status={tempStatus}>
                  {getStatusText(tempStatus)}
                </EnhancedSensorStatus>
              </EnhancedSensorInfo>
            </EnhancedSensorCard>

            <EnhancedSensorCard status={humStatus}>
              <EnhancedSensorIconSmall>
                <WiHumidity size={16} />
              </EnhancedSensorIconSmall>
              <EnhancedSensorInfo>
                <EnhancedSensorLabel>Humidity</EnhancedSensorLabel>
                <EnhancedSensorValue status={humStatus}>
                  {data.AvgHum}%
                </EnhancedSensorValue>
                <EnhancedSensorStatus status={humStatus}>
                  {getStatusText(humStatus)}
                </EnhancedSensorStatus>
              </EnhancedSensorInfo>
            </EnhancedSensorCard>

            <EnhancedSensorCard status={dewStatus}>
              <EnhancedSensorIconSmall>
                <GiIceCube size={16} />
              </EnhancedSensorIconSmall>
              <EnhancedSensorInfo>
                <EnhancedSensorLabel>Dew Point</EnhancedSensorLabel>
                <EnhancedSensorValue status={dewStatus}>
                  {data.AvgDew}°C
                </EnhancedSensorValue>
                <EnhancedSensorStatus status={dewStatus}>
                  {getStatusText(dewStatus)}
                </EnhancedSensorStatus>
              </EnhancedSensorInfo>
            </EnhancedSensorCard>
          </EnhancedSensorGrid>
        </EnhancedSensorContainer>
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

      // Pump-specific data
      const duration = data.Duration;
      const interval = data.Interval;
      const flowRate = data.FlowRate;
      const runtime = data.Runtime;
      const cyclesToday = data.CyclesToday;

      const isLightDevice = device.toLowerCase().includes('light') || device.toLowerCase().includes('led');
      const isPumpDevice = device.toLowerCase().includes('pump') || device.toLowerCase().includes('water');
      
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
              <StatusBadge cycle={cycle} isLight={isLightDevice} isPump={isPumpDevice}>
                <StatusIcon>
                  <StatusIndicatorIcon status={cycle === true ? 'optimal' : 'critical'} size={14} />
                </StatusIcon>
                <StatusLabel>{isPumpDevice ? 'Pump Status' : 'Device Status'}</StatusLabel>
                <StatusValue>{cycle ? (isPumpDevice ? 'RUNNING' : 'ON') : (isPumpDevice ? 'STOPPED' : 'OFF')}</StatusValue>
                {isPumpDevice && cycle && (
                  <PumpFlowIndicator>
                    <MdOutlineWaterDrop size={12} />
                  </PumpFlowIndicator>
                )}
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
                      {Dimmable == true ?<DimmingIcon><FaCheck color={"green"} size={30}/></DimmingIcon>:<DimmingIcon><FaRegCircle  color={"red"} size={30}/></DimmingIcon> }
                      

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
                    <SunIcon> <GiSunrise size={30} color='yellow'/></SunIcon>
                    <SunLabel>Sun Rise</SunLabel>
                    <SunStatus active={sunrise}>
                      {sunrise ? 'Aktiv' : 'Inaktiv'}
                    </SunStatus>
                  </SunScheduleItem>
                  
                  <SunScheduleItem active={sunset}>
                    <SunIcon> <GiSunset size={30} color='red'/> </SunIcon>
                    <SunLabel>Sun Set</SunLabel>
                    <SunStatus active={sunset}>
                      {sunset ? 'Aktiv' : 'Inaktiv'}
                    </SunStatus>
                  </SunScheduleItem>
                </SunScheduleContainer>
              </LightControlsContainer>
             )}

             {/* Pump-specific controls */}
             {isPumpDevice && (
               <PumpControlsContainer>
                 {/* Duration Control */}
                 {duration !== undefined && (
                   <PumpMetric>
                     <PumpMetricIcon><FaClock size={16} /></PumpMetricIcon>
                     <PumpMetricInfo>
                       <PumpMetricLabel>Duration</PumpMetricLabel>
                       <PumpMetricValue>{duration}s</PumpMetricValue>
                     </PumpMetricInfo>
                   </PumpMetric>
                 )}

                 {/* Interval Control */}
                 {interval !== undefined && (
                   <PumpMetric>
                     <PumpMetricIcon><FaSync size={16} /></PumpMetricIcon>
                     <PumpMetricInfo>
                       <PumpMetricLabel>Interval</PumpMetricLabel>
                       <PumpMetricValue>{interval}s</PumpMetricValue>
                     </PumpMetricInfo>
                   </PumpMetric>
                 )}

                 {/* Flow Rate */}
                 {flowRate !== undefined && (
                   <PumpMetric>
                     <PumpMetricIcon><MdOutlineWaterDrop size={16} /></PumpMetricIcon>
                     <PumpMetricInfo>
                       <PumpMetricLabel>Flow Rate</PumpMetricLabel>
                       <PumpMetricValue>{flowRate} L/min</PumpMetricValue>
                     </PumpMetricInfo>
                   </PumpMetric>
                 )}

                 {/* Runtime Today */}
                 {runtime !== undefined && (
                   <PumpMetric>
                     <PumpMetricIcon><FaBolt size={16} /></PumpMetricIcon>
                     <PumpMetricInfo>
                       <PumpMetricLabel>Runtime Today</PumpMetricLabel>
                       <PumpMetricValue>{Math.round(runtime / 60)}min</PumpMetricValue>
                     </PumpMetricInfo>
                   </PumpMetric>
                 )}

                 {/* Cycles Today */}
                 {cyclesToday !== undefined && (
                   <PumpMetric>
                     <PumpMetricIcon><FaCheckCircle size={16} /></PumpMetricIcon>
                     <PumpMetricInfo>
                       <PumpMetricLabel>Cycles Today</PumpMetricLabel>
                       <PumpMetricValue>{cyclesToday}</PumpMetricValue>
                     </PumpMetricInfo>
                   </PumpMetric>
                 )}
               </PumpControlsContainer>
             )}

             {/* Non-light devices - original layout */}
             {!isLightDevice && !isPumpDevice && Dimmable !== undefined && (
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

  // Format VPD Night Hold Actions with enhanced design
  const formatNightVPDData = (data) => {
    if (data.NightVPDHold !== undefined) {
      const status = data.NightVPDHold || '';
      const roomName = data.Name || 'Unknown Room';

      const getStatusType = (status) => {
        if (status === 'Active') return 'optimal';
        if (status === 'NotActive Ignoring-VPD') return 'warning';
        return 'critical';
      };

      const statusType = getStatusType(status);

      return (
        <NightVPDContainer>
          <NightVPDHeader>
            <NightVPDIcon><FaMoon size={24} /></NightVPDIcon>
            <NightVPDInfo>
              <NightVPDTitle>Night VPD Hold</NightVPDTitle>
              <NightVPDRoom>{roomName}</NightVPDRoom>
            </NightVPDInfo>
          </NightVPDHeader>

          <NightVPDStatus status={statusType}>
            <StatusIndicator status={statusType}>
              <StatusIndicatorIcon status={statusType} size={16} />
            </StatusIndicator>
            <StatusText status={statusType}>
              {status === 'Active' ? 'Active' :
              status === 'NotActive Ignoring-VPD' ? 'Inactive - Ignoring VPD' :
              status}
            </StatusText>
          </NightVPDStatus>

          <NightVPDDetails>
            <DetailItem>
              <DetailLabel>Status</DetailLabel>
              <DetailValue status={statusType}>
                {statusType === 'optimal' ? 'Night Mode Active' :
                 statusType === 'warning' ? 'Monitoring Only' :
                 'Inactive'}
              </DetailValue>
            </DetailItem>
          </NightVPDDetails>
        </NightVPDContainer>
      );
    }
    return null;
  };

  // Get device icon based on device type
  const getDeviceIcon = (device) => {
    const deviceLower = device.toLowerCase();

    // Enhanced pump detection with specific types
    if (deviceLower.includes('pump')) {
      if (deviceLower.includes('nutrient') || deviceLower.includes('feed') || deviceLower.includes('a') || deviceLower.includes('b') || deviceLower.includes('c')) {
        return <FaFlask size={30} color="#4a90e2" />; // Nutrient pump
      }
      if (deviceLower.includes('ph') || deviceLower.includes('acid')) {
        return <FaFlask size={30} color="#e74c3c" />; // pH adjustment pump
      }
      if (deviceLower.includes('circulation') || deviceLower.includes('recirc')) {
        return <MdOutlineWaterDrop size={30} color="#22c55e" />; // Circulation pump
      }
      if (deviceLower.includes('hydro') || deviceLower.includes('watering')) {
        return <MdOutlineWaterDrop size={30} color="#06b6d4" />; // Hydroponic pump
      }
      return <MdOutlineWaterDrop size={30} color="#4ecdc4" />; // Default water pump
    }

    if (deviceLower.includes('water')) return <MdOutlineWaterDrop size={30} color="#4ecdc4" />;
    if (deviceLower.includes('fan') || deviceLower.includes('venti')) return <SiApacheairflow size={30}/>;
    if (deviceLower.includes('exhaust') || deviceLower.includes('ventil')) return <MdAir size={30}/>;
    if (deviceLower.includes('inhaust') || deviceLower.includes('ventil')) return <MdAir size={30}/>;
    if (deviceLower.includes('light') || deviceLower.includes('led')) return <GiSun size={30}/>;
    if (deviceLower.includes('heat') || deviceLower.includes('warm')) return <LuHeater size={30}/>;
    if (deviceLower.includes('cool') || deviceLower.includes('ac')) return <GiIceCube size={30}/>;
    if (deviceLower.includes('dehumidi') || deviceLower.includes('warm')) return <WiHumidity size={30} color='red'/>;
    if (deviceLower.includes('humidi') || deviceLower.includes('ac')) return <WiHumidity size={30}  color='blue'/>;
    if (deviceLower.includes('climate') || deviceLower.includes('ac')) return <GiIceCube size={30}/>;
    return <FaCog size={30} />;
  };

  // Format action data - handle both single actions and arrays of actions
  const formatActionData = (data) => {
    // Handle new PID controller structure with actionData array
   
    if (data?.controlCommands && Array.isArray(data?.controlCommands)) {
      
      return (
        <PIDControllerContainer>
          <PIDHeader>
            <PIDTitle>
              <PIDIcon><MdTune size={24} /></PIDIcon>
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

  // Format deviation data with enhanced visual design
  const formatDeviationData = (data) => {
    if (data.tempDeviation !== undefined || data.humDeviation !== undefined) {
      const tempDeviation = data.tempDeviation;
      const humDeviation = data.humDeviation;

      const getDeviationStatus = (deviation) => {
        const absValue = Math.abs(parseFloat(deviation) || 0);
        if (absValue <= 1) return 'optimal';
        if (absValue <= 3) return 'warning';
        return 'critical';
      };



      return (
        <DeviationContainer>
          <DeviationHeader>
            <DeviationIcon><FaExclamationTriangle size={20} /></DeviationIcon>
            <DeviationTitle>System Deviations</DeviationTitle>
          </DeviationHeader>

          <DeviationGrid>
            {tempDeviation !== undefined && (
              <DeviationCard status={getDeviationStatus(tempDeviation)}>
                <DeviationInfo>
                  <DeviationLabel>Temperature</DeviationLabel>
                  <DeviationValue status={getDeviationStatus(tempDeviation)}>
                    {tempDeviation > 0 ? '+' : ''}{tempDeviation}°C
                  </DeviationValue>
                  <div className="DeviationStatus" data-status={getDeviationStatus(tempDeviation)}>
                    {getStatusText(getDeviationStatus(tempDeviation))}
                  </div>
                </DeviationInfo>
                <TrendIndicator>
                   {tempDeviation > 0.5 ? <FaArrowUp color="var(--error-text-color)" size={14} /> :
                    tempDeviation < -0.5 ? <FaArrowDown color="var(--main-arrow-up)" size={14} /> :
                    <FaMinus color="var(--disabled-text-color)" size={14} />}
                </TrendIndicator>
              </DeviationCard>
            )}

            {humDeviation !== undefined && (
              <DeviationCard status={getDeviationStatus(humDeviation)}>
                <DeviationInfo>
                  <DeviationLabel>Humidity</DeviationLabel>
                  <DeviationValue status={getDeviationStatus(humDeviation)}>
                    {humDeviation > 0 ? '+' : ''}{humDeviation}%
                  </DeviationValue>
                  <div className="DeviationStatus" data-status={getDeviationStatus(humDeviation)}>
                    {getStatusText(getDeviationStatus(humDeviation))}
                  </div>
                </DeviationInfo>
                <TrendIndicator>
                   {humDeviation > 0.5 ? <FaArrowUp color="var(--error-text-color)" size={14} /> :
                    humDeviation < -0.5 ? <FaArrowDown color="var(--main-arrow-up)" size={14} /> :
                    <FaMinus color="var(--disabled-text-color)" size={14} />}
                </TrendIndicator>
              </DeviationCard>
            )}
          </DeviationGrid>
        </DeviationContainer>
      );
    }
    return null;
  };

  const formatMediumData = (data) => {
    if (!data.medium) return null;

    const safe = (v, unit = "") =>
      (v === undefined || v === null || v === "" ? "NO DATA" : `${v}${unit ? " " + unit : ""}`);

    return (
      <MediumContainer>
        <MediumHeader>
          <MediumIcon><FaSeedling size={24} /></MediumIcon>
          <div>
            <MediumTitle>Medium Status</MediumTitle>
            <MediumSubtitle>
              {safe(data.medium_type.toUpperCase())} • {safe(data.medium_sensors_total)} Sensors
            </MediumSubtitle>
          </div>
        </MediumHeader>

        <MetricGroups>
          {/* Environmental Metrics */}
          <MetricGroup>
            <MetricCard status={getMetricStatus('moisture', data.medium_moisture)}>
              <MetricHeader>
                <MetricIcon><FaWater size={20} /></MetricIcon>
                <MetricLabel>Moisture</MetricLabel>
              </MetricHeader>
              <MetricValue status={getMetricStatus('moisture', data.medium_moisture)}>
                {safe(data.medium_moisture, GROW_METRICS_CONFIG.moisture.unit)}
              </MetricValue>
              <MetricStatus status={getMetricStatus('moisture', data.medium_moisture)}>
                {getStatusText(getMetricStatus('moisture', data.medium_moisture))}
              </MetricStatus>
            </MetricCard>

            <MetricCard status={getMetricStatus('temperature', data.medium_temp)}>
              <MetricHeader>
                <MetricIcon><FaThermometerHalf size={20} /></MetricIcon>
                <MetricLabel>Temperature</MetricLabel>
              </MetricHeader>
              <MetricValue status={getMetricStatus('temperature', data.medium_temp)}>
                {safe(data.medium_temp, GROW_METRICS_CONFIG.temperature.unit)}
              </MetricValue>
              <MetricStatus status={getMetricStatus('temperature', data.medium_temp)}>
                {getStatusText(getMetricStatus('temperature', data.medium_temp))}
              </MetricStatus>
            </MetricCard>
          </MetricGroup>

          {/* Chemical Metrics */}
          <MetricGroup>
            <MetricCard status={getMetricStatus('ec', data.medium_ec)}>
              <MetricHeader>
                <MetricIcon><FaBolt size={20} /></MetricIcon>
                <MetricLabel>EC</MetricLabel>
              </MetricHeader>
              <MetricValue status={getMetricStatus('ec', data.medium_ec)}>
                {safe(data.medium_ec, GROW_METRICS_CONFIG.ec.unit)}
              </MetricValue>
              <MetricStatus status={getMetricStatus('ec', data.medium_ec)}>
                {getStatusText(getMetricStatus('ec', data.medium_ec))}
              </MetricStatus>
            </MetricCard>

            <MetricCard status={getMetricStatus('ph', data.medium_ph)}>
              <MetricHeader>
                <MetricIcon><FaFlask size={20} /></MetricIcon>
                <MetricLabel>pH</MetricLabel>
              </MetricHeader>
              <MetricValue status={getMetricStatus('ph', data.medium_ph)}>
                {safe(data.medium_ph)}
              </MetricValue>
              <MetricStatus status={getMetricStatus('ph', data.medium_ph)}>
                {getStatusText(getMetricStatus('ph', data.medium_ph))}
              </MetricStatus>
            </MetricCard>
          </MetricGroup>
        </MetricGroups>

        <SensorStatus>
          <MediumStatusIndicator status="online" />
          <MediumStatusText>{safe(data.medium_sensors_total)} sensors connected</MediumStatusText>
        </SensorStatus>
      </MediumContainer>
    );
  };


  const formatCastData = (data) => {
    if (!data.Mode) return null;

    const activeDevices = data.Devices?.count || 0;
    const totalDevices = data.Devices?.devEntities?.length || 0;
    const deviceStatus = activeDevices === totalDevices && totalDevices > 0 ? 'optimal' :
                        activeDevices > 0 ? 'warning' : 'critical';

    return (
      <HydroContainer>
        <HydroHeader>
          <HydroIcon><FaWater size={24} /></HydroIcon>
          <HydroInfo>
            <HydroTitle>Hydroponic System</HydroTitle>
            <HydroMode>Cast Mode: {data.Mode}</HydroMode>
          </HydroInfo>
          <HydroStatus active={data.Active}>
            <StatusIndicatorIcon status={data.Active ? 'optimal' : 'critical'} size={16} />
            {data.Active ? 'Active' : 'Inactive'}
          </HydroStatus>
        </HydroHeader>

        <HydroControls>
          <ControlGrid>
            <ControlItem>
              <ControlIcon><FaSync size={18} /></ControlIcon>
              <ControlInfo>
                <ControlLabel>Interval Active</ControlLabel>
                <ControlStatus active={data.Cycle}>
                  {data.Cycle ? 'Enabled' : 'Disabled'}
                </ControlStatus>
              </ControlInfo>
            </ControlItem>

            <ControlItem>
              <ControlIcon><FaPlug size={18} /></ControlIcon>
              <ControlInfo>
                <ControlLabel>Device Status</ControlLabel>
                <ControlStatus status={deviceStatus}>
                  {activeDevices}/{totalDevices} Active
                </ControlStatus>
              </ControlInfo>
            </ControlItem>
          </ControlGrid>

          {data.Devices?.devEntities && data.Devices.devEntities.length > 0 && (
            <DeviceVisualization>
              <DeviceLabel>Connected Devices</DeviceLabel>
              <DeviceGrid>
                {data.Devices.devEntities.map((device, index) => (
                  <DeviceBadge key={index} active={data.Active}>
                    {getDeviceIcon(device) || <FaPlug size={14} />} {device}
                  </DeviceBadge>
                ))}
              </DeviceGrid>
            </DeviceVisualization>
          )}
        </HydroControls>
      </HydroContainer>
    );
  };


  const formatRotationData = (data) => {
    if (!data.rotation_success) return null;

    return (
      <RotationContainer>
        <RotationHeader>
          <RotationIcon><FaSync size={24} /></RotationIcon>
          <RotationInfo>
            <RotationTitle>Token Rotation</RotationTitle>
            <RotationStatus>Success</RotationStatus>
          </RotationInfo>
        </RotationHeader>

        <RotationMessage>
          Authentication token has been successfully rotated and updated.
        </RotationMessage>
      </RotationContainer>
    );
  };

 const formatCSData = (data) => {
   if (data.Type === "CSLOG") {
     return (
       <CropSteeringContainer>
         <CropSteeringHeader>
           <CropSteeringIcon><FaSeedling /></CropSteeringIcon>
           <CropSteeringInfo>
             <CropSteeringTitle>Crop Steering</CropSteeringTitle>
             <CropSteeringType>Automated Adjustment</CropSteeringType>
           </CropSteeringInfo>
         </CropSteeringHeader>

         <CropSteeringMessage>
           {data.Message}
         </CropSteeringMessage>
       </CropSteeringContainer>
     );
   }
   return null;
 };

 const formatDeviceCDData = (data) => {
   if (data.blocked_actions !== 0 && Array.isArray(data.emergency_conditions)) {
     const severity = data.blocked_actions > 5 ? 'critical' :
                     data.blocked_actions > 2 ? 'warning' : 'optimal';

      return (
        <EmergencyContainer severity={severity}>
         <EmergencyHeader>
           <EmergencyIcon severity={severity}>
             <FaExclamationCircle size={24} />
             {severity === 'critical' && <EmergencyPulse />}
           </EmergencyIcon>
            <EmergencyInfo>
              <EmergencyTitle severity={severity}><FaExclamationTriangle /> Emergency Conditions</EmergencyTitle>
              <EmergencySubtitle>System Protection Active</EmergencySubtitle>
            </EmergencyInfo>
         </EmergencyHeader>

          <EmergencyStats>
            <StatItem>
              <StatLabel>Blocked Actions</StatLabel>
              <StatValue status={severity}>{data.blocked_actions}</StatValue>
            </StatItem>

            <StatItem>
              <StatLabel>Active Conditions</StatLabel>
              <StatValue status={severity}>{data.emergency_conditions.length}</StatValue>
            </StatItem>
          </EmergencyStats>

         {data.emergency_conditions.length > 0 && (
           <EmergencyDetails>
             <DetailsTitle>Emergency Details</DetailsTitle>
             <ConditionList>
               {data.emergency_conditions.map((condition, index) => (
               <ConditionItem key={index} severity={severity}>
                 <ConditionIcon><FaExclamationTriangle size={16} /></ConditionIcon>
                 <ConditionText>
                     {typeof condition === 'string' ? condition :
                      condition.message || condition.description || JSON.stringify(condition)}
                   </ConditionText>
                 </ConditionItem>
               ))}
             </ConditionList>
           </EmergencyDetails>
         )}
       </EmergencyContainer>
     );
   }

   return null;
 };

  // Format MediumPlantsUpdate data (plants array from backend)
  const sensorData = formatSensorData(parsedInfo);
  const actionData = formatActionData(parsedInfo);
  const deviceData = formatDeviceAction(parsedInfo);
  const deviationData = formatDeviationData(parsedInfo);
  const nightVPDData = formatNightVPDData(parsedInfo);
  const mediumData = formatMediumData(parsedInfo);
  const castData = formatCastData(parsedInfo);
  const rotationData = formatRotationData(parsedInfo);
  const csData = formatCSData(parsedInfo);
  const deviceCDData = formatDeviceCDData(parsedInfo);

  const roomColors = stringToColor(room);

  return (
    <LogItemContainer logType={logType}>
      <LogHeader logType={logType}>
        <RoomInfo>
          <RoomName $color={roomColors.bg}>{room}</RoomName>
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
        {mediumData && mediumData}
        {castData && castData}
        {rotationData && rotationData}
        {csData && csData}
        {deviceCDData && deviceCDData}
        {!sensorData && !actionData && !deviceData && !deviationData && !nightVPDData && !mediumData && !castData && !rotationData && !csData && !deviceCDData && (
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogType, setSelectedLogType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const { connection } = useHomeAssistant();

  // Filter logs based on search and type
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.info?.toLowerCase().includes(searchTerm.toLowerCase());

      if (selectedLogType === 'all') return matchesSearch;

      const parsedInfo = (() => {
        try {
          return typeof log.info === 'string' ? JSON.parse(log.info) : log.info;
        } catch (e) {
          return log.info;
        }
      })();

      const logType = getLogType(parsedInfo);
      return matchesSearch && logType === selectedLogType;
    });
  }, [logs, searchTerm, selectedLogType]);

  // Toggle log expansion
  const toggleLogExpansion = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  useEffect(() => {
    if (!connection) {
      setIsLoading(false);
      return;
    }

    const handleNewEvent = (event) => {
      // Skip MediumPlantsUpdate events - these are for MediumContext only, not GrowLogs
      if (event.data && event.data.plants && Array.isArray(event.data.plants)) {
        return;
      }
      
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
      setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 50)]); // Keep only last 200 logs for performance
    };

    const subscribe = async () => {
      const unsubscribe = await connection.subscribeEvents(
        handleNewEvent,
        'LogForClient'
      );
      setIsLoading(false); // Stop loading once subscription is active
      return unsubscribe;
    };

    const unsubscribePromise = subscribe();

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };
  }, [connection]);

  const displayedLogs = filteredLogs.slice(0, 50); // Show only 50 filtered logs for better performance

  return (
    <LogContainer>
      {/* Search and Filter Header */}
      <LogHeader>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={selectedLogType}
            onChange={(e) => setSelectedLogType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="sensor">Sensors</option>
            <option value="device">Devices</option>
            <option value="action">Actions</option>
            <option value="hydro-mode">Hydro Mode</option>
            <option value="pid-controller">PID Controller</option>
            <option value="medium-stats">Medium Stats</option>
            <option value="night-vpd">Night VPD</option>
            <option value="emergency">Emergency</option>
          </FilterSelect>
        </SearchContainer>
        <LogCount>
          {displayedLogs.length} of {filteredLogs.length} logs
        </LogCount>
      </LogHeader>

      <GrowLogContainer>
        {isLoading ? (
          <LoadingState>
            <LoadingSpinner>
              <FaSpinner className="fa-spin" />
            </LoadingSpinner>
            <LoadingText>Connecting to log stream...</LoadingText>
          </LoadingState>
        ) : displayedLogs.length === 0 ? (
          <NoLogsMessage>
            {filteredLogs.length === 0 && logs.length === 0 ? (
              <LoadingDots>Waiting for Logs...</LoadingDots>
            ) : filteredLogs.length === 0 ? (
              <EmptyState>
                <EmptyIcon><FaSearch /></EmptyIcon>
                <EmptyTitle>No logs match your search</EmptyTitle>
                <EmptyText>Try adjusting your search terms or filters</EmptyText>
              </EmptyState>
            ) : (
              <LoadingDots>No more logs to display</LoadingDots>
            )}
          </NoLogsMessage>
        ) : (
          displayedLogs.map((log, index) => (
            <ExpandableLogItem
              key={`${log.room}-${log.date}-${index}`}
              log={log}
              isExpanded={expandedLogs.has(`${log.room}-${log.date}-${index}`)}
              onToggle={() => toggleLogExpansion(`${log.room}-${log.date}-${index}`)}
            />
          ))
        )}
      </GrowLogContainer>
    </LogContainer>
  );
};

// Expandable Log Item Component
const ExpandableLogItem = ({ log, isExpanded, onToggle }) => {
  const parsedInfo = (() => {
    try {
      return typeof log.info === 'string' ? JSON.parse(log.info) : log.info;
    } catch (e) {
      return log.info;
    }
  })();

  const logType = getLogType(parsedInfo);

  const roomColors = stringToColor(log.room);

  return (
    <LogItemContainer logType={logType} isExpanded={isExpanded}>
      <LogHeaderRow onClick={onToggle}>
        <LogSummary>
          <RoomBadge $bgColor={roomColors.bg} $textColor={roomColors.text} $borderColor={roomColors.border}>
            {log.room || 'Unknown'}
          </RoomBadge>
          <LogTypeIndicator logType={logType}>
            {getLogTypeIcon(logType)}
          </LogTypeIndicator>
          <LogPreview>
            {getLogPreview(parsedInfo)}
          </LogPreview>
        </LogSummary>
        <LogMeta>
          <TimeStamp>{log.date}</TimeStamp>
          <ExpandIcon $isExpanded={isExpanded}>
            {isExpanded ? '▼' : '▶'}
          </ExpandIcon>
        </LogMeta>
      </LogHeaderRow>

      {isExpanded && (
        <ExpandedContent>
          <LogItem
            room={log.room || ''}
            date={log.date}
            info={log.info}
          />
        </ExpandedContent>
      )}
    </LogItemContainer>
  );
};

// Helper functions for the expandable component
const getLogTypeIcon = (logType) => {
  switch (logType) {
    case 'sensor': return <FaChartBar />;
    case 'device': return <FaCog />;
    case 'action': return <FaBullseye />;
    case 'hydro-mode': return <WiHumidity />;
    case 'pid-controller': return <MdTune />;
    case 'medium-stats': return <FaLeaf />;
    case 'night-vpd': return <GiMoon />;
    case 'emergency': return <FaExclamationTriangle />;
    default: return <FaStickyNote />;
  }
};

const getLogPreview = (parsedInfo) => {
  if (!parsedInfo) return 'Log data';

  // Try to get a meaningful preview
  if (parsedInfo.message) return parsedInfo.message;
  if (parsedInfo.VPD !== undefined) return `VPD: ${parsedInfo.VPD} kPa`;
  if (parsedInfo.Device) return `${parsedInfo.Device}: ${parsedInfo.Action || 'Action'}`;
  if (parsedInfo.action) return parsedInfo.action;
  if (parsedInfo.Mode) return `Mode: ${parsedInfo.Mode}`;

  return 'Log details';
};

export default GrowLogs;



const LogContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex: 1;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--main-text-color, #fff);
  font-size: 0.9rem;

  &::placeholder {
    color: var(--second-text-color, #ccc);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-accent, #007AFF);
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 480px) {
    padding: 0.6rem 0.75rem;
    font-size: 1rem; /* Prevent zoom on iOS */
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--main-text-color, #fff);
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: var(--primary-accent, #007AFF);
    background: rgba(255, 255, 255, 0.15);
  }

  option {
    background: var(--input-bg-color, #333);
    color: var(--main-text-color, #fff);
  }

  @media (max-width: 480px) {
    min-width: unset;
    flex: 1;
  }
`;

const LogCount = styled.div`
  color: var(--second-text-color, #ccc);
  font-size: 0.85rem;
  white-space: nowrap;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  font-size: 2rem;
  color: var(--primary-accent, #007AFF);
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.7;
`;

const EmptyTitle = styled.h3`
  color: var(--main-text-color, #fff);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const EmptyMessage = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0;
  font-size: 0.9rem;
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
      
      case 'medium-stats': return 'linear-gradient(135deg, rgba(116, 75, 162, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%)'; // New

      case 'hydro-mode': return 'linear-gradient(135deg, rgba(116, 255, 162, 0.3) 0%, rgba(74, 144, 226, 0.1) 100%)'; // New
      case 'rotation-success': return 'linear-gradient(135deg, rgba(255, 125, 162, 0.3) 0%, rgba(125, 144, 226, 0.1) 100%)'; // New      
      case 'missing-pumps': return 'linear-gradient(135deg, rgba(255, 125, 162, 0.3) 0%, rgba(125, 144, 226, 0.1) 100%)'; // New   
      
      case 'crop-steering': return 'linear-gradient(135deg, rgba(116, 255, 162, 1) 0%, rgba(74, 144, 226, 0.1) 100%)'; // New
      case 'cs-log': return 'linear-gradient(135deg, rgba(125, 225, 162, 0.3) 0%, rgba(125, 144, 226, 0.1) 100%)'; // New   

      case 'device-cd': return 'linear-gradient(135deg, rgba(255, 225, 162, 0.3) 0%, rgba(125, 144, 226, 0.1) 100%)'; // New    

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
  color: ${props => props.$color || 'var(--primary-accent)'};
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
    // Enhanced pump backgrounds based on type
    if (device.includes('pump')) {
      if (device.includes('nutrient') || device.includes('feed')) {
        return 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)'; // Blue for nutrient pumps
      }
      if (device.includes('ph') || device.includes('acid')) {
        return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'; // Red for pH pumps
      }
      if (device.includes('circulation') || device.includes('recirc')) {
        return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; // Green for circulation pumps
      }
      return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'; // Teal for general water pumps
    }
    if (device.includes('water')) return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
    if (device.includes('vent'))  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (device.includes('exhaust'))  return 'linear-gradient(135deg, #aa7eea 0%, #764ba2 100%)';
    if (device.includes('inhaust'))  return 'linear-gradient(135deg, #aa7eea 0%, #777ba2 100%)';
    if (device.includes('heater'))  return 'linear-gradient(135deg, #e07020 0%, #b84a00 100%)';
    if (device.includes('cooler'))  return 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)';
    if (device.includes('dehumidifer'))  return 'linear-gradient(135deg, #b45309 0%, #92400e 100%)';
    if (device.includes('humidifer'))  return 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';


    // ... etc
    return 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)';
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
        return 'linear-gradient(135deg, #0d9448 0%, #0077b6 100%)'; // Dunkelgrün → Dunkelblau
      case 'increase': 
        return 'linear-gradient(135deg, #c44e00 0%, #b8860b 100%)'; // Dunkelorange → Dunkelgold
      case 'maintain': 
        return 'linear-gradient(135deg, #2980b9 0%, #27ae60 100%)'; // Dunkelblau → Dunkelgrün
      case 'start':
        return 'linear-gradient(135deg, #27ae60 0%, #0e6655 100%)'; // Dunkelgrün → Teal
      case 'stop':
        return 'linear-gradient(135deg, #c0392b 0%, #96281b 100%)'; // Dunkelrot
      case 'on':
        return 'linear-gradient(135deg, #1a8a7d 0%, #0e6655 100%)'; // Dunkel-Teal
      case 'off':
        return 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)'; // Dunkelrot
      default: 
        return 'linear-gradient(135deg, #5b4b9e 0%, #5a3d7a 100%)'; // Dunkles Lila
    }
  }};
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
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

const DeviationInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
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
  background: ${props => {
    if (props.isPump) {
      return props.cycle
        ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(68, 160, 141, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(192, 57, 43, 0.1) 100%)';
    }
    if (props.isLight) {
      return props.cycle
        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(105, 105, 105, 0.2) 0%, rgba(64, 64, 64, 0.2) 100%)';
    }
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border: 1px solid ${props => {
    if (props.isPump) {
      return props.cycle ? 'rgba(78, 205, 196, 0.3)' : 'rgba(231, 76, 60, 0.3)';
    }
    if (props.isLight) {
      return props.cycle ? 'rgba(255, 215, 0, 0.3)' : 'rgba(105, 105, 105, 0.3)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  ${props => props.isPump && props.cycle && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(78, 205, 196, 0.3), transparent);
      animation: pumpFlow 2s ease-in-out infinite;
    }

    @keyframes pumpFlow {
      0%, 100% { left: -100%; }
      50% { left: 100%; }
    }
  `}

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const StatusBadgeHydro = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.active ? '#16a34a' : '#dc2626'};
  font-weight: 600;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.active ? '#16a34a' : '#dc2626'};
    box-shadow: 0 0 10px ${props => props.active ? '#16a34a' : '#dc2626'};
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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

const PumpFlowIndicator = styled.div`
  color: #4ecdc4;
  animation: pumpPulse 1.5s ease-in-out infinite;

  @keyframes pumpPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }
`;

// Pump Controls
const PumpControlsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  width: 100%;
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(68, 160, 141, 0.1) 100%);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 0.5rem;
`;

const PumpMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const PumpMetricIcon = styled.div`
  color: #4ecdc4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(78, 205, 196, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
`;

const PumpMetricInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
`;

const PumpMetricLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const PumpMetricValue = styled.div`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  word-break: break-word;
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

const EmergencyPulse = styled.div`
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%);
  animation: emergencyPulse 1.5s ease-in-out infinite;
  pointer-events: none;

  @keyframes emergencyPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.2);
    }
  }
`;

// Night VPD
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

// P.I.D
const PIDControllerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(116, 75, 162, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%);
  border: 1px solid rgba(116, 75, 162, 0.3);
  border-radius: 12px;
  padding: 1rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #7449e6, #4a90e2, #2d5aa0);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(116, 75, 162, 0.1), transparent);
    animation: pidScan 4s ease-in-out infinite;
  }

  @keyframes pidScan {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }
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
        return 'linear-gradient(135deg, #c0392b 0%, #962d22 100%)';
      case 'increase': 
        return 'linear-gradient(135deg, #1a8a7d 0%, #0e6655 100%)';
      case 'maintain': 
        return 'linear-gradient(135deg, #2980b9 0%, #1a5276 100%)';
      case 'start':
        return 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)';
      case 'stop':
        return 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)';
      default: 
        return 'linear-gradient(135deg, #5b4b9e 0%, #4a3d7a 100%)';
    }
  }};
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
        return 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)';
      case 'medium': 
        return 'linear-gradient(135deg, #b7950b 0%, #9a7d0a 100%)';
      case 'low': 
        return 'linear-gradient(135deg, #1e8449 0%, #196f3d 100%)';
      default: 
        return 'linear-gradient(135deg, #626567 0%, #515a5a 100%)';
    }
  }};
  color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
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

// MEDIUM 

// Enhanced Medium Display Components
export const MediumContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #22c55e, #16a34a, #15803d);
  }
`;

export const MediumHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

export const MediumIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
`;

export const MediumTitle = styled.h3`
  margin: 0;
  color: #22c55e;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(34, 197, 94, 0.2);
`;

export const MediumSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 400;
`;

export const MetricGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const MetricGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const MetricCard = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'critical': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'critical': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => {
      switch (props.status) {
        case 'optimal': return 'rgba(34, 197, 94, 0.5)';
        case 'warning': return 'rgba(245, 158, 11, 0.5)';
        case 'critical': return 'rgba(239, 68, 68, 0.5)';
        default: return 'rgba(34, 197, 94, 0.3)';
      }
    }};
  }
`;

export const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const MetricIcon = styled.div`
  font-size: 1.1rem;
  opacity: 0.8;
`;

export const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

export const MetricValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => {
    switch (props.status) {
      case 'optimal': return 'var(--main-arrow-up)';
      case 'warning': return 'var(--warning-text-color)';
      case 'critical': return 'var(--error-text-color)';
      default: return 'var(--focus-color)';
    }
  }};
  margin-bottom: 0.25rem;
`;

export const MetricStatus = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.8)';
      case 'warning': return 'rgba(245, 158, 11, 0.8)';
      case 'critical': return 'rgba(239, 68, 68, 0.8)';
      default: return 'rgba(107, 114, 128, 0.8)';
    }
  }};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

export const SensorStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.2);
`;

export const MediumStatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'online': return 'var(--main-arrow-up)';
      case 'warning': return 'var(--warning-text-color)';
      case 'offline': return 'var(--error-text-color)';
      default: return 'var(--disabled-text-color)';
    }
  }};
  box-shadow: 0 0 6px ${props => {
    switch (props.status) {
      case 'online': return 'rgba(34, 197, 94, 0.5)';
      case 'warning': return 'rgba(245, 158, 11, 0.5)';
      case 'offline': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(107, 114, 128, 0.5)';
    }
  }};
`;

export const MediumStatusText = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

// Enhanced Sensor Display Components
export const EnhancedSensorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 1rem;
`;

export const EnhancedSensorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const EnhancedSensorIcon = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

export const EnhancedSensorTitle = styled.h3`
  margin: 0;
  color: #3b82f6;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const EnhancedSensorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
`;

export const EnhancedSensorCard = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'critical': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'critical': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  }};
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  ${props => props.status === 'critical' && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c);
      animation: sensorAlert 2s ease-in-out infinite;
    }

    @keyframes sensorAlert {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => {
      switch (props.status) {
        case 'optimal': return 'rgba(34, 197, 94, 0.5)';
        case 'warning': return 'rgba(245, 158, 11, 0.5)';
        case 'critical': return 'rgba(239, 68, 68, 0.5)';
        default: return 'rgba(107, 114, 128, 0.5)';
      }
    }};
  }
`;

export const EnhancedSensorIconSmall = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

export const EnhancedSensorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const EnhancedSensorLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

export const EnhancedSensorValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => getStatusColor(props.status)};
`;

export const EnhancedSensorStatus = styled.div`
  font-size: 0.7rem;
  font-weight: 500;
  color: ${props => getStatusColor(props.status)};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

// Enhanced Night VPD Components
export const NightVPDDetails = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
`;

export const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`;

export const DetailValue = styled.span`
  font-size: 0.9rem;
  color: ${props => getStatusColor(props.status)};
  font-weight: 600;
`;

// Enhanced Deviation Components
export const DeviationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

export const DeviationIcon = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
   background: linear-gradient(135deg, var(--warning-text-color) 0%, var(--warning-accent-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

export const DeviationTitle = styled.h3`
  margin: 0;
   color: var(--warning-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

export const DeviationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
`;

export const DeviationCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => {
    switch (props.status) {
      case 'optimal': return 'rgba(34, 197, 94, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'critical': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  }};
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const TrendIndicator = styled.div`
  margin-left: auto;
 `;



// Enhanced Hydroponic Components
export const HydroContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 1rem;
`;

export const HydroHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const HydroIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

export const HydroInfo = styled.div`
  flex: 1;
`;

export const HydroTitle = styled.h3`
  margin: 0 0 0.25rem 0;
  color: #06b6d4;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const HydroMode = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
`;

export const HydroStatus = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: ${props => props.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.active ? '#22c55e' : '#ef4444'};
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  ${props => props.active && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent);
      animation: hydroFlow 2s ease-in-out infinite;
    }

    @keyframes hydroFlow {
      0%, 100% { left: -100%; }
      50% { left: 100%; }
    }
  `}
`;

export const HydroControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
`;

export const ControlItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
`;

export const ControlIcon = styled.div`
  font-size: 1.2rem;
`;

export const ControlInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const ControlLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

export const ControlStatus = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => {
    if (props.active !== undefined) {
      return props.active ? '#22c55e' : '#ef4444';
    }
    return getStatusColor(props.status);
  }};
`;

export const DeviceVisualization = styled.div`
  margin-top: 0.5rem;
`;

export const DeviceLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

export const DeviceGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

// Enhanced Rotation Components
export const RotationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1rem;
`;

export const RotationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const RotationIcon = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

export const RotationInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const RotationTitle = styled.h3`
  margin: 0;
  color: #22c55e;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const RotationStatus = styled.div`
  color: #22c55e;
  font-size: 0.85rem;
  font-weight: 500;
`;

export const RotationMessage = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
`;

// Enhanced Crop Steering Components
export const CropSteeringContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1rem;
`;

export const CropSteeringHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const CropSteeringIcon = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

export const CropSteeringInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const CropSteeringTitle = styled.h3`
  margin: 0;
  color: #22c55e;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const CropSteeringType = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
`;

export const CropSteeringMessage = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 0.75rem;
`;

// Enhanced Emergency Components
export const EmergencyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: ${props => {
    switch(props.severity) {
      case 'critical': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)';
      case 'warning': return 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)';
      default: return 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.4)';
      case 'warning': return 'rgba(245, 158, 11, 0.4)';
      default: return 'rgba(34, 197, 94, 0.4)';
    }
  }};
  border-radius: 12px;
  padding: 1rem;
  position: relative;
  overflow: hidden;

  ${props => props.severity === 'critical' && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
      animation: emergencyScan 3s ease-in-out infinite;
    }

    @keyframes emergencyScan {
      0%, 100% { left: -100%; }
      50% { left: 100%; }
    }
  `}
`;

export const EmergencyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const EmergencyIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    switch(props.severity) {
      case 'critical': return 'linear-gradient(135deg, var(--error-text-color) 0%, var(--error-text-color) 100%)';
      case 'warning': return 'linear-gradient(135deg, var(--warning-text-color) 0%, var(--warning-accent-color) 100%)';
      default: return 'linear-gradient(135deg, var(--main-arrow-up) 0%, var(--main-arrow-up) 100%)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  position: relative;
  box-shadow: ${props => {
    switch(props.severity) {
      case 'critical': return '0 0 20px rgba(239, 68, 68, 0.5)';
      case 'warning': return '0 0 20px rgba(245, 158, 11, 0.5)';
      default: return '0 0 20px rgba(34, 197, 94, 0.5)';
    }
  }};
`;

export const EmergencyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const EmergencyTitle = styled.h3`
  margin: 0;
  color: ${props => {
    switch(props.severity) {
      case 'critical': return 'var(--error-text-color)';
      case 'warning': return 'var(--warning-text-color)';
      default: return 'var(--main-arrow-up)';
    }
  }};
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: ${props => props.severity === 'critical' ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none'};
`;

export const EmergencySubtitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
`;

export const EmergencyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
`;

export const StatItem = styled.div`
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
`;

export const StatLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => getStatusColor(props.status)};
`;

export const EmergencyDetails = styled.div`
  margin-top: 0.5rem;
`;

export const DetailsTitle = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.75rem;
  font-weight: 500;
`;

export const ConditionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ConditionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => {
    switch (props.severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  }};
  border-radius: 6px;
  padding: 0.5rem;
`;

export const ConditionIcon = styled.div`
  font-size: 1rem;
`;

export const ConditionText = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
`;



export const HydroCastData = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

export const HydroCastItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(15, 170, 170, 0.1), rgba(113, 224, 138, 0.1));
  backdrop-filter: blur(10px);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #e6e6e6;
  padding: 14px 20px;
  border: 1px solid rgba(15, 170, 170, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #0fa;
    background: linear-gradient(135deg, rgba(15, 170, 170, 0.2), rgba(113, 224, 138, 0.2));
    transform: translateX(4px);
  }
`;

export const DeviceItem = styled(HydroCastItem)`
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`;

export const ItemLabel = styled.span`
  color: #71e08a;
  font-weight: 500;
  letter-spacing: 0.3px;
`;

export const ItemValue = styled.span`
  color: #fff;
  font-weight: 600;
  background: rgba(15, 170, 170, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
`;



export const DeviceBadgesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
`;

export const DeviceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(15, 170, 170, 0.3), rgba(113, 224, 138, 0.3));
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid rgba(15, 170, 170, 0.5);
  transition: all 0.3s ease;
  
  &::before {
    content: '⚡';
    font-size: 0.9rem;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(15, 170, 170, 0.5), rgba(113, 224, 138, 0.5));
    transform: scale(1.05);
    border-color: #0fa;
  }
`;

const Box = styled.div`
  background: #1e1f25;
  border-left: 4px solid #3cb371;
  padding: 14px 18px;
  border-radius: 10px;
  color: #fff;
  margin-top: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.1rem;
  gap: 8px;
  margin-bottom: 8px;
`;

const Message = styled.div`
  font-size: 0.95rem;
  line-height: 1.4;
  color: #d9e2e1;
`;

// Expandable log item styled components
const LogHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const LogSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
`;

const RoomBadge = styled.div`
  background: ${props => props.$bgColor || 'var(--primary-accent, #007AFF)'};
  color: ${props => props.$textColor || 'white'};
  border: 1px solid ${props => props.$borderColor || 'transparent'};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const LogTypeIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-accent, #007AFF);
  flex-shrink: 0;
  font-size: 0.85rem;
`;

const LogPreview = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const LogMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const ExpandIcon = styled.div`
  color: var(--primary-accent, #007AFF);
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  transform: ${props => props.$isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'};
  width: 16px;
  text-align: center;
`;

const ExpandedContent = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideDown 0.2s ease;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 1000px;
    }
  }
`;

const EmptyText = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0;
  font-size: 0.9rem;
`;
