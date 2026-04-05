import { useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { getThemeColor } from '../../utils/themeColors';

const EnergyChart = ({ 
  data = [], 
  type = 'line', 
  height = 300, 
  title, 
  unit, 
  color = 'var(--primary-accent)',
  showArea = false,
  showGrid = true,
  smooth = true 
}) => {
  const getOption = useMemo(() => {
    const textColor = getThemeColor('--main-text-color');
    const secondaryTextColor = getThemeColor('--second-text-color');
    const gridColor = getThemeColor('--glass-border');
    const primaryColor = color.startsWith('var') ? getThemeColor(color) : color;

    return {
      backgroundColor: 'transparent',
      title: {
        text: title,
        left: '0',
        top: '0',
        textStyle: {
          color: textColor,
          fontSize: 14,
          fontWeight: 500,
        },
        padding: [0, 0, 20, 0],
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: getThemeColor('--main-bg-card-color'),
        borderColor: getThemeColor('--glass-border-light'),
        textStyle: {
          color: textColor,
        },
        padding: [12, 16],
        formatter: (params) => {
          const param = params[0];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${primaryColor};"></span>
              <span>${param.value}${unit || ''}</span>
            </div>
          `;
        },
      },
      grid: {
        left: '0',
        right: '20',
        bottom: showGrid ? '30' : '0',
        top: '60',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: type === 'bar',
        data: data.map(d => d.label),
        axisLine: {
          lineStyle: {
            color: gridColor,
          },
        },
        axisLabel: {
          color: secondaryTextColor,
          fontSize: 11,
          rotate: 0,
          interval: 'auto',
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        show: showGrid,
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: secondaryTextColor,
          fontSize: 11,
          formatter: (value) => {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          },
        },
        splitLine: {
          lineStyle: {
            color: gridColor,
            type: 'dashed',
            opacity: 0.3,
          },
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          type: type,
          data: data.map(d => d.value),
          smooth: smooth && type === 'line',
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          hoverAnimation: true,
          itemStyle: {
            color: primaryColor,
          },
          lineStyle: {
            width: 2.5,
            cap: 'round',
          },
          areaStyle: showArea
            ? {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: primaryColor + '40',
                    },
                    {
                      offset: 1,
                      color: primaryColor + '00',
                    },
                  ],
                },
              }
            : undefined,
          barWidth: type === 'bar' ? '60%' : undefined,
          barRadius: type === 'bar' ? [4, 4, 0, 0] : undefined,
        },
      ],
    };
  }, [data, type, title, unit, color, showArea, showGrid, smooth]);

  if (!data || data.length === 0) {
    return <EmptyState>Keine Daten verfügbar</EmptyState>;
  }

  return (
    <ChartContainer>
      <ReactECharts
        option={getOption}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </ChartContainer>
  );
};

EnergyChart.propTypes = {
  data: PropTypes.array,
  type: PropTypes.oneOf(['line', 'bar']),
  height: PropTypes.number,
  title: PropTypes.string,
  unit: PropTypes.string,
  color: PropTypes.string,
  showArea: PropTypes.bool,
  showGrid: PropTypes.bool,
  smooth: PropTypes.bool,
};

const ChartContainer = styled.div`
  width: 100%;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: var(--main-shadow-art);
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--second-text-color);
  font-size: 0.9rem;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
`;

export default EnergyChart;
