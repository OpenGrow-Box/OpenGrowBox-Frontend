import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { formatDateTime } from '../../misc/formatDateTime';
import { getThemeColor } from '../../utils/themeColors';
import { FaExclamationTriangle, FaSpinner, FaChartLine, FaArrowUp, FaArrowDown, FaEquals, FaDownload, FaChevronDown } from 'react-icons/fa';
import { Maximize2, Minimize2, LineChart, BarChart3, Image, FileSpreadsheet } from 'lucide-react';

// Combined Climate Chart - Shows VPD, Temperature, Humidity and optional CO2 in one chart
const CombinedClimateChart = ({ 
  sensorIds,
  co2Sensors = [],
  selectedCO2SensorIndex = 0,
  onCO2SensorChange,
  isGlobalLiveMode = false,
  globalLiveRefreshTrigger = 0,
  onLiveModeChange
}) => {
  const getDefaultDate = (offset = 0) => {
    const date = new Date(Date.now() + offset);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
  };

  const { haApiBaseUrl, haToken: accessToken, entities } = useHomeAssistant();
  const isDev = import.meta.env.DEV;
  const HISTORY_FETCH_TIMEOUT_MS = 15000;

  // Store chart data in ref for live updates
  const chartDataRef = useRef({ 
    vpd: { xData: [], yData: [] },
    temp: { xData: [], yData: [] },
    humidity: { xData: [], yData: [] },
    co2: { xData: [], yData: [] }
  });
  const currentValuesRef = useRef({ vpd: null, temp: null, humidity: null, co2: null });

  const [startDate, setStartDate] = useState(getDefaultDate(-12 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(getDefaultDate());
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('12h');
  const [isLive, setIsLive] = useState(false);
  const liveIntervalRef = useRef(null);
  const [stats, setStats] = useState({
    vpd: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    temp: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    humidity: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' },
    co2: { current: '--', min: '--', max: '--', avg: '--', trend: 'stable' }
  });
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCO2Selector, setShowCO2Selector] = useState(false);
  const chartRef = useRef(null);

  // Get selected CO2 sensor
  const selectedCO2Sensor = co2Sensors[selectedCO2SensorIndex];

  // Sensor configuration
  const sensorsConfig = {
    vpd: { id: sensorIds?.vpd, title: 'VPD', unit: 'kPa', color: '#f59e0b', yAxisIndex: 0 },
    temp: { id: sensorIds?.temperature, title: 'Temperature', unit: '°C', color: '#22c55e', yAxisIndex: 1 },
    humidity: { id: sensorIds?.humidity, title: 'Humidity', unit: '%', color: '#3b82f6', yAxisIndex: 2 },
    co2: { id: selectedCO2Sensor?.entity_id || selectedCO2Sensor?.id, title: 'CO₂', unit: selectedCO2Sensor?.unit || 'ppm', color: '#a855f7', yAxisIndex: 3, optional: true }
  };

  // Debug logging
  useEffect(() => {
    // Debug logs removed for production
  }, [sensorIds, selectedCO2Sensor, co2Sensors]);

  const handleExportPNG = () => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;
    
    try {
      const url = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
        excludeComponents: ['toolbox', 'dataZoom']
      });
      
      const link = document.createElement('a');
      link.download = `climate_overview_${selectedView}_${new Date().toISOString().slice(0,10)}.png`;
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
    const series = option.series;
    
    // Build CSV with all sensors (skip AVG lines)
    const headers = ['Timestamp', 'VPD (kPa)', 'Temperature (°C)', 'Humidity (%)'];
    if (selectedCO2Sensor) headers.push('CO₂ (ppm)');
    
    const csvContent = [
      headers.join(','),
      ...xData.map((x, i) => {
        const values = [x];
        // Find data by index - series are in order: VPD, VPD_AVG, Temp, Temp_AVG, Hum, Hum_AVG, CO2, CO2_AVG
        values.push(series[0]?.data?.[i] ?? '');
        values.push(series[2]?.data?.[i] ?? '');
        values.push(series[4]?.data?.[i] ?? '');
        if (selectedCO2Sensor) {
          values.push(series[6]?.data?.[i] ?? '');
        }
        return values.join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `climate_overview_${selectedView}_${new Date().toISOString().slice(0,10)}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setShowExportMenu(false);
  };

  const handleViewChange = (view) => {
    const isLiveMode = view === 'Live';
    setSelectedView(view);
    setIsLive(isLiveMode);
    
    // Notify parent about live mode change
    if (onLiveModeChange) {
      onLiveModeChange(isLiveMode);
    }
    
    // Clear existing interval
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    
    if (isLiveMode) {
      const now = new Date();
      setStartDate(now.toISOString().slice(0, 16));
      setEndDate(now.toISOString().slice(0, 16));
      
      liveIntervalRef.current = setInterval(() => {
        const currentTime = new Date();
        setEndDate(currentTime.toISOString().slice(0, 16));
      }, 30000);
    } else {
      const hours = view === '6h' ? 6 : view === '12h' ? 12 : view === '24h' ? 24 : 168;
      setStartDate(getDefaultDate(-hours * 60 * 60 * 1000));
      setEndDate(getDefaultDate());
    }
  };

  // Sync with global live mode
  useEffect(() => {
    if (isGlobalLiveMode !== isLive) {
      handleViewChange(isGlobalLiveMode ? 'Live' : '12h');
    }
  }, [isGlobalLiveMode, globalLiveRefreshTrigger]);

  // Fetch data for all sensors
  useEffect(() => {
    const fetchAllSensorData = async () => {
      if ((!isDev && !haApiBaseUrl) || !accessToken || !sensorIds) {
        setError('Connection not configured');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all sensors in parallel
        const fetchPromises = Object.entries(sensorsConfig).map(async ([key, config]) => {
          if (!config.id || (config.optional && !selectedCO2Sensor)) return { key, data: null };

          const url = `${haApiBaseUrl || ''}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${config.id}&end_time=${encodeURIComponent(endDate)}&minimal_response`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), HISTORY_FETCH_TIMEOUT_MS);
          
          try {
            const response = await fetch(url, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return { key, data };
          } catch (err) {
            clearTimeout(timeoutId);
            return { key, data: null, error: err.message };
          }
        });

        const results = await Promise.all(fetchPromises);
        
        // Process results
        const processedData = {};
        const newStats = { ...stats };

        results.forEach(({ key, data, error: fetchError }) => {
          if (fetchError || !data || !Array.isArray(data) || data.length === 0 || !data[0]?.length) {
            processedData[key] = { xData: [], yData: [], avg: 0 };
            return;
          }

          const sensorData = data[0];
          const values = sensorData.map(item => parseFloat(item.state)).filter(v => !isNaN(v));
          
          // DEBUG: Log the key and first/last values
          console.log(`[FETCH] ${key}: entity=${sensorsConfig[key]?.id}, first=${values[0]}, last=${values[values.length-1]}, count=${values.length}`);
          
          // Calculate stats
          const current = values.length > 0 ? values[values.length - 1] : 0;
          const min = values.length > 0 ? Math.min(...values) : 0;
          const max = values.length > 0 ? Math.max(...values) : 0;
          const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          
          // DEBUG: Log the key and first/last values
          console.log(`[FETCH] ${key}: entity=${sensorsConfig[key]?.id}, first=${values[0]}, last=${values[values.length-1]}, count=${values.length}`);
          
          // Calculate trend
          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
          const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
          const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'stable';
          
          newStats[key] = {
            current: current.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            avg: avg.toFixed(2),
            trend
          };

          // Process data points
          let lastValidValue = null;
          const filledYData = sensorData.map(item => {
            const val = parseFloat(item.state);
            if (!isNaN(val)) {
              lastValidValue = val;
              return val;
            }
            return lastValidValue;
          });

          processedData[key] = {
            xData: sensorData.map(item => item.last_changed),
            yData: filledYData,
            avg
          };
        });

        setStats(newStats);
        chartDataRef.current = processedData;
        
        console.log('Processed data:', {
          vpd: processedData.vpd?.yData?.slice(-3),
          temp: processedData.temp?.yData?.slice(-3),
          humidity: processedData.humidity?.yData?.slice(-3),
          co2: processedData.co2?.yData?.slice(-3)
        });
        console.log('New stats:', newStats);

        // Update current values ref
        currentValuesRef.current = {
          vpd: parseFloat(newStats.vpd.current) || null,
          temp: parseFloat(newStats.temp.current) || null,
          humidity: parseFloat(newStats.humidity.current) || null,
          co2: selectedCO2Sensor ? parseFloat(newStats.co2.current) || null : null
        };

        // Build chart options
        const textColor = getThemeColor('--main-text-color');
        const secondaryTextColor = getThemeColor('--second-text-color');
        const gridColor = getThemeColor('--glass-border');

        // Merge all timestamps from all sensors to create a unified x-axis
        const allTimestamps = new Set();
        ['vpd', 'temp', 'humidity', 'co2'].forEach(key => {
          if (processedData[key]?.xData) {
            processedData[key].xData.forEach(ts => allTimestamps.add(ts));
          }
        });
        
        // Sort timestamps and create unified x-axis
        const baseXData = Array.from(allTimestamps).sort();
        
        console.log('Unified X-axis length:', baseXData.length);
        console.log('Sensor data lengths:', {
          vpd: processedData.vpd?.yData?.length,
          temp: processedData.temp?.yData?.length,
          humidity: processedData.humidity?.yData?.length,
          co2: processedData.co2?.yData?.length
        });

        // Helper function to align sensor data to unified x-axis
        const alignDataToXAxis = (sensorKey) => {
          const sensorData = processedData[sensorKey];
          if (!sensorData?.xData?.length || !sensorData?.yData?.length) {
            return { data: [], avg: 0 };
          }
          
          const alignedData = [];
          const xMap = new Map();
          
          // Create map of timestamp -> value (use first occurrence if duplicates)
          sensorData.xData.forEach((ts, idx) => {
            if (!xMap.has(ts)) {
              xMap.set(ts, sensorData.yData[idx]);
            }
          });
          
          // Fill aligned data for each timestamp in baseXData
          let lastValue = null;
          let firstValue = null;
          baseXData.forEach(ts => {
            if (xMap.has(ts)) {
              lastValue = xMap.get(ts);
              if (firstValue === null) firstValue = lastValue;
              alignedData.push(lastValue);
            } else if (lastValue !== null) {
              // Use last known value for missing timestamps
              alignedData.push(lastValue);
            } else {
              // If no previous value, use the first available value
              alignedData.push(firstValue !== null ? firstValue : sensorData.yData[0] || 0);
            }
          });
          
          return { data: alignedData, avg: sensorData.avg };
        };
        
        // Align all sensor data to unified x-axis
        const alignedVPD = alignDataToXAxis('vpd');
        const alignedTemp = alignDataToXAxis('temp');
        const alignedHumidity = alignDataToXAxis('humidity');
        const alignedCO2 = alignDataToXAxis('co2');
        
        // DEBUG: Log aligned data
        console.log('[ALIGNED] VPD first/last:', alignedVPD.data[0], alignedVPD.data[alignedVPD.data.length-1]);
        console.log('[ALIGNED] Temp first/last:', alignedTemp.data[0], alignedTemp.data[alignedTemp.data.length-1]);
        console.log('[ALIGNED] Humidity first/last:', alignedHumidity.data[0], alignedHumidity.data[alignedHumidity.data.length-1]);

        // Build legend data
        const legendData = ['VPD', 'Temperature', 'Humidity'];
        if (selectedCO2Sensor && alignedCO2.data.length > 0) legendData.push('CO₂');

        // Build Y-axes
        const yAxes = [
          // VPD Y-Axis (left)
          {
            type: 'value',
            name: 'VPD (kPa)',
            nameTextStyle: { color: sensorsConfig.vpd.color, fontSize: 12, fontWeight: 'bold' },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.vpd.color } },
            axisLabel: { color: sensorsConfig.vpd.color, fontSize: 11 },
            splitLine: { lineStyle: { color: gridColor + '20', type: 'dashed' } },
            position: 'left'
          },
          // Temperature Y-Axis (right)
          {
            type: 'value',
            name: 'Temp (°C)',
            nameTextStyle: { color: sensorsConfig.temp.color, fontSize: 12, fontWeight: 'bold' },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.temp.color } },
            axisLabel: { color: sensorsConfig.temp.color, fontSize: 11 },
            splitLine: { show: false },
            position: 'right'
          },
          // Humidity Y-Axis (far right)
          {
            type: 'value',
            name: 'Humidity (%)',
            nameTextStyle: { color: sensorsConfig.humidity.color, fontSize: 12, fontWeight: 'bold' },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.humidity.color } },
            axisLabel: { color: sensorsConfig.humidity.color, fontSize: 11 },
            splitLine: { show: false },
            position: 'right',
            offset: 60
          }
        ];

        // Add CO2 Y-axis if sensor available and has data
        if (selectedCO2Sensor && alignedCO2.data.length > 0) {
          yAxes.push({
            type: 'value',
            name: `CO₂ (${sensorsConfig.co2.unit})`,
            nameTextStyle: { color: sensorsConfig.co2.color, fontSize: 12, fontWeight: 'bold' },
            axisLine: { show: true, lineStyle: { color: sensorsConfig.co2.color } },
            axisLabel: { color: sensorsConfig.co2.color, fontSize: 11 },
            splitLine: { show: false },
            position: 'right',
            offset: 120
          });
        }

        // Build series using aligned data
        const series = [];

        // VPD Series
        if (alignedVPD.data.length > 0) {
          series.push({
            name: 'VPD',
            data: alignedVPD.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 0,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            sampling: 'lttb',
            itemStyle: { color: sensorsConfig.vpd.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.vpd.color,
              shadowColor: sensorsConfig.vpd.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.vpd.color + '40' },
                  { offset: 1, color: sensorsConfig.vpd.color + '05' }
                ]
              }
            }
          });
          // VPD AVG Line
          series.push({
            name: 'VPD AVG',
            type: 'line',
            data: new Array(alignedVPD.data.length).fill(alignedVPD.avg),
            yAxisIndex: 0,
            smooth: false,
            symbol: 'none',
            lineStyle: {
              width: 2,
              color: sensorsConfig.vpd.color,
              type: 'dashed',
              opacity: 0.7
            },
            tooltip: { show: false }
          });
        }

        // Temperature Series
        if (alignedTemp.data.length > 0) {
          series.push({
            name: 'Temperature',
            data: alignedTemp.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 1,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            sampling: 'lttb',
            itemStyle: { color: sensorsConfig.temp.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.temp.color,
              shadowColor: sensorsConfig.temp.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.temp.color + '40' },
                  { offset: 1, color: sensorsConfig.temp.color + '05' }
                ]
              }
            }
          });
          // Temperature AVG Line
          series.push({
            name: 'Temp AVG',
            type: 'line',
            data: new Array(alignedTemp.data.length).fill(alignedTemp.avg),
            yAxisIndex: 1,
            smooth: false,
            symbol: 'none',
            lineStyle: {
              width: 2,
              color: sensorsConfig.temp.color,
              type: 'dashed',
              opacity: 0.7
            },
            tooltip: { show: false }
          });
        }

        // Humidity Series
        if (alignedHumidity.data.length > 0) {
          series.push({
            name: 'Humidity',
            data: alignedHumidity.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 2,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            sampling: 'lttb',
            itemStyle: { color: sensorsConfig.humidity.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.humidity.color,
              shadowColor: sensorsConfig.humidity.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.humidity.color + '40' },
                  { offset: 1, color: sensorsConfig.humidity.color + '05' }
                ]
              }
            }
          });
          // Humidity AVG Line
          series.push({
            name: 'Humidity AVG',
            type: 'line',
            data: new Array(alignedHumidity.data.length).fill(alignedHumidity.avg),
            yAxisIndex: 2,
            smooth: false,
            symbol: 'none',
            lineStyle: {
              width: 2,
              color: sensorsConfig.humidity.color,
              type: 'dashed',
              opacity: 0.7
            },
            tooltip: { show: false }
          });
        }

        // CO2 Series
        if (selectedCO2Sensor && alignedCO2.data.length > 0) {
          series.push({
            name: 'CO₂',
            data: alignedCO2.data,
            type: chartType === 'area' ? 'line' : chartType,
            yAxisIndex: 3,
            smooth: 0.3,
            symbol: chartType === 'line' || chartType === 'area' ? 'circle' : 'rect',
            symbolSize: chartType === 'line' || chartType === 'area' ? 4 : 8,
            showSymbol: chartType === 'line' || chartType === 'area' ? false : true,
            sampling: 'lttb',
            itemStyle: { color: sensorsConfig.co2.color },
            lineStyle: chartType !== 'bar' ? {
              width: 3,
              color: sensorsConfig.co2.color,
              shadowColor: sensorsConfig.co2.color + '40',
              shadowBlur: 10
            } : { width: 0 },
            areaStyle: chartType === 'bar' ? undefined : {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: sensorsConfig.co2.color + '40' },
                  { offset: 1, color: sensorsConfig.co2.color + '05' }
                ]
              }
            }
          });
          // CO2 AVG Line
          series.push({
            name: 'CO₂ AVG',
            type: 'line',
            data: new Array(alignedCO2.data.length).fill(alignedCO2.avg),
            yAxisIndex: 3,
            smooth: false,
            symbol: 'none',
            lineStyle: {
              width: 2,
              color: sensorsConfig.co2.color,
              type: 'dashed',
              opacity: 0.7
            },
            tooltip: { show: false }
          });
        }

        setChartOptions({
          backgroundColor: 'transparent',
          grid: { 
            top: 80, 
            right: selectedCO2Sensor && alignedCO2.data.length > 0 ? 160 : 100, 
            bottom: 60, 
            left: 60 
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: getThemeColor('--main-bg-card-color'),
            borderColor: getThemeColor('--glass-border'),
            borderWidth: 1,
            padding: [12, 16],
            textStyle: { color: textColor, fontSize: 13 },
            formatter: (params) => {
              const date = formatDateTime(params[0]?.axisValue);
              let html = `<div style="font-weight:600;margin-bottom:8px">${date}</div>`;
              
              // Create a map of series names to their data for this timestamp
              const dataMap = {};
              params.forEach(p => {
                if (!p.seriesName.includes('AVG')) {
                  dataMap[p.seriesName] = p.value;
                }
              });
              
              // Define the order and config for each sensor
              const sensorOrder = [
                { name: 'VPD', config: sensorsConfig.vpd },
                { name: 'Temperature', config: sensorsConfig.temp },
                { name: 'Humidity', config: sensorsConfig.humidity },
                { name: 'CO₂', config: sensorsConfig.co2 }
              ];
              
              sensorOrder.forEach(({ name, config }) => {
                if (dataMap[name] !== undefined && config) {
                  html += `
                    <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${config.color}"></span>
                      <span style="font-size:14px;font-weight:600">${name}:</span>
                      <span style="font-size:14px;font-weight:700">${dataMap[name]} ${config.unit}</span>
                    </div>
                  `;
                }
              });
              
              return html;
            }
          },
          legend: {
            data: legendData,
            top: 10,
            textStyle: { color: textColor, fontSize: 12 },
            itemGap: 20
          },
          dataZoom: [{
            type: 'inside',
            start: 0,
            end: 100
          }],
          xAxis: {
            type: 'category',
            data: baseXData,
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
          yAxis: yAxes,
          series: series
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSensorData();
  }, [startDate, endDate, sensorIds, haApiBaseUrl, accessToken, chartType, selectedCO2SensorIndex]);

  // Live update effect - only updates data, doesn't reload entire chart
  useEffect(() => {
    if (!sensorIds || !entities) return;

    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance || !chartOptions) return;
    
    // Check if chart is disposed
    if (chartInstance.isDisposed()) return;

    let hasUpdate = false;
    const seriesUpdates = [];
    let newXData = null;

    Object.entries(sensorsConfig).forEach(([key, config]) => {
      if (!config.id || (config.optional && !selectedCO2Sensor)) return;
      
      const entity = entities[config.id];
      if (!entity || !entity.state) return;

      const newValue = parseFloat(entity.state);
      if (isNaN(newValue)) return;

      // Only update if value changed
      if (currentValuesRef.current[key] === newValue) return;
      currentValuesRef.current[key] = newValue;
      hasUpdate = true;

      // Update stats
      setStats(prev => ({
        ...prev,
        [key]: { ...prev[key], current: newValue.toFixed(2) }
      }));

      // Update chart data if we have existing data
      const currentData = chartDataRef.current[key];
      if (currentData?.xData?.length > 0) {
        const now = new Date().toISOString();
        const xData = [...currentData.xData, now];
        const yData = [...currentData.yData, newValue];

        // Keep only last 1000 points
        if (xData.length > 1000) {
          xData.shift();
          yData.shift();
        }

        const newAvg = yData.reduce((a, b) => a + b, 0) / yData.length;
        chartDataRef.current[key] = { xData, yData, avg: newAvg };

        // Store for batch update
        newXData = xData;
        
        // Find series indices for this sensor
        try {
          const option = chartInstance.getOption();
          if (!option || !option.series) return;
          
          const series = option.series;
          let dataSeriesIndex = -1;
          let avgSeriesIndex = -1;
          
          series.forEach((s, idx) => {
            if (s.name === config.title) dataSeriesIndex = idx;
            if (s.name === `${config.title} AVG` || (key === 'temp' && s.name === 'Temp AVG') || (key === 'co2' && s.name === 'CO₂ AVG')) {
              avgSeriesIndex = idx;
            }
          });

          if (dataSeriesIndex >= 0) {
            seriesUpdates[dataSeriesIndex] = { data: yData };
          }
          if (avgSeriesIndex >= 0) {
            seriesUpdates[avgSeriesIndex] = { data: yData.map(() => newAvg) };
          }
        } catch (e) {
          // Chart not ready, skip update
          return;
        }

        // Update stats avg
        setStats(prev => ({
          ...prev,
          [key]: { ...prev[key], avg: newAvg.toFixed(2) }
        }));
      }
    });

    if (hasUpdate) {
      const updateOption = {};
      if (newXData) {
        updateOption.xAxis = { data: newXData };
      }
      if (seriesUpdates.length > 0) {
        updateOption.series = seriesUpdates;
      }
      
      if (Object.keys(updateOption).length > 0) {
        try {
          chartInstance.setOption(updateOption);
        } catch (e) {
          // Chart might not be ready
          console.warn('Chart update failed:', e);
        }
      }
    }
  }, [entities, sensorIds, selectedCO2Sensor, chartOptions]);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <FaArrowUp style={{ color: getThemeColor('--chart-success-color') }} />;
    if (trend === 'down') return <FaArrowDown style={{ color: getThemeColor('--chart-error-color') }} />;
    return <FaEquals style={{ color: getThemeColor('--second-text-color') }} />;
  };

  const handleCO2SensorChange = (index) => {
    if (onCO2SensorChange) {
      onCO2SensorChange(index);
    }
    setShowCO2Selector(false);
  };

  if (error) {
    return (
      <ChartCard>
        <ErrorState>
          <FaExclamationTriangle size={32} />
          <div>Failed to load climate data</div>
        </ErrorState>
      </ChartCard>
    );
  }

  return (
    <ChartCard $fullscreen={isFullscreen}>
      <ChartHeader>
        <HeaderTopRow>
          <TitleSection>
            <ChartTitle>Climate Overview</ChartTitle>
            <ChartSubtitle>VPD, Temperature, Humidity {selectedCO2Sensor && stats.co2.current !== '--' && '& CO₂'}</ChartSubtitle>
          </TitleSection>
          <HeaderRightSection>
            {co2Sensors.length > 1 && (
              <CO2SelectorContainer>
                <CO2SelectorBtn onClick={() => setShowCO2Selector(!showCO2Selector)}>
                  <span>CO₂: {selectedCO2Sensor?.friendly_name || 'Select'}</span>
                  <FaChevronDown size={12} />
                </CO2SelectorBtn>
                {showCO2Selector && (
                  <CO2Dropdown>
                    {co2Sensors.map((sensor, index) => (
                      <CO2DropdownItem
                        key={sensor.id}
                        $active={index === selectedCO2SensorIndex}
                        onClick={() => handleCO2SensorChange(index)}
                      >
                        {sensor.friendly_name}
                      </CO2DropdownItem>
                    ))}
                  </CO2Dropdown>
                )}
              </CO2SelectorContainer>
            )}
            <ChartTypeSelector>
              <ChartTypeBtn $active={chartType === 'line'} onClick={() => setChartType('line')} title="Line">
                <LineChart size={14} />
              </ChartTypeBtn>
              <ChartTypeBtn $active={chartType === 'bar'} onClick={() => setChartType('bar')} title="Bar">
                <BarChart3 size={14} />
              </ChartTypeBtn>
            </ChartTypeSelector>
          </HeaderRightSection>
        </HeaderTopRow>
        
        <StatsRow>
          <StatBox>
            <StatLabel style={{ color: sensorsConfig.vpd.color }}>VPD</StatLabel>
            <StatValue>{stats.vpd.current}<Unit>kPa</Unit></StatValue>
            <TrendIndicator>{getTrendIcon(stats.vpd.trend)}</TrendIndicator>
            <StatAvg>Ø {stats.vpd.avg}</StatAvg>
          </StatBox>
          <StatBox>
            <StatLabel style={{ color: sensorsConfig.temp.color }}>Temp</StatLabel>
            <StatValue>{stats.temp.current}<Unit>°C</Unit></StatValue>
            <TrendIndicator>{getTrendIcon(stats.temp.trend)}</TrendIndicator>
            <StatAvg>Ø {stats.temp.avg}</StatAvg>
          </StatBox>
          <StatBox>
            <StatLabel style={{ color: sensorsConfig.humidity.color }}>Humidity</StatLabel>
            <StatValue>{stats.humidity.current}<Unit>%</Unit></StatValue>
            <TrendIndicator>{getTrendIcon(stats.humidity.trend)}</TrendIndicator>
            <StatAvg>Ø {stats.humidity.avg}</StatAvg>
          </StatBox>
          {selectedCO2Sensor && stats.co2.current !== '--' && (
            <StatBox>
              <StatLabel style={{ color: sensorsConfig.co2.color }}>CO₂</StatLabel>
              <StatValue>{stats.co2.current}<Unit>ppm</Unit></StatValue>
              <TrendIndicator>{getTrendIcon(stats.co2.trend)}</TrendIndicator>
              <StatAvg>Ø {stats.co2.avg}</StatAvg>
            </StatBox>
          )}
        </StatsRow>

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
            <span>Loading climate data...</span>
          </LoadingState>
        ) : chartOptions ? (
          <ReactECharts
            ref={chartRef}
            option={chartOptions}
            notMerge={false}
            lazyUpdate={false}
            style={{ height: isFullscreen ? '70vh' : '350px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <NoDataState>
            <FaChartLine size={32} />
            <span>No climate data available</span>
          </NoDataState>
        )}
      </ChartContainer>
    </ChartCard>
  );
};

export default CombinedClimateChart;

// Styled Components
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
  gap: 0.75rem;
`;

const HeaderTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const HeaderRightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--main-text-color);
  margin: 0;
`;

const ChartSubtitle = styled.span`
  font-size: 0.85rem;
  color: var(--second-text-color);
`;

const CO2SelectorContainer = styled.div`
  position: relative;
`;

const CO2SelectorBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--main-text-color);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--active-bg-color);
    border-color: var(--primary-accent);
  }
`;

const CO2Dropdown = styled.div`
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
  min-width: 200px;
  max-height: 200px;
  overflow-y: auto;
`;

const CO2DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.625rem 0.875rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--main-text-color)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  text-align: left;
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--active-bg-color)'};
  }
`;

const ChartTypeSelector = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 8px;
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

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  flex-wrap: wrap;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 70px;
  position: relative;
`;

const StatLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--main-text-color);
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
`;

const Unit = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--second-text-color);
`;

const TrendIndicator = styled.div`
  font-size: 0.85rem;
  position: absolute;
  top: 0;
  right: 0;
`;

const StatAvg = styled.span`
  font-size: 0.7rem;
  color: var(--second-text-color);
  font-weight: 500;
`;

const HeaderBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const ChartContainer = styled.div`
  min-height: 350px;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  height: ${props => props.$fullscreen ? 'auto' : '350px'};
  flex: ${props => props.$fullscreen ? '1' : 'none'};
`;

const LoadingState = styled.div`
  height: 350px;
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
  height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--chart-error-color);
`;

const NoDataState = styled.div`
  height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--placeholder-text-color);
`;
