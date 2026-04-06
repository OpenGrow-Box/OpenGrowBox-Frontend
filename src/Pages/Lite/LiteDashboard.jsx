import { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import BottomBar from '../../Components/Navigation/LiteBottomBar';
import DashboardTitle from '../../Components/Dashboard/DashboardTitle';
import { useHomeAssistant } from '../../Components/Context/HomeAssistantContext';
import { Thermometer, Droplets, Gauge, Clock } from 'lucide-react';

const getThemeColor = (varName) => {
  if (typeof window === 'undefined') return '#00ff88';
  try {
    const computedStyle = window.getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue(varName).trim() || '#00ff88';
  } catch (e) {
    return '#00ff88';
  }
};

// Lazy load echarts to avoid issues
const ChartLazyWrapper = ({ sensorId, title, color, unit }) => {
  const [ChartComponent, setChartComponent] = useState(null);
  
  useEffect(() => {
    import('echarts-for-react').then((module) => {
      setChartComponent(() => module.default);
    }).catch(err => {
      console.error('Failed to load chart:', err);
    });
  }, []);
  
  if (!ChartComponent) {
    return <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--placeholder-text-color)' }}>Loading chart...</div>;
  }
  
  return <SimpleChartInner sensorId={sensorId} title={title} color={color} unit={unit} ReactECharts={ChartComponent} />;
};

