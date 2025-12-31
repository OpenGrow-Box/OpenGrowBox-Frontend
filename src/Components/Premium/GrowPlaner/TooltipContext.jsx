import React, { createContext, useContext, useState } from 'react';

const TooltipContext = createContext();

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

export const TooltipProvider = ({ children }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const showTooltip = (tooltipData) => {
    setActiveTooltip(tooltipData);
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const value = {
    activeTooltip,
    showTooltip,
    hideTooltip
  };

  return (
    <TooltipContext.Provider value={value}>
      {children}
    </TooltipContext.Provider>
  );
};