import React from 'react';
import styled from 'styled-components';
import { HelpCircle, Info, AlertTriangle, Target, Scale, Thermometer, Droplets, Zap } from 'lucide-react';
import { useTooltip } from './TooltipContext';

const TooltipPanel = () => {
  const { activeTooltip } = useTooltip();

  const getDefaultContent = () => ({
    title: 'Grow Planning Assistant',
    icon: <HelpCircle size={20} color="#6b7280" />,
    content: (
      <div>
        <p><strong>Need Help?</strong></p>
        <p>Hover over different parameters and controls to get detailed explanations and tips for optimal grow planning.</p>
        <ul>
          <li>• <strong>Light:</strong> Scheduling and intensity control</li>
          <li>• <strong>Climate:</strong> VPD, temperature, humidity, CO₂</li>
          <li>• <strong>Feeding:</strong> Nutrient ratios and pH management</li>
          <li>• <strong>Planning:</strong> Week-by-week grow progression</li>
        </ul>
      </div>
    )
  });

  const tooltipData = activeTooltip || getDefaultContent();

  const getIconForType = (type) => {
    switch (type) {
      case 'vpd':
        return <Target size={20} color="#3b82f6" />;
      case 'temperature':
        return <Thermometer size={20} color="#ef4444" />;
      case 'humidity':
        return <Droplets size={20} color="#06b6d4" />;
      case 'co2':
        return <Info size={20} color="#84cc16" />;
      case 'ec':
        return <Scale size={20} color="#f59e0b" />;
      case 'ph':
        return <AlertTriangle size={20} color="#8b5cf6" />;
      case 'light':
        return <Zap size={20} color="#fbbf24" />;
      default:
        return <HelpCircle size={20} color="#6b7280" />;
    }
  };

  return (
    <PanelContainer>
      <PanelHeader>
        {activeTooltip ? getIconForType(activeTooltip.type) : tooltipData.icon}
        <PanelTitle>{tooltipData.title}</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {tooltipData.content}
      </PanelContent>
    </PanelContainer>
  );
};

const PanelContainer = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  background: var(--main-bg-card-color);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  box-shadow: var(--main-shadow-art);
  z-index: 50;
  overflow-y: auto;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  @media (max-width: 1200px) {
    display: none; /* Hide on smaller screens */
  }

  /* Mobile version */
  @media (max-width: 768px) {
    position: fixed;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 40vh;
    border-radius: 1rem 1rem 0 0;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 1;
  flex-shrink: 0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const PanelContent = styled.div`
  padding: 1.25rem;
  flex: 1;
  overflow-y: auto;

  p {
    margin: 0 0 1rem 0;
    line-height: 1.6;
    color: var(--main-text-color);
    font-size: 0.9rem;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.25rem;
      line-height: 1.5;
      color: var(--main-text-muted);
      font-size: 0.85rem;
    }
  }

  strong {
    color: var(--main-text-color);
    font-weight: 600;
  }

  /* Custom styling for different content types */
  .highlight {
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    padding: 0.75rem;
    margin: 1rem 0;
    border-radius: 0.375rem;
  }

  .warning {
    background: rgba(245, 158, 11, 0.1);
    border-left: 3px solid #f59e0b;
    padding: 0.75rem;
    margin: 1rem 0;
    border-radius: 0.375rem;
  }

  .success {
    background: rgba(34, 197, 94, 0.1);
    border-left: 3px solid #22c55e;
    padding: 0.75rem;
    margin: 1rem 0;
    border-radius: 0.375rem;
  }
`;

export default TooltipPanel;