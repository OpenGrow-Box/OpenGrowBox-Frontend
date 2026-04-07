import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';
import { FaExclamationTriangle, FaSpinner, FaChartLine, FaArrowUp, FaArrowDown, FaEquals, FaExpand, FaCompress, FaChartBar, FaChartArea, FaDownload } from 'react-icons/fa';
import { Maximize2, Minimize2, BarChart3, AreaChart, LineChart, Download } from 'lucide-react';

// Professional chart with advanced features
const SensorChart = ({ 
  sensorId, 
  minThreshold = 0, 
  maxThreshold = 2500, 
  title = 'Sensor Trends', 
  unit = '', 
  priority = 'medium'
}) => {
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
  };

  const { haApiBaseUrl, haToken: accessToken } = useHomeAssistant();
  const isDev = import.meta.env.DEV;
  const HISTORY_FETCH_TIMEOUT_MS = 15000;

  const [startDate, setStartDate] = useState(getDefaultDate(-24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('24h');
  const [stats, setStats] = useState({ current: '--', min: '--', max: '--', avg: '--', trend: 'stable' });
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChartMenu, setShowChartMenu] = useState(false);
  const chartRef = useRef(null);

  const handleViewChange = (view) => {
    setSelectedView(view);
    const hours = view === 'Live' ? 1 : view === '6h' ? 6 : view === '12h' ? 12 : view === '24h' ? 24 : 168;
    setStartDate(getDefaultDate(-hours * 60 * 60 * 1000));
  };

  useEffect(() => {
    const fetchHistoryData = async () => {
      if ((!isDev && !haApiBaseUrl) || !accessToken || !sensorId) {
        setError('Connection not configured');
        return;
      }

      setLoading(true);
      setError(null);
      let timeoutId;

      try {
        const url = `${haApiBaseUrl || ''}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${sensorId}&end_time=${encodeURIComponent(endDate)}&minimal_response`;
        
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), HISTORY_FETCH_TIMEOUT_MS);
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          signal: controller.signal
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        clearTimeout(timeoutId);

        if (!Array.isArray(data) || data.length === 0 || !data[0]?.length) {
          setChartOptions(null);
          setLoading(false);
          return;
        }

        const sensorData = data[0];
        const values = sensorData.map(item => parseFloat(item.state)).filter(v => !isNaN(v));
        
        // Calculate stats
        const current = values[values.length - 1];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        // Calculate trend
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'stable';
        
        setStats({
          current: current.toFixed(1),
          min: min.toFixed(1),
          max: max.toFixed(1),
          avg: avg.toFixed(1),
          trend
        });

        // Prepare chart data
        const xData = sensorData.map(item => item.last_changed);
        const yData = sensorData.map(item => parseFloat(item.state));

        // Get colors - different colors for different sensor types (using theme colors)
        const textColor = getThemeColor('--main-text-color');
        const secondaryTextColor = getThemeColor('--second-text-color');
        const gridColor = getThemeColor('--glass-border');
        
        // Define sensor type colors - using theme CSS variables for consistency
        const getSensorColor = (sensorTitle) => {
          const titleLower = (sensorTitle || '').toLowerCase();
          if (titleLower.includes('vpd') || titleLower.includes('temp') || titleLower.includes('temperature')) return getThemeColor('--chart-success-color');
          if (titleLower.includes('hum') || titleLower.includes('humidity')) return getThemeColor('--chart-primary-color');
          if (titleLower.includes('co2') || titleLower.includes('co₂')) return '#a855f7';
          if (titleLower.includes('ph')) return getThemeColor('--chart-success-color');
          if (titleLower.includes('ec') || titleLower.includes('tds')) return getThemeColor('--chart-secondary-color');
          if (titleLower.includes('water') || titleLower.includes('tank') || titleLower.includes('reservoir')) return getThemeColor('--chart-primary-color');
          return getThemeColor('--primary-accent');
        };
        
        const accentColor = getSensorColor(title);

        setChartOptions({
          backgroundColor: 'transparent',
          grid: { top: 40, right: 20, bottom: 60, left: 60 },
          tooltip: {
            trigger: 'axis',
            backgroundColor: getThemeColor('--main-bg-card-color'),
            borderColor: accentColor,
            borderWidth: 1,
            padding: [12, 16],
            textStyle: { color: textColor, fontSize: 13 },
            formatter: (params) => {
              const p = params[0];
              const date = formatDateTime(p.axisValue);
              return `
                <div style="font-weight:600;margin-bottom:4px">${date}</div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accentColor}"></span>
                  <span style="font-size:16px;font-weight:700">${p.value} ${unit}</span>
                </div>
              `;
            }
          },
          dataZoom: [{
            type: 'inside',
            start: 0,
            end: 100
          }],
          xAxis: {
            type: 'category',
            data: xData,
            boundaryGap: false,
            axisLine: { lineStyle: { color: gridColor } },
            axisLabel: {
              color: secondaryTextColor,
              fontSize: 11,
              formatter: (value) => {
                const date = new Date(value);
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                if (isToday) {
                  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
                return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              }
            },
            splitLine: { show: false }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { 
              color: secondaryTextColor, 
              fontSize: 11,
              formatter: (value) => {
                if (Math.abs(value) >= 1000) {
                  return (value / 1000).toFixed(1) + 'k';
                }
                return value.toFixed(1);
              }
            },
            splitLine: { lineStyle: { color: gridColor + '30', type: 'dashed' } }
          },
          series: [{
            name: title,
            data: yData,
            type: chartType,
            smooth: 0.3,
            symbol: chartType === 'line' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' ? 4 : 8,
            showSymbol: chartType === 'line' ? false : true,
            sampling: 'lttb',
            itemStyle: chartType === 'bar' ? {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: accentColor },
                  { offset: 1, color: accentColor + '80' }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            } : { color: accentColor },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: accentColor,
              shadowColor: accentColor + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'area' ? {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: accentColor + '50' },
                  { offset: 0.5, color: accentColor + '20' },
                  { offset: 1, color: accentColor + '05' }
                ]
              }
            } : null,
            barWidth: chartType === 'bar' ? '60%' : undefined,
            markLine: chartType !== 'bar' ? {
              silent: true,
              symbol: 'none',
              lineStyle: { color: getThemeColor('--chart-error-color'), type: 'dashed', width: 2 },
              data: [
                ...(minThreshold !== undefined ? [{
                  yAxis: minThreshold,
                  label: { formatter: `Min ${minThreshold}`, color: getThemeColor('--chart-error-color') }
                }] : []),
                ...(maxThreshold !== undefined ? [{
                  yAxis: maxThreshold,
                  label: { formatter: `Max ${maxThreshold}`, color: getThemeColor('--chart-error-color') }
                }] : [])
              ]
            } : undefined,
            markPoint: chartType !== 'bar' ? {
              data: [
                { type: 'max', name: 'Max', symbol: 'pin', symbolSize: 40, itemStyle: { color: getThemeColor('--chart-success-color') } },
                { type: 'min', name: 'Min', symbol: 'pin', symbolSize: 40, itemStyle: { color: getThemeColor('--chart-error-color') } }
              ],
              label: { fontSize: 10, fontWeight: 'bold' }
            } : undefined
          }]
        });
      } catch (err) {
        // console.error('Chart error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    fetchHistoryData();
  }, [startDate, endDate, sensorId, haApiBaseUrl, accessToken, minThreshold, maxThreshold, title, unit, chartType]);

  const getTrendIcon = () => {
    if (stats.trend === 'up') return <FaArrowUp style={{ color: getThemeColor('--chart-success-color') }} />;
    if (stats.trend === 'down') return <FaArrowDown style={{ color: getThemeColor('--chart-error-color') }} />;
    return <FaEquals style={{ color: getThemeColor('--second-text-color') }} />;
  };

  if (error) {
    return (
      <ChartCard>
        <ErrorState>
          <FaExclamationTriangle size={32} />
          <div>Failed to load data</div>
        </ErrorState>
      </ChartCard>
    );
  }

  return (
    <ChartCard $fullscreen={isFullscreen}>
      <ChartHeader>
        <HeaderLeft>
          <ChartTitleRow>
            <ChartTitle>{title}</ChartTitle>
            <ChartMenuButton onClick={() => setShowChartMenu(!showChartMenu)}>
              <span style={{ fontSize: '1.2rem' }}>⋮</span>
            </ChartMenuButton>
          </ChartTitleRow>
          {showChartMenu && (
            <ChartMenu>
              <ChartMenuSection>
                <ChartMenuLabel>Chart Type</ChartMenuLabel>
                <ChartTypeButtons>
                  <ChartTypeBtn $active={chartType === 'line'} onClick={() => setChartType('line')} title="Line">
                    <LineChart size={14} />
                  </ChartTypeBtn>
                  <ChartTypeBtn $active={chartType === 'area'} onClick={() => setChartType('area')} title="Area">
                    <AreaChart size={14} />
                  </ChartTypeBtn>
                  <ChartTypeBtn $active={chartType === 'bar'} onClick={() => setChartType('bar')} title="Bar">
                    <BarChart3 size={14} />
                  </ChartTypeBtn>
                </ChartTypeButtons>
              </ChartMenuSection>
            </ChartMenu>
          )}
          <TimeSelector>
            {['Live', '6h', '12h', '24h', '7d'].map(view => (
              <TimeButton
                key={view}
                $active={selectedView === view}
                onClick={() => handleViewChange(view)}
              >
                {view}
              </TimeButton>
            ))}
          </TimeSelector>
        </HeaderLeft>
        <HeaderRight>
          <CurrentValue>
            <ValueNumber>{stats.current}</ValueNumber>
            <ValueUnit>{unit}</ValueUnit>
            <TrendIndicator>{getTrendIcon()}</TrendIndicator>
          </CurrentValue>
          <FullscreenBtn onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </FullscreenBtn>
        </HeaderRight>
      </ChartHeader>

      <StatsBar>
        <StatBox>
          <StatLabel>Min</StatLabel>
          <StatValue style={{ color: getThemeColor('--chart-error-color') }}>{stats.min}{unit}</StatValue>
        </StatBox>
        <StatBox>
          <StatLabel>Avg</StatLabel>
          <StatValue style={{ color: getThemeColor('--chart-warning-color') }}>{stats.avg}{unit}</StatValue>
        </StatBox>
        <StatBox>
          <StatLabel>Max</StatLabel>
          <StatValue style={{ color: getThemeColor('--chart-success-color') }}>{stats.max}{unit}</StatValue>
        </StatBox>
      </StatsBar>

      <ChartContainer $fullscreen={isFullscreen}>
        {loading ? (
          <LoadingState>
            <FaSpinner className="spin" size={32} />
            <span>Loading sensor data...</span>
          </LoadingState>
        ) : chartOptions ? (
          <ReactECharts
            ref={chartRef}
            option={chartOptions}
            style={{ height: isFullscreen ? '70vh' : '280px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <NoDataState>
            <FaChartLine size={32} />
            <span>No data available</span>
          </NoDataState>
        )}
      </ChartContainer>
    </ChartCard>
  );
};

export default SensorChart;

// Professional Styling
const ChartCard = styled.div`
  background: ${props => props.$fullscreen ? 'var(--main-bg-color)' : 'var(--glass-bg-primary)'};
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: ${props => props.$fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$fullscreen ? '0' : 'auto'};
  left: ${props => props.$fullscreen ? '0' : 'auto'};
  width: ${props => props.$fullscreen ? '100vw' : '100%'};
  height: ${props => props.$fullscreen ? '100vh' : 'auto'};
  z-index: ${props => props.$fullscreen ? '9999' : '1'};
  padding: ${props => props.$fullscreen ? '2rem' : '1.5rem'};
  overflow: auto;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartMenuButton = styled.button`
  background: var(--glass-bg-secondary);
  border: none;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: var(--placeholder-text-color);
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--active-bg-color);
    color: var(--main-text-color);
  }
