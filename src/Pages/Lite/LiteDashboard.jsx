import { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import BottomBar from '../../Components/Navigation/BottomBar';
import DashboardTitle from '../../Components/Dashboard/DashboardTitle';
import { useHomeAssistant } from '../../Components/Context/HomeAssistantContext';
import { Thermometer, Droplets, Gauge, Wind } from 'lucide-react';

const getThemeColor = (varName) => {
  if (typeof window === 'undefined') return 'rgba(30, 30, 30, 0.95)';
  try {
    const computedStyle = window.getComputedStyle(document.documentElement);
    const value = computedStyle.getPropertyValue(varName).trim();
    if (value && value !== '#000' && value !== '#fff') return value;
    return 'rgba(30, 30, 30, 0.95)';
  } catch (e) {
    return 'rgba(30, 30, 30, 0.95)';
  }
};

// Hardcoded distinct colors for each sensor type - guaranteed to be different
const SENSOR_COLORS = {
  temperature: '#f97316', // Orange for temperature
  humidity: '#3b82f6',    // Blue for humidity
  vpd: '#22c55e',         // Green for VPD
  co2: '#a855f7',         // Purple for CO2
  default: '#14b8a6'      // Teal default
};

const getSensorThemeColor = (sensorType) => {
  return SENSOR_COLORS[sensorType] || SENSOR_COLORS.default;
};

// Minimalist Chart Component
const MinimalChart = ({ sensorId, title, sensorType, unit }) => {
  const [ChartComponent, setChartComponent] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [currentValue, setCurrentValue] = useState('--');
  const [loading, setLoading] = useState(true);
  const { haApiBaseUrl, haToken: token } = useHomeAssistant();

  const color = getSensorThemeColor(sensorType);

  useEffect(() => {
    import('echarts-for-react').then((module) => {
      setChartComponent(() => module.default);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !sensorId) return;
      setLoading(true);
      
      try {
        const endDate = new Date();
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const url = `${haApiBaseUrl || ''}/api/history/period/${startDate.toISOString()}?filter_entity_id=${sensorId}&end_time=${endDate.toISOString()}`;
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed');
        
        const data = await response.json();
        const sensorData = data?.[0] || [];
        
        if (sensorData.length > 0) {
          setCurrentValue(parseFloat(sensorData[sensorData.length - 1].state).toFixed(1));
        }
        
        // Sample to 30 points max
        const step = Math.ceil(sensorData.length / 30);
        const sampled = sensorData.filter((_, i) => i % step === 0).slice(-30);
        
        // Format time labels properly
        const formatTime = (dateStr) => {
          const date = new Date(dateStr);
          const now = new Date();
          const isToday = date.toDateString() === now.toDateString();
          if (isToday) {
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          }
          return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        };

        const formatTooltipTime = (dateStr) => {
          const date = new Date(dateStr);
          return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        };
        
        setChartData({
          x: sampled.map(item => formatTime(item.last_changed)),
          y: sampled.map(item => parseFloat(item.state)),
          tooltipTime: sampled.map(item => formatTooltipTime(item.last_changed))
        });
      } catch (err) {
        // console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [sensorId, haApiBaseUrl, token]);

  const getOption = () => {
    const textColor = getThemeColor('--main-text-color');
    const gridColor = getThemeColor('--glass-border');
    
    return {
      backgroundColor: 'transparent',
      grid: { top: 5, right: 5, bottom: 20, left: 35 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 15, 15, 0.95)',
        borderColor: color,
        borderWidth: 2,
        textStyle: { color: '#ffffff', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 8px;',
        formatter: (p) => {
          const index = p?.[0]?.dataIndex ?? 0;
          const time = chartData?.tooltipTime?.[index] || chartData?.x?.[index] || '';
          return `
            <div style="display:flex; flex-direction:column; gap:4px; min-width:90px;">
              <div style="color:rgba(255,255,255,0.72); font-size:11px;">${time}</div>
              <div style="color:${color}; font-weight:700; font-size:14px;">${p[0].value}${unit}</div>
            </div>
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: chartData?.x || [],
        axisLine: { show: true, lineStyle: { color: gridColor } },
        axisTick: { show: false },
        axisLabel: { 
          color: '#888888', 
          fontSize: 11,
          interval: 0,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { 
          lineStyle: { color: gridColor + '30', type: 'dashed' } 
        },
        axisLabel: { 
          color: textColor + '60', 
          fontSize: 9,
          formatter: (v) => Math.round(v)
        }
      },
      series: [{
        data: chartData?.y || [],
        type: 'line',
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { 
          color: color, 
          width: 2 
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' }
            ]
          }
        }
      }],
      animation: true,
      animationDuration: 1000
    };
  };

  const getIcon = () => {
    switch (sensorType) {
      case 'temperature': return <Thermometer size={20} />;
      case 'humidity': return <Droplets size={20} />;
      case 'vpd': return <Gauge size={20} />;
      case 'co2': return <Wind size={20} />;
      default: return null;
    }
  };

  return (
    <MinimalChartCard>
      <MinimalChartHeader>
        <ChartTitleRow>
          <ChartIcon style={{ color }}>{getIcon()}</ChartIcon>
          <MinimalChartTitle>{title}</MinimalChartTitle>
        </ChartTitleRow>
        <MinimalCurrentValue style={{ color }}>{currentValue}{unit}</MinimalCurrentValue>
      </MinimalChartHeader>
      
      <MinimalChartBody>
        {loading || !ChartComponent ? (
          <MinimalLoading>Loading...</MinimalLoading>
        ) : (
          <ChartComponent 
            option={getOption()} 
            style={{ height: '100px', width: '100%' }}
          />
        )}
      </MinimalChartBody>
    </MinimalChartCard>
  );
};

const LiteDashboard = () => {
  const { currentRoom, entities } = useHomeAssistant();

  const sensorIds = useMemo(() => {
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    return {
      vpd: `sensor.ogb_currentvpd_${room}`,
      temperature: `sensor.ogb_avgtemperature_${room}`,
      humidity: `sensor.ogb_avghumidity_${room}`
    };
  }, [currentRoom]);

  // Find CO2 sensors dynamically (same as PRO mode)
  const co2Sensor = useMemo(() => {
    if (!entities) return null;
    
    const co2Sensors = Object.entries(entities)
      .filter(([key, entity]) => {
        if (!entity || typeof entity.state === 'undefined') return false;
        const isSensor = key.startsWith('sensor.');
        const hasCo2InName = key.toLowerCase().includes('co2') ||
                           key.toLowerCase().includes('carbon') ||
                           key.toLowerCase().includes('co₂');
        const hasValidValue = !isNaN(parseFloat(entity.state));
        return isSensor && hasCo2InName && hasValidValue;
      })
      .map(([key, entity]) => ({
        id: key,
        entity_id: entity.entity_id || key,
        unit: entity.attributes?.unit_of_measurement || 'ppm'
      }));
    
    return co2Sensors.length > 0 ? co2Sensors[0] : null;
  }, [entities]);

  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="Lite" secondText="Dash" thirdText="board"/>
      </ContainerHeader>

      <Content>
        <ChartsSection>
          <SectionTitle>Sensor Overview</SectionTitle>
          <ChartsGrid>
            <MinimalChart 
              sensorId={sensorIds.vpd}
              title="VPD"
              sensorType="vpd"
              unit="kPa"
            />
            <MinimalChart 
              sensorId={sensorIds.temperature}
              title="Temperature"
              sensorType="temperature"
              unit="°C"
            />
            <MinimalChart 
              sensorId={sensorIds.humidity}
              title="Humidity"
              sensorType="humidity"
              unit="%"
            />
            {co2Sensor && (
              <MinimalChart 
                sensorId={co2Sensor.entity_id}
                title="CO2"
                sensorType="co2"
                unit={co2Sensor.unit}
              />
            )}
          </ChartsGrid>
        </ChartsSection>
      </Content>

      <BottomBar />
    </MainContainer>
  );
};

export default LiteDashboard;

// Styled Components - Minimalist Design
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChartsSection = styled.div`
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 1.25rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--main-text-color);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ChartsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MinimalChartCard = styled.div`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1rem;
`;

const MinimalChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MinimalChartTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MinimalCurrentValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

const MinimalChartBody = styled.div`
  height: 100px;
`;

const MinimalLoading = styled.div`
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
`;
