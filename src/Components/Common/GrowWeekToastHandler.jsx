import { useEffect, useRef } from 'react';
import { useMedium } from '../Context/MediumContext';
import { usePremium } from '../Context/OGBPremiumContext';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGrowWeekToast } from '../../hooks/useGrowWeekToast';

const GrowWeekToastHandler = () => {
  const { currentMedium } = useMedium();
  const { isSubActive, subscription } = usePremium();
  const { currentRoom } = useHomeAssistant();
  const { notifyWeekChange } = useGrowWeekToast();
  const lastKeyRef = useRef(null);

  const activePlan = subscription?.activeGrowPlan || subscription?.active_grow_plan;
  const hasActiveGrowPlan = Boolean(activePlan?.name || activePlan?.status === 'active');
  const hasStrainDbConnection = subscription?.connections?.straindb === true;
  const isPremiumActive = isSubActive === true || hasActiveGrowPlan;

  const safeMedium = currentMedium || {};
  const dates = safeMedium.dates || {};
  const growStartDate = dates.growstartdate;
  const mediumName = safeMedium.medium_name || 'default';
  const breederName = safeMedium.breeder_name || '';

  // Debug: expose trigger globally
  useEffect(() => {
    window.__triggerGrowWeekToast = (overrides = {}) => {
      notifyWeekChange({
        growStartDate: overrides.growStartDate || growStartDate || '2025-01-01',
        breederName: overrides.breederName || breederName || '',
        roomId: overrides.roomId || currentRoom || 'default',
        mediumName: overrides.mediumName || mediumName || 'test',
        isPremiumActive: overrides.isPremiumActive ?? isPremiumActive,
        hasStrainDbConnection: overrides.hasStrainDbConnection ?? hasStrainDbConnection,
      });
    };
    return () => { delete window.__triggerGrowWeekToast; };
  }, [notifyWeekChange, growStartDate, breederName, currentRoom, mediumName, isPremiumActive, hasStrainDbConnection]);

  useEffect(() => {
    if (!currentMedium) { console.log('[GrowWeekToast] blocked: no currentMedium'); return; }
    if (!growStartDate) { console.log('[GrowWeekToast] blocked: no growStartDate'); return; }

    const key = `${currentRoom || 'default'}_${mediumName}_${growStartDate}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    notifyWeekChange({
      growStartDate,
      breederName,
      roomId: currentRoom,
      mediumName,
      isPremiumActive,
      hasStrainDbConnection,
    });
  }, [currentMedium, currentRoom, isPremiumActive, notifyWeekChange, growStartDate, mediumName, breederName, hasStrainDbConnection]);

  return null;
};

export default GrowWeekToastHandler;