`;

const ChartMenu = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 0.75rem;
  position: absolute;
  top: 60px;
  left: 10px;
  z-index: 100;
  box-shadow: var(--main-shadow-art);
`;

const ChartMenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ChartMenuLabel = styled.span`
  font-size: 0.7rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChartTypeButtons = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const ChartTypeBtn = styled.button`
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--glass-bg-secondary)'};
  color: ${props => props.$active ? 'white' : 'var(--main-text-color)'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--active-bg-color)'};
  }
`;

const FullscreenBtn = styled.button`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--placeholder-text-color);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--active-bg-color);
    color: var(--primary-accent);
    border-color: var(--primary-accent);
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--main-text-color);
  margin: 0;
`;

const TimeSelector = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 10px;
`;

const TimeButton = styled.button`
  padding: 0.375rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--placeholder-text-color)'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--glass-bg-primary)'};
  }
`;

const CurrentValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const ValueNumber = styled.span`
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--main-text-color);
  line-height: 1;
`;

const ValueUnit = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--placeholder-text-color);
`;

const TrendIndicator = styled.div`
  margin-left: 0.5rem;
  font-size: 1.25rem;
`;

const StatsBar = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  flex-wrap: wrap;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 80px;
`;

const StatLabel = styled.span`
  font-size: 0.7rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
`;

const ChartContainer = styled.div`
  min-height: 280px;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  height: ${props => props.$fullscreen ? 'auto' : '280px'};
  flex: ${props => props.$fullscreen ? '1' : 'none'};
`;

const LoadingState = styled.div`
  height: ${props => props.$fullscreen ? '50vh' : '280px'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--placeholder-text-color);

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.div`
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--chart-error-color);
`;

const NoDataState = styled.div`
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--placeholder-text-color);
`;