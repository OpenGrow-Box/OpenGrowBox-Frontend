import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const EnergySummaryCard = ({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  subtext, 
  highlight = false,
  trend = null,
  trendValue = null,
  sparklineData = [],
  color = 'var(--primary-accent)'
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'var(--chart-success-color)';
    if (trend === 'down') return 'var(--chart-error-color)';
    return 'var(--second-text-color)';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card highlight={highlight}>
      <CardIconContainer>
        <IconWrapper color={color}>
          <Icon size={20} />
        </IconWrapper>
        {trend && trendValue && (
          <TrendBadge color={getTrendColor()}>
            <TrendIcon size={12} />
            <span>{trendValue}%</span>
          </TrendBadge>
        )}
      </CardIconContainer>
      
      <CardContent>
        <Label>{label}</Label>
        <ValueContainer>
          <Value>{value}</Value>
          <Unit>{unit}</Unit>
        </ValueContainer>
        {subtext && <Subtext>{subtext}</Subtext>}
      </CardContent>

      {sparklineData.length > 0 && (
        <SparklineContainer>
          <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={generateSparklinePath(sparklineData)}
              fill={`url(#gradient-${label})`}
              stroke="none"
            />
            <path
              d={generateSparklinePath(sparklineData)}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SparklineContainer>
      )}
    </Card>
  );
};

EnergySummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  subtext: PropTypes.string,
  highlight: PropTypes.bool,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendValue: PropTypes.string,
  sparklineData: PropTypes.array,
  color: PropTypes.string,
};

const generateSparklinePath = (data) => {
  if (!data || data.length === 0) return '';
  
  const width = 100;
  const height = 40;
  const padding = 2;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const normalizedValue = (value - min) / range;
    const y = height - padding - (normalizedValue * (height - 2 * padding));
    return `${x},${y}`;
  });
  
  return `M ${points.join(' L ')}`;
};

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  min-height: 140px;
  background: ${props => props.highlight 
    ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(96, 165, 250, 0.1) 100%)' 
    : 'var(--glass-bg-secondary)'
  };
  border: 1px solid ${props => props.highlight 
    ? 'var(--primary-accent)' 
    : 'var(--glass-border)'
  };
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.highlight 
      ? 'linear-gradient(90deg, var(--primary-accent) 0%, var(--secondary-accent) 100%)' 
      : 'transparent'
    };
    border-radius: 16px 16px 0 0;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: ${props => props.highlight ? 'var(--primary-accent)' : 'var(--glass-border-light)'};
  }

  @media (max-width: 768px) {
    padding: 1rem;
    min-height: 120px;
    &:hover {
      transform: translateY(-2px);
    }
  }
`;

const CardIconContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const IconWrapper = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
  backdrop-filter: blur(5px);
`;

const TrendBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.color};
  background: ${props => props.color}15;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  z-index: 1;
`;

const Label = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--second-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ValueContainer = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--main-text-color);
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Unit = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--second-text-color);
`;

const Subtext = styled.span`
  font-size: 0.7rem;
  color: var(--second-text-color);
  margin-top: 0.25rem;
`;

const SparklineContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  pointer-events: none;
  z-index: 0;
`;

export default EnergySummaryCard;
