import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import HistoryChart from '../HistoryChart';
import { getThemeColor } from '../../../utils/themeColors';
import formatLabel from '../../../misc/formatLabel';

const EnergyCard = ({ pause, resume, isPlaying, filterByRoom }) => {
  const { entities, currentRoom } = useHomeAssistant();
  const [energySensors, setEnergySensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);

  useEffect(() => {
    let sensors = Object.entries(entities)
      .filter(([key, entity]) => {
        const rawValue = parseFloat(entity.state);
        const id = key.toLowerCase();

        // Energy sensor patterns
        const energyPatterns = [
          /energy_consumption/,
          /energy_production/,
          /energy_import/,
          /energy_export/,
          /energy_grid/,
          /energy_solar/,
          /energy_battery/,
          /energy_usage/,
          /power_consumption/,
          /power_production/,
          /kwh/,
          /kilowatt/,
        ];

        const matchesSensorType = energyPatterns.some((pattern) => pattern.test(id));

        return (
          key.startsWith('sensor.') &&
          matchesSensorType &&
          !isNaN(rawValue) &&
          rawValue >= 0
        );
      })
      .map(([key, entity]) => {
        const rawValue = parseFloat(entity.state);
        const unit = entity.attributes?.unit_of_measurement || 'kWh';

        return {
          id: key,
          value: rawValue,
          unit: unit,
          friendlyName: formatLabel(entity.attributes?.friendly_name || key, currentRoom, entity.entity_id || key),
          category: key.includes('consumption') || key.includes('import') || key.includes('usage') ? 'consumption' : 'production',
        };
      });

    setEnergySensors(sensors);
  }, [entities, currentRoom]);

  const getColorForValue = (value, unit, category) => {
    const unitLower = unit.toLowerCase();

    // Colors for consumption (red/orange/yellow based on usage)
    if (category === 'consumption') {
      if (unitLower.includes('kwh')) {
        if (value <= 1) return getThemeColor('--chart-success-color');
        if (value > 1 && value <= 5) return getThemeColor('--warning-text-color');
        if (value > 5 && value <= 10) return getThemeColor('--warning-accent-color');
        return getThemeColor('--chart-error-color');
      }
      if (unitLower.includes('w')) {
        if (value <= 100) return getThemeColor('--chart-success-color');
        if (value > 100 && value <= 500) return getThemeColor('--warning-text-color');
        if (value > 500 && value <= 1000) return getThemeColor('--warning-accent-color');
        return getThemeColor('--chart-error-color');
      }
    }

    // Colors for production (green shades)
    if (category === 'production') {
      if (value <= 0) return getThemeColor('--chart-secondary-color');
      if (value > 0 && value <= 1) return getThemeColor('--chart-success-color');
      if (value > 1 && value <= 5) return getThemeColor('--warning-text-color');
      return getThemeColor('--chart-primary-color');
    }

    return 'var(--main-bg-card-color)';
  };

  const formatValue = (value) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(2);
    }
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
  };

  const getDisplayUnit = (value, unit) => {
    const unitLower = unit.toLowerCase();
    if (value >= 1000 && unitLower.includes('wh')) {
      return unitLower.includes('wh') ? 'kWh' : 'kW';
    }
    return unit;
  };

  const getCategoryIcon = (category) => {
    if (category === 'consumption') return '⚡';
    if (category === 'production') return '☀️';
    return '🔌';
  };

  const handleDataBoxClick = (sensorId) => {
    pause();
    setSelectedSensor(sensorId);
  };

  const closeHistoryChart = () => {
    setSelectedSensor(null);
    if (isPlaying) {
      resume();
    }
  };

  const consumptionSensors = energySensors.filter(s => s.category === 'consumption');
  const productionSensors = energySensors.filter(s => s.category === 'production');

  return (
    <CardContainer>
      <Header>
        <h4>⚡ ENERGY MONITOR</h4>
      </Header>
      <Content>
        {consumptionSensors.length > 0 && (
          <>
            <SectionTitle>Consumption (Usage)</SectionTitle>
            {consumptionSensors.map((sensor) => {
              const formattedValue = formatValue(sensor.value);
              const displayUnit = getDisplayUnit(sensor.value, sensor.unit);
              return (
                <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
                  <Label>
                    {getCategoryIcon(sensor.category)} {sensor.friendlyName}
                  </Label>
                  <ValueWrapper>
                    <Value style={{ color: getColorForValue(sensor.value, sensor.unit, sensor.category) }}>
                      {formattedValue}
                    </Value>
                    <Unit>{displayUnit}</Unit>
                  </ValueWrapper>
                </DataBox>
              );
            })}
          </>
        )}

        {productionSensors.length > 0 && (
          <>
            <SectionTitle>Production (Input)</SectionTitle>
            {productionSensors.map((sensor) => {
              const formattedValue = formatValue(sensor.value);
              const displayUnit = getDisplayUnit(sensor.value, sensor.unit);
              return (
                <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
                  <Label>
                    {getCategoryIcon(sensor.category)} {sensor.friendlyName}
                  </Label>
                  <ValueWrapper>
                    <Value style={{ color: getColorForValue(sensor.value, sensor.unit, sensor.category) }}>
                      {formattedValue}
                    </Value>
                    <Unit>{displayUnit}</Unit>
                  </ValueWrapper>
                </DataBox>
              );
            })}
          </>
        )}

        {energySensors.length === 0 && <NoData>No energy sensors found.</NoData>}
      </Content>

      {/* History Chart Modal */}
      {selectedSensor && (
        <ModalOverlay onClick={closeHistoryChart}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <HistoryChart sensorId={selectedSensor} onClose={closeHistoryChart} />
          </ModalContent>
        </ModalOverlay>
      )}
    </CardContainer>
  );
};

export default EnergyCard;

const CardContainer = styled.div``;

const Header = styled.div`
  font-size: 0.8rem;
  color: var(--main-unit-color);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  @media (max-width: 768px) {
    width: 10%;
    transition: color 0.3s ease;
  }
`;

const Content = styled.div``;

const SectionTitle = styled.div`
  font-size: 0.75rem;
  color: var(--second-text-color);
  margin: 0.75rem 0 0.5rem 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const DataBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  min-width: 100%;
  flex-direction: row;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
  margin-top: 0.5rem;
  color: var(--main-text-color);
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    border-left-color: var(--primary-accent);
    transform: translateX(2px);
  }
`;

const ValueWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: var(--main-text-color);
`;

const Value = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
`;

const Unit = styled.div`
  font-size: 0.8rem;
  color: var(--second-text-color);
`;

const NoData = styled.div`
  text-align: center;
  color: var(--second-text-color);
  padding: 2rem;
  font-size: 0.9rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--main-bg-color);
  z-index: 11;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: var(--main-bg-card-color);
  width: 65%;
  height: 65%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;