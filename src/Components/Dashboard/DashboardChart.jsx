import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGlobalState } from '../Context/GlobalContext';
import { FaCannabis } from 'react-icons/fa';

const SensorChart = ({ sensorId, minThreshold = 0, maxThreshold = 2000, title = 'Sensor', unit = '' }) => {
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    return date.toISOString();
  };

  const { srvAddr,currentRoom } = useHomeAssistant();
  const { accessToken } = useGlobalState();

  const [startDate, setStartDate] = useState(getDefaultDate());
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState(() => localStorage.getItem('selectedView') || 'Live');

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

  // Speichere den ausgewählten View im localStorage.
  useEffect(() => {
    localStorage.setItem('selectedView', selectedView);
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
        const xData = sensorData.map(item => item.last_changed);
        const yData = sensorData.map(item => parseFloat(item.state));
        
        const formattedData = yData.map(value => ({
          value,
          itemStyle: { color: value < minThreshold ? 'red' : value > maxThreshold ? 'blue' : 'green' },
        }));
        
        setChartOptions({
          title: {
            text: `${title.toUpperCase()}`,
            subtext: `${currentRoom}`,
            left: 'center',
            textStyle: { color: '#fff', fontSize: 15 },
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0,0,0,0.7)',
            textStyle: { color: '#fff' },
          },
          xAxis: { 
            type: 'category', 
            data: xData,
            axisLine: { lineStyle: { color: '#fff' } },
            axisLabel: { formatter: value => new Date(value).toLocaleTimeString() } 
          },
          yAxis: { 
            type: 'value',
            axisLine: { lineStyle: { color: '#fff' } },
            splitLine: { lineStyle: { color: 'rgba(215,205,205,0.36)' } },
            axisLabel: { color: '#fff' },
           },
          series: [{ 
            data: formattedData, 
            type: 'line', 
            smooth: true,
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(76,175,80,0.8)' },
                  { offset: 1, color: 'rgba(76,175,80,0.2)' },
                ],
              },
            },
            lineStyle: { color: '#4caf50', width: 3 },
            itemStyle: { color: '#4caf50' },
          },
        ],
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        });
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [startDate, endDate, sensorId, srvAddr, accessToken, minThreshold, maxThreshold, selectedView]);

  return (
    <ChartWrapper>
      <ChartMenu>
        {['Live', '12h', 'daily', 'weekly'].map(view => (
          <ViewButton
            key={view}
            $isActive={selectedView === view}
            onClick={() => setSelectedView(view)}
          >
            {view}
          </ViewButton>
        ))}
      </ChartMenu>
      <Chart>
        {loading ? (
          <LoadingWrapper>
            Smoking Data <LoadingIcon />
          </LoadingWrapper>
        ) : chartOptions ? (
          <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
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
  padding: 1rem;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
  width: 100%;
  height: 100%;
  min-height: 400px;
  @media (max-width: 768px) {
    min-height: 300px;
  }
`;

const ChartMenu = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ViewButton = styled.button`
  background: ${props => (props.$isActive ? 'var(--primary-button-color)' : '#333')};
  color: var(--main-text-color);
  border: none;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  &:hover {
    background: var(--primary-button-color);
  }
`;

const Chart = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
  .echarts-for-react {
    min-height: 300px;
    @media (max-width: 768px) {
      min-height: 250px;
    }
  }
`;

const Message = styled.p`
  text-align: center;
  color: red;
`;

const bounce = keyframes`
  0% {
    color:rgba(89, 233, 28, 0.79);
    transform: translateY(0);
  }
  50% {
      color:rgba(229, 218, 21, 0.83);
    transform: translateY(-10px);
  }
  100% {
      color:rgba(228, 168, 16, 0.84);
    transform: translateY(0);
  }
`;

const LoadingIcon = styled(FaCannabis)`
  animation: ${bounce} 1s infinite;
  color: green;
  margin-left:1rem;
  font-size: 2rem;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;
