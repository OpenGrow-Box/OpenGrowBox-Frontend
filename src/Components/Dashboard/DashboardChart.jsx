import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useGlobalState } from '../Context/GlobalContext';
import { FaLeaf } from 'react-icons/fa';
import { formatTime, formatDateTime } from '../../misc/formatDateTime';

const SensorChart = ({ sensorId, minThreshold = 0, maxThreshold = 2500, title = 'Sensor Trends (24h)', unit = '' }) => {
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const { state } = useGlobalState();
  const srvAddr = state?.Conf?.hassServer;
  const accessToken = state?.Conf?.haToken;

  const [startDate, setStartDate] = useState(getDefaultDate());
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState(() => localStorage.getItem('selectedView') || '12h');

  // Handler für View-Änderung
  const handleViewChange = (view) => {
    setSelectedView(view);
    localStorage.setItem('selectedView', view);
  };

  // Aktualisiere startDate und endDate, wenn der View geändert wird.
  useEffect(() => {
    if (selectedView === 'Live') {
      setStartDate(getDefaultDate());
    } else if (selectedView === '12h') {
      setStartDate(getDefaultDate(-12 * 60 * 60 * 1000));
    } else if (selectedView === 'daily') {
      setStartDate(getDefaultDate(-24 * 60 * 60 * 1000));
    } else if (selectedView === 'weekly') {
      setStartDate(getDefaultDate(-7 * 24 * 60 * 60 * 1000));
    }
    setEndDate(getDefaultDate());
  }, [selectedView]);

  // Im Live-Modus: Aktualisiere endDate regelmäßig ohne den Ladezustand (wenn bereits Chart-Daten vorhanden sind).
  useEffect(() => {
    if (selectedView !== 'Live') return;
    const interval = setInterval(() => {
      setEndDate(getDefaultDate());
    }, 5000); // Aktualisierung alle 5 Sekunden, anpassbar.
    return () => clearInterval(interval);
  }, [selectedView]);

  // Hole die historischen Daten.
  useEffect(() => {
    const fetchHistoryData = async () => {
      // Nur laden anzeigen, wenn nicht im Live-Modus mit bereits geladenen Daten.
      if (selectedView !== 'Live' || !chartOptions) {
        setLoading(true);
      }
      setError(null);
      try {
        const url = `${srvAddr}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endDate)}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        
        const data = await response.json();
        const sensorData = data?.[0] || [];
        const xData = sensorData.map(item => new Date(item.last_changed).toISOString());
        const yData = sensorData.map(item => parseFloat(item.state));
        
        setChartOptions({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(20, 20, 40, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            textStyle: { 
              color: '#fff',
              fontSize: 12
            },
            axisPointer: { 
              type: 'cross',
              crossStyle: {
                color: 'rgba(255, 255, 255, 0.3)'
              }
            },
            formatter: params => {
              const point = params[0];
              const time = formatTime(point.axisValue);
              return `
                <div style="color:white; font-size: 12px;">
                  <strong>${time}</strong><br/>
                  <span style="color: #4FC3F7;">● ${point.seriesName}: ${point.data}${unit}</span>
                </div>
              `;
            }
          },
          grid: { 
            left: '8%', 
            right: '5%', 
            bottom: '15%', 
            top: '15%',
            containLabel: true,
            backgroundColor: 'transparent'
          },
          xAxis: {
            type: 'category',
            data: xData,
            boundaryGap: false,
            axisLine: { 
              show: false
            },
            axisTick: {
              show: false
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 10,
              margin: 15,
              formatter: value => {
                const date = formatDateTime(value);
                return date;
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.05)',
                type: 'dashed'
              }
            }
          },
          yAxis: {
            type: 'value',
            axisLine: { 
              show: false
            },
            axisTick: {
              show: false
            },
            splitLine: { 
              lineStyle: { 
                color: 'rgba(255, 255, 255, 0.05)',
                type: 'dashed'
              } 
            },
            axisLabel: { 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 10
            }
          },
          series: [{
            name: title.replace(' (24h)', ''),
            data: yData,
            type: 'line',
            smooth: true,
            smoothMonotone: 'x',
            lineStyle: {
              width: 3,
              color: '#4FC3F7',
              shadowColor: 'rgba(79, 195, 247, 0.3)',
              shadowBlur: 8,
              shadowOffsetY: 2
            },
            symbol: 'none',
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0,
                  color: 'rgba(79, 195, 247, 0.4)'
                }, {
                  offset: 0.5,
                  color: 'rgba(79, 195, 247, 0.2)'
                }, {
                  offset: 1,
                  color: 'rgba(79, 195, 247, 0.05)'
                }]
              }
            },
            emphasis: {
              focus: 'series',
              lineStyle: {
                width: 4
              }
            }
          }]
        });
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [startDate, endDate, sensorId, srvAddr, accessToken, minThreshold, maxThreshold, selectedView, title, unit]);

  return (
    <ChartWrapper>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        <ChartMenu>
          {['Live', '12h', 'daily', 'weekly'].map(view => (
            <ViewButton
              key={view}
              $isActive={selectedView === view}
              onClick={() => handleViewChange(view)}
            >
              {view}
            </ViewButton>
          ))}
        </ChartMenu>
      </ChartHeader>
      
      <Chart>
        {loading ? (
          <LoadingWrapper>
            <LoadingText>Loading Data</LoadingText>
            <LoadingIcon />
          </LoadingWrapper>
        ) : chartOptions ? (
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          !loading && <Message>No Data Available</Message>
        )}
      </Chart>
    </ChartWrapper>
  );
};

export default SensorChart;

const ChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1rem;
  background: var(--main-bg-card-color);
  border-radius: 16px;
  box-shadow: var(--main-shadow-art);
  width: 100%;
  height: 100%;
  min-height: 15rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(79, 195, 247, 0.02) 0%, 
      rgba(156, 39, 176, 0.02) 50%, 
      rgba(63, 81, 181, 0.02) 100%);
    pointer-events: none;
    z-index: 0;
  }
  
  @media (max-width: 768px) {
    min-height: 22rem;
    padding: 1rem;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
`;

const ChartTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ChartMenu = styled.div`
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.25rem;
  backdrop-filter: blur(10px);
`;

const ViewButton = styled.button`
  background: ${props => (props.$isActive ? 'var(--primary-button-color)' : 'transparent')};
  color: var(--main-text-color);
  border: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    background: var(--primary-button-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Chart = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
  z-index: 1;
  border-radius: 12px;
  overflow: hidden;
  
  .echarts-for-react {
    min-height: 15rem;
    border-radius: 12px;
    
    @media (max-width: 768px) {
      min-height: 12rem;
    }
  }
`;

const Message = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 2rem 0;
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  40% {
    transform: translateY(-10px) rotate(10deg);
  }
  60% {
    transform: translateY(-5px) rotate(-5deg);
  }
`;

const glow = keyframes`
  0%, 100% {
    color: rgba(79, 195, 247, 0.8);
    filter: drop-shadow(0 0 5px rgba(79, 195, 247, 0.5));
  }
  50% {
    color: rgba(156, 39, 176, 0.8);
    filter: drop-shadow(0 0 8px rgba(156, 39, 176, 0.6));
  }
`;

const LoadingIcon = styled(FaLeaf)`
  animation: ${bounce} 2s infinite, ${glow} 3s infinite;
  margin-left: 0.5rem;
  font-size: 1.5rem;
`;

const LoadingText = styled.span`
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 500;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex-direction: row;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
`;