const SimpleChartInner = ({ sensorId, title, color, unit, ReactECharts }) => {
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('12h');
  const { haApiBaseUrl, haToken: token } = useHomeAssistant();
  const [loading, setLoading] = useState(true);
  const [currentValue, setCurrentValue] = useState('--');
  const [stats, setStats] = useState({ min: '--', max: '--', avg: '--' });

  const getTimeRangeMs = (range) => {
    switch(range) {
      case '6h': return 6 * 60 * 60 * 1000;
      case '12h': return 12 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      default: return 12 * 60 * 60 * 1000;
    }
  };

  useEffect(() => {
    const fetchHistoryData = async () => {
      setLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date(Date.now() - getTimeRangeMs(timeRange));
        
        const startStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
        const endStr = endDate.toISOString().slice(0, 19).replace('T', ' ');
        
        const baseUrl = haApiBaseUrl || '';
        const url = `${baseUrl}/api/history/period/${encodeURIComponent(startStr)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endStr)}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        const sensorData = data && data.length > 0 ? data[0] : [];
        
        // Get current value (latest)
        if (sensorData.length > 0) {
          const latest = sensorData[sensorData.length - 1];
          setCurrentValue(parseFloat(latest.state).toFixed(1));
        }
        
        // Calculate stats
        const values = sensorData.map(item => parseFloat(item.state)).filter(v => !isNaN(v));
        if (values.length > 0) {
          const min = Math.min(...values).toFixed(1);
          const max = Math.max(...values).toFixed(1);
          const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
          setStats({ min, max, avg });
        }
        
        // Sample data for smoother chart (max 50 points)
        const sampledData = sampleData(sensorData, 50);
        
        const xData = sampledData.map(item => {
          const date = new Date(item.last_changed);
          return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        });
        const yData = sampledData.map(item => parseFloat(item.state));
        
        setChartData({ xData, yData });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [sensorId, haApiBaseUrl, token, timeRange]);

  const sampleData = (data, maxPoints) => {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  };

  const getOption = () => ({
    backgroundColor: 'transparent',
    grid: { top: 10, right: 10, bottom: 30, left: 45 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: color,
      borderWidth: 1,
      textStyle: { 
        color: '#f1f5f9',
        fontSize: 11
      },
      formatter: (params) => {
        const p = params[0];
        return `<div style="padding:4px"><div style="color:${color};font-weight:600">${p.value} ${unit}</div><div style="color:#94a3b8;font-size:10px">${p.name}</div></div>`;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData?.xData || [],
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisTick: { show: false },
      axisLabel: { 
        color: '#64748b', 
        fontSize: 9,
        interval: 'auto'
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    series: [{
      data: chartData?.yData || [],
      type: 'line',
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { color: color, width: 2.5 },
      itemStyle: { color: color },
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
    animationDuration: 800,
  });

  return (
    <ChartCard>
      <ChartHeader>
        <ChartTitleRow>
          <ChartTitle>{title}</ChartTitle>
        </ChartTitleRow>
        <CurrentValue style={{ color: color }}>{currentValue}{unit}</CurrentValue>
      </ChartHeader>
      
      <TimeRangeSelector>
        {['6h', '12h', '24h'].map(range => (
          <TimeRangeButton 
            key={range} 
            $active={timeRange === range}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </TimeRangeButton>
        ))}
      </TimeRangeSelector>

      <ChartWrapper>
        {loading ? (
          <ChartLoading>Loading...</ChartLoading>
        ) : (
          ReactECharts ? <ReactECharts option={getOption()} style={{ height: '120px', width: '100%' }} /> : <ChartLoading>Chart unavailable</ChartLoading>
        )}
      </ChartWrapper>

      <StatsRow>
        <StatItem>
          <StatLabel>Min</StatLabel>
          <StatValue style={{ color: '#38bdf8' }}>{stats.min}{unit}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Avg</StatLabel>
          <StatValue style={{ color: '#fbbf24' }}>{stats.avg}{unit}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Max</StatLabel>
          <StatValue style={{ color: '#f87171' }}>{stats.max}{unit}</StatValue>
        </StatItem>
      </StatsRow>
    </ChartCard>
  );
};

const ChartCard = styled.div`
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartIcon = styled.div`
  color: var(--primary-accent);
  display: flex;
  align-items: center;
`;

const ChartTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const CurrentValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const TimeRangeButton = styled.button`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--glass-bg-secondary)'};
  color: ${props => props.$active ? 'white' : 'var(--placeholder-text-color)'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--active-bg-color)'};
  }
`;

const ChartWrapper = styled.div`
  min-height: 120px;
`;

const ChartLoading = styled.div`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--placeholder-text-color);
  font-size: 0.9rem;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid var(--glass-border);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
`;

const LiteDashboard = () => {
  const { HASS, currentRoom, entities } = useHomeAssistant();

  const sensorIds = useMemo(() => {
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    return {
      vpd: `sensor.ogb_currentvpd_${room}`,
      temperature: `sensor.ogb_avgtemperature_${room}`,
      humidity: `sensor.ogb_avghumidity_${room}`
    };
  }, [currentRoom]);

  const getSensorValue = (entityId, unit = '') => {
    if (!entities) return '--';
    const entity = entities[entityId];
    if (!entity) return '--';
    const value = entity.state;
    return value !== undefined && value !== null ? `${value}${unit}` : '--';
  };

  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="Lite" secondText="Dash" thirdText="board"/>
      </ContainerHeader>

      <Content>
        <OverviewSection>
          <OverviewTitle>Current Status</OverviewTitle>
          <OverviewGrid>
            <OverviewCard>
              <CardIcon>
                <Thermometer size={32} />
              </CardIcon>
              <OverviewValueGroup>
                <LargeValue>{getSensorValue(sensorIds.temperature, '°C')}</LargeValue>
                <LargeLabel>Avg Temperature</LargeLabel>
              </OverviewValueGroup>
            </OverviewCard>
            <OverviewCard>
              <CardIcon>
                <Droplets size={32} />
              </CardIcon>
              <OverviewValueGroup>
                <LargeValue>{getSensorValue(sensorIds.humidity, '%')}</LargeValue>
                <LargeLabel>Avg Humidity</LargeLabel>
              </OverviewValueGroup>
            </OverviewCard>
          </OverviewGrid>
        </OverviewSection>

        <DetailsSection>
          <DetailsTitle>Sensor Details</DetailsTitle>
          <DetailGrid>
            <DetailCard>
              <DetailIcon>
                <Thermometer size={24} />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Avg Temperature</DetailLabel>
                <DetailValue>{getSensorValue(sensorIds.temperature, '°C')}</DetailValue>
              </DetailContent>
            </DetailCard>
            <DetailCard>
              <DetailIcon>
                <Droplets size={24} />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Avg Humidity</DetailLabel>
                <DetailValue>{getSensorValue(sensorIds.humidity, '%')}</DetailValue>
              </DetailContent>
            </DetailCard>
            <DetailCard>
              <DetailIcon>
                <Gauge size={24} />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>VPD</DetailLabel>
                <DetailValue>{getSensorValue(sensorIds.vpd, ' kPa')}</DetailValue>
              </DetailContent>
            </DetailCard>
          </DetailGrid>
        </DetailsSection>

        <ChartsSection>
          <ChartsTitle>24h History</ChartsTitle>
          <ChartsGrid>
            <ChartLazyWrapper 
              sensorId={sensorIds.temperature} 
              title="Temperature" 
              color={getThemeColor('--chart-primary-color')} 
              unit="°C" 
            />
            <ChartLazyWrapper 
              sensorId={sensorIds.humidity} 
              title="Humidity" 
              color={getThemeColor('--chart-success-color')} 
              unit="%" 
            />
            <ChartLazyWrapper 
              sensorId={sensorIds.vpd} 
              title="VPD" 
              color={getThemeColor('--chart-warning-color')} 
              unit="kPa" 
            />
          </ChartsGrid>
        </ChartsSection>
      </Content>

      <BottomBar />
    </MainContainer>
  );
};

export default LiteDashboard;

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

const OverviewSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  box-shadow: var(--main-shadow-art);
`;

const OverviewTitle = styled.h3`
  color: var(--main-text-color);
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const OverviewCard = styled.div`
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const CardIcon = styled.div`
  color: var(--primary-accent);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LargeValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--main-text-color);
`;

const LargeLabel = styled.div`
  font-size: 0.85rem;
  color: var(--placeholder-text-color);
  font-weight: 500;
`;

const OverviewValueGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DetailsSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--main-shadow-art);
`;

const DetailsTitle = styled.h3`
  color: var(--main-text-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const DetailCard = styled.div`
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DetailIcon = styled.div`
  color: var(--primary-accent);
  flex-shrink: 0;
`;

const DetailContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DetailLabel = styled.div`
  font-size: 0.9rem;
  color: var(--placeholder-text-color);
`;

const DetailValue = styled.div`
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const ChartsSection = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--main-shadow-art);
`;

const ChartsTitle = styled.h3`
  color: var(--main-text-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const ChartContainer = styled.div`
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ChartPlaceholder = styled.div`
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--placeholder-text-color);
  font-size: 0.9rem;
`;
