import { useCallback } from 'react';
import { useToast } from './useToast';
import { getCurrentWeek, buildCtaSet } from '../Components/Context/toastHelpers';

const STORAGE_KEY = 'ogb_last_seen_week';

export const useGrowWeekToast = () => {
  const { showToast } = useToast();

  const notifyWeekChange = useCallback(({
    growStartDate,
    breederName,
    roomId,
    mediumName,
    isPremiumActive = false,
    hasStrainDbConnection = false,
  }) => {
    console.log('[GrowWeekToast] triggered', { growStartDate, roomId, mediumName, isPremiumActive, hasStrainDbConnection });

    const week = getCurrentWeek(growStartDate);
    console.log('[GrowWeekToast] calculated week', week);
    if (!week || week < 1) {
      console.log('[GrowWeekToast] blocked: invalid week');
      return;
    }

    const storageKey = `${STORAGE_KEY}_${roomId || 'default'}_${mediumName || 'default'}_${growStartDate}`;
    let lastSeen = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) lastSeen = Number(raw);
    } catch {
      // ignore
    }

    console.log('[GrowWeekToast] storage', { storageKey, lastSeen });
    if (lastSeen && lastSeen >= week) {
      console.log('[GrowWeekToast] blocked: already seen');
      return;
    }

    const title = `Week ${week} begins`;
    const message = hasStrainDbConnection
      ? 'A new grow journal review is ready — check what\'s changed.'
      : 'Time to check your plants — light, nutrients, and watering need attention.';

    const ctas = buildCtaSet(!!breederName, week, hasStrainDbConnection, isPremiumActive);

    const saveWeek = () => {
      try {
        window.localStorage.setItem(storageKey, String(week));
      } catch {
        // ignore
      }
    };

    console.log('[GrowWeekToast] showing toast');
    showToast({
      title,
      message,
      type: 'info',
      duration: 0,
      onDismiss: saveWeek,
      actions: ctas.map(cta => ({
        label: cta.label,
        icon: cta.key === 'premium' ? 'rocket' : 'database',
        primary: cta.primary,
        dismiss: false,
        onClick: () => {
          saveWeek();
          window.open(cta.url, '_blank', 'noopener,noreferrer');
        },
      })),
    });
  }, [showToast]);

  return { notifyWeekChange };
};
