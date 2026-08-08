import styled from 'styled-components';
import { FaSeedling, FaWater, FaThermometerHalf, FaBolt, FaFlask } from 'react-icons/fa';

// Medium metric configuration (moisture/temp/ec/ph) - same thresholds as GrowLogs
const MEDIUM_METRICS = {
  moisture: { optimal: { min: 40, max: 60 }, warning: { min: 30, max: 70 }, unit: '%' },
  temperature: { optimal: { min: 18, max: 25 }, warning: { min: 15, max: 30 }, unit: '°C' },
  ec: { optimal: { min: 1.0, max: 2.5 }, warning: { min: 0.5, max: 4.0 }, unit: 'mS/cm' },
  ph: { optimal: { min: 5.8, max: 6.5 }, warning: { min: 5.5, max: 7.0 }, unit: '' },
};

const getMetricStatus = (metric, value) => {
  if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
    return 'unknown';
  }
  const numValue = parseFloat(value);
  const config = MEDIUM_METRICS[metric];
  if (!config) return 'unknown';
  if (numValue >= config.optimal.min && numValue <= config.optimal.max) return 'optimal';
  if (numValue >= config.warning.min && numValue <= config.warning.max) return 'warning';
  return 'critical';
};

const getStatusText = (status) => {
  switch (status) {
    case 'optimal': return 'Optimal';
    case 'warning': return 'Warning';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
};

// Formats a numeric value to 2 decimals, null-safe
const formatValue = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const num = parseFloat(v);
  return isNaN(num) ? null : num.toFixed(2);
};

// Converts EC mS/cm to µS/cm when < 1 mS/cm
const formatEC = (v) => {
  if (v === undefined || v === null || v === '') return { value: null, unit: '' };
  const num = parseFloat(v);
  if (isNaN(num)) return { value: null, unit: '' };
  if (num < 1) {
    return { value: (num * 1000).toFixed(1), unit: 'µS/cm' };
  }
  return { value: num.toFixed(2), unit: 'mS/cm' };
};

const safe = (v, unit = '') =>
  (v === null ? 'NO DATA' : `${v}${unit ? ' ' + unit : ''}`);

// Snapshot of a medium (SOIL • N Sensors, moisture/temp/ec/ph) from a
// LogForClient medium-status event. Same rendering as the GrowLogs card.
const MediumStatusCard = ({ data }) => {
  if (!data) return null;

  const ecFormatted = formatEC(data.medium_ec);

  return (
    <MediumContainer>
      <MediumHeader>
        <MediumIcon><FaSeedling /></MediumIcon>
        <div>
          <MediumTitle>Medium Status</MediumTitle>
          <MediumSubtitle>
            {data.medium_type ? data.medium_type.toUpperCase() : 'NO DATA'} • {data.medium_sensors_total ?? 'NO DATA'} Sensors
          </MediumSubtitle>
        </div>
      </MediumHeader>

      <MetricGroups>
        {/* Environmental Metrics */}
        <MetricGroup>
          <MetricCard status={getMetricStatus('moisture', data.medium_moisture)}>
            <MetricHeader>
              <MetricIcon><FaWater /></MetricIcon>
              <MetricLabel>Moisture</MetricLabel>
            </MetricHeader>
            <MetricValue status={getMetricStatus('moisture', data.medium_moisture)}>
              {safe(formatValue(data.medium_moisture), MEDIUM_METRICS.moisture.unit)}
            </MetricValue>
            <MetricStatus status={getMetricStatus('moisture', data.medium_moisture)}>
              {getStatusText(getMetricStatus('moisture', data.medium_moisture))}
            </MetricStatus>
          </MetricCard>

          <MetricCard status={getMetricStatus('temperature', data.medium_temp)}>
            <MetricHeader>
              <MetricIcon><FaThermometerHalf /></MetricIcon>
              <MetricLabel>Temperature</MetricLabel>
            </MetricHeader>
            <MetricValue status={getMetricStatus('temperature', data.medium_temp)}>
              {safe(formatValue(data.medium_temp), MEDIUM_METRICS.temperature.unit)}
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
              <MetricIcon><FaBolt /></MetricIcon>
              <MetricLabel>EC</MetricLabel>
            </MetricHeader>
            <MetricValue status={getMetricStatus('ec', data.medium_ec)}>
              {safe(ecFormatted.value, ecFormatted.unit)}
            </MetricValue>
            <MetricStatus status={getMetricStatus('ec', data.medium_ec)}>
              {getStatusText(getMetricStatus('ec', data.medium_ec))}
            </MetricStatus>
          </MetricCard>

          <MetricCard status={getMetricStatus('ph', data.medium_ph)}>
            <MetricHeader>
              <MetricIcon><FaFlask /></MetricIcon>
              <MetricLabel>pH</MetricLabel>
            </MetricHeader>
            <MetricValue status={getMetricStatus('ph', data.medium_ph)}>
              {safe(formatValue(data.medium_ph))}
            </MetricValue>
            <MetricStatus status={getMetricStatus('ph', data.medium_ph)}>
              {getStatusText(getMetricStatus('ph', data.medium_ph))}
            </MetricStatus>
          </MetricCard>
        </MetricGroup>
      </MetricGroups>

      <SensorStatus>
        <MediumStatusIndicator status="online" />
        <MediumStatusText>{data.medium_sensors_total ?? 'NO DATA'} sensors connected</MediumStatusText>
      </SensorStatus>
    </MediumContainer>
  );
};

export default MediumStatusCard;

// Styling (ported from GrowLogs' medium card)
const MediumContainer = styled.div`
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

  @media (max-width: 1024px) {
    padding: 0.6rem;
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 0.4rem;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    padding: 0.375rem;
    gap: 0.375rem;
    border-radius: 8px;
  }
`;

const MediumHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  @media (max-width: 1024px) {
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  @media (max-width: 768px) {
    gap: 0.375rem;
    margin-bottom: 0.25rem;
  }
`;

const MediumIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
`;

const MediumTitle = styled.h3`
  margin: 0;
  color: #22c55e;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(34, 197, 94, 0.2);

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const MediumSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const MetricGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 1024px) {
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MetricGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;

  @media (max-width: 1024px) {
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.375rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.375rem;
  }
`;

const MetricCard = styled.div`
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

  @media (max-width: 1024px) {
    padding: 0.6rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 0.375rem;
    border-radius: 5px;
  }

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

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.375rem;
    margin-bottom: 0.375rem;
  }
`;

const MetricIcon = styled.div`
  font-size: 1.1rem;
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const MetricValue = styled.div`
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

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const MetricStatus = styled.div`
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

  @media (max-width: 768px) {
    font-size: 0.65rem;
  }
`;

const SensorStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.2);
`;

const MediumStatusIndicator = styled.div`
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

const MediumStatusText = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;
