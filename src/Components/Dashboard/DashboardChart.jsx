import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';
import { FaExclamationTriangle, FaSpinner, FaChartLine, FaArrowUp, FaArrowDown, FaEquals, FaChartBar, FaDownload } from 'react-icons/fa';
import { Maximize2, Minimize2, BarChart3, LineChart, Image, FileSpreadsheet } from 'lucide-react';

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

  const { haApiBaseUrl, haToken: accessToken, entities, connection } = useHomeAssistant();
  const isDev = import.meta.env.DEV;
  const HISTORY_FETCH_TIMEOUT_MS = 15000;

  // Store chart data in ref for live updates
  const chartDataRef = useRef({ xData: [], yData: [] });
  const currentValueRef = useRef(null);

  const [startDate, setStartDate] = useState(getDefaultDate(-12 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('12h');
  const [isLive, setIsLive] = useState(false);
  const liveIntervalRef = useRef(null);
  const [stats, setStats] = useState({ current: '--', min: '--', max: '--', avg: '--', trend: 'stable' });
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChartMenu, setShowChartMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const chartRef = useRef(null);

  const handleExportPNG = () => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) {
      console.error('Chart instance not ready');
      return;
    }
    
    try {
      const url = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
        excludeComponents: ['toolbox', 'dataZoom']
      });
      
      const link = document.createElement('a');
      link.download = `${sensorId || 'chart'}_${selectedView}_${new Date().toISOString().slice(0,10)}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG Export error:', err);
    } finally {
      setShowExportMenu(false);
    }
  };

  const handleExportCSV = () => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;
    
    const option = chartInstance.getOption();
    const xData = option.xAxis[0].data;
    const yData = option.series[0].data;
    
    const csvContent = [
      ['Timestamp', 'Value', 'Unit'].join(','),
      ...xData.map((x, i) => `${x},${yData[i]},${unit}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `${sensorId || 'chart'}_${selectedView}_${new Date().toISOString().slice(0,10)}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setShowExportMenu(false);
  };

  const handleViewChange = (view) => {
    const isLiveMode = view === 'Live';
    setSelectedView(view);
    setIsLive(isLiveMode);
    
    // Clear existing interval
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    
    if (isLiveMode) {
      // Live mode: Start with empty chart, only show future data
      const now = new Date();
      setStartDate(now.toISOString().slice(0, 16));
      setEndDate(now.toISOString().slice(0, 16));
      
      // Start auto-refresh every 30 seconds for this chart only
      liveIntervalRef.current = setInterval(() => {
        const currentTime = new Date();
        setEndDate(currentTime.toISOString().slice(0, 16));
      }, 30000); // 30 seconds
    } else {
      // Normal mode: historical data
      const hours = view === '6h' ? 6 : view === '12h' ? 12 : view === '24h' ? 24 : 168;
      setStartDate(getDefaultDate(-hours * 60 * 60 * 1000));
      setEndDate(getDefaultDate());
    }
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
        
        // Calculate stats - use fallback to 0
        const current = values.length > 0 ? values[values.length - 1] : 0;
        const min = values.length > 0 ? Math.min(...values) : 0;
        const max = values.length > 0 ? Math.max(...values) : 0;
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        
        // Calculate trend
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
        const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'stable';
        
        setStats({
          current: current.toFixed(2),
          min: min.toFixed(2),
          max: max.toFixed(2),
          avg: avg.toFixed(2),
          trend
        });

        // Prepare chart data - filter out NaN and fill gaps with last valid value
        let lastValidValue = null;
        const filledYData = sensorData.map(item => {
          const val = parseFloat(item.state);
          if (!isNaN(val)) {
            lastValidValue = val;
            return val;
          }
          return lastValidValue;
        });
        
        const xData = sensorData.map(item => item.last_changed);
        const yData = filledYData;

        // Store data in ref for live updates
        chartDataRef.current = { xData, yData };
        currentValueRef.current = current;

        // Get colors - different colors for different sensor types (using theme colors)
        const textColor = getThemeColor('--main-text-color');
        const secondaryTextColor = getThemeColor('--second-text-color');
        const gridColor = getThemeColor('--glass-border');
        
        // Define sensor type colors - using fixed industry standard colors
        const getSensorColor = (sensorTitle) => {
          const titleLower = (sensorTitle || '').toLowerCase();
          if (titleLower.includes('vpd')) return '#f59e0b';
          if (titleLower.includes('temp') || titleLower.includes('temperature')) return '#22c55e';
          if (titleLower.includes('hum') || titleLower.includes('humidity')) return '#3b82f6';
          if (titleLower.includes('co2') || titleLower.includes('co₂')) return '#a855f7';
          if (titleLower.includes('ph')) return '#22c55e';
          if (titleLower.includes('ec')) return '#8b5cf6';
          if (titleLower.includes('tds')) return '#f97316';
          if (titleLower.includes('orp')) return '#06b6d4';
          if (titleLower.includes('water') || titleLower.includes('tank') || titleLower.includes('reservoir')) return '#3b82f6';
          return '#3b82f6';
        };
        
        const accentColor = getSensorColor(title);

        setChartOptions({
          backgroundColor: 'transparent',
          grid: { top: 60, right: 20, bottom: 60, left: 60 },
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
          series: [
            // Main data series
            {
              name: title,
              data: yData,
              type: chartType === 'area' ? 'line' : chartType,
              smooth: 0.3,
              symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
              symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
              showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
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
              areaStyle: chartType === 'bar' ? undefined : {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: accentColor + '60' },
                    { offset: 0.5, color: accentColor + '30' },
                    { offset: 1, color: accentColor + '05' }
                  ]
                }
              },
              barWidth: chartType === 'bar' ? '60%' : undefined,
              markPoint: chartType !== 'bar' ? {
                data: [
                  { type: 'max', name: 'Max', symbol: 'pin', symbolSize: 40, itemStyle: { color: getThemeColor('--chart-success-color') } },
                  { type: 'min', name: 'Min', symbol: 'pin', symbolSize: 40, itemStyle: { color: getThemeColor('--chart-error-color') } }
                ],
                label: { fontSize: 10, fontWeight: 'bold' }
              } : undefined
            },
            // AVG line series (constant line at average value)
            {
              name: 'AVG',
              type: 'line',
              data: yData.map(() => avg),
              smooth: false,
              symbol: 'none',
              lineStyle: {
                width: 2,
                color: getThemeColor('--second-text-color'),
                type: 'dashed',
                opacity: 0.7
              },
              tooltip: {
                show: true,
                formatter: () => `<div style="font-weight:600;color:#f59e0b">AVG: ${avg.toFixed(1)} ${unit}</div>`
              },
              markLine: {
                silent: true,
                symbol: ['none', 'none'],
                lineStyle: { 
                  width: 3,
                  color: '#ffffff',
                  type: 'dashed',
                  opacity: 0.9
                },
                label: {
                  show: true,
                  position: 'insideEndTop',
                  formatter: `Ø ${avg.toFixed(1)}`,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: [6, 12],
                  borderRadius: 6,
                  distance: 50
                },
                data: [{ 
                  yAxis: avg,
                  x: '90%',
                  lineStyle: {
                    width: 3,
                    color: '#ffffff',
                    type: 'dashed'
                  }
                }]
              }
            }
          ]
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

  // Live update effect - update chart when entity changes via WebSocket
  useEffect(() => {
    if (!sensorId || !entities) return;

    const entity = entities[sensorId];
    if (!entity || !entity.state) return;

    const newValue = parseFloat(entity.state);
    if (isNaN(newValue)) return;

    // Only update if value changed
    if (currentValueRef.current === newValue) return;
    currentValueRef.current = newValue;

    // Update stats immediately
    setStats(prev => ({
      ...prev,
      current: newValue.toFixed(2)
    }));

    // Update chart data if we have existing data
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (chartInstance && chartDataRef.current.xData.length > 0) {
      const now = new Date().toISOString();
      const xData = [...chartDataRef.current.xData, now];
      const yData = [...chartDataRef.current.yData, newValue];

      // Keep only last 1000 points for performance
      if (xData.length > 1000) {
        xData.shift();
        yData.shift();
      }

      chartDataRef.current = { xData, yData };

      chartInstance.setOption({
        xAxis: { data: xData },
        series: [{ data: yData }]
      });
    }
  }, [entities, sensorId]);

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
        <HeaderTopRow>
          <CurrentValue>
            <ValueNumber>{stats.current}</ValueNumber>
            <ValueUnit>{unit}</ValueUnit>
            <TrendIndicator>{getTrendIcon()}</TrendIndicator>
          </CurrentValue>
          <ChartTitleRow>
            <ChartTitle>{title}</ChartTitle>
            <ChartTypeSelector>
              <ChartTypeBtn $active={chartType === 'line'} onClick={() => setChartType('line')} title="Line">
                <LineChart size={14} />
              </ChartTypeBtn>
              <ChartTypeBtn $active={chartType === 'bar'} onClick={() => setChartType('bar')} title="Bar">
                <BarChart3 size={14} />
              </ChartTypeBtn>
            </ChartTypeSelector>
          </ChartTitleRow>
        </HeaderTopRow>
        <HeaderBottomRow>
          <HeaderActions>
            <FullscreenBtn onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </FullscreenBtn>
            <ExportBtnContainer>
              <ExportBtn onClick={() => setShowExportMenu(!showExportMenu)} title="Export">
                <FaDownload size={14} />
              </ExportBtn>
              {showExportMenu && (
                <ExportMenu>
                  <ExportMenuBtn onClick={handleExportPNG}>
                    <Image size={14} />
                    <span>PNG Image</span>
                  </ExportMenuBtn>
                  <ExportMenuBtn onClick={handleExportCSV}>
                    <FileSpreadsheet size={14} />
                    <span>CSV Data</span>
                  </ExportMenuBtn>
                </ExportMenu>
              )}
            </ExportBtnContainer>
          </HeaderActions>
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
        </HeaderBottomRow>
      </ChartHeader>

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
    </ChartCard>
  );
};

export default SensorChart;

// Professional Styling
const ChartCard = styled.div`
  background: ${props => props.$fullscreen ? 'var(--main-bg-card-color)' : 'var(--glass-bg-primary)'};
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
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const HeaderTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartTypeSelector = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 8px;
  margin-left: 0.5rem;
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

const ExportBtnContainer = styled.div`
  position: relative;
`;

const ExportBtn = styled.button`
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

const ExportMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 0.5rem;
  z-index: 100;
  box-shadow: var(--main-shadow-art);
  min-width: 140px;
`;

const ExportMenuBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--main-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &:hover {
    background: var(--active-bg-color);
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
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  justify-content: center;
`;

const TimeSelectorBottom = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 10px;
  margin-top: 0.75rem;
  justify-content: center;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 60px;
  align-items: center;
`;

const StatLabel = styled.span`
  font-size: 0.6rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
`;

const ChartContainer = styled.div`
  min-height: 240px;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  height: ${props => props.$fullscreen ? 'auto' : '240px'};
  flex: ${props => props.$fullscreen ? '1' : 'none'};
`;

const LoadingState = styled.div`
  height: ${props => props.$fullscreen ? '50vh' : '240px'};
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