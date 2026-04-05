const HISTORY_STORAGE_KEY = 'opengrowbox_energy_history';
const MAX_HISTORY_DAYS = 30;

export const energyHistoryStorage = {
  getHistory: () => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveSnapshot: (data) => {
    try {
      const history = energyHistoryStorage.getHistory();
      const today = new Date().toISOString().split('T')[0];
      
      const existingIndex = history.findIndex(h => h.date === today);
      
      const snapshot = {
        date: today,
        timestamp: Date.now(),
        ...data
      };

      if (existingIndex >= 0) {
        history[existingIndex] = snapshot;
      } else {
        history.push(snapshot);
      }

      const sortedHistory = history
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-MAX_HISTORY_DAYS);

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sortedHistory));
      return sortedHistory;
    } catch (error) {
      console.error('Error saving energy history snapshot:', error);
      return [];
    }
  },

  getChartData: (days = 7) => {
    const history = energyHistoryStorage.getHistory();
    const recentHistory = history.slice(-days);

    return {
      watts: recentHistory.map(h => ({
        label: formatDateLabel(h.date),
        value: h.totalWatts || 0
      })),
      dailyKwh: recentHistory.map(h => ({
        label: formatDateLabel(h.date),
        value: h.dailyKwh || 0
      })),
      dailyCost: recentHistory.map(h => ({
        label: formatDateLabel(h.date),
        value: h.dailyCost || 0
      })),
      monthlyCost: recentHistory.map(h => ({
        label: formatDateLabel(h.date),
        value: h.monthlyCost || 0
      })),
      activeDevices: recentHistory.map(h => ({
        label: formatDateLabel(h.date),
        value: h.activeDevices || 0
      }))
    };
  },

  getSparklineData: (type = 'totalWatts') => {
    const history = energyHistoryStorage.getHistory();
    const recentHistory = history.slice(-7);
    return recentHistory.map(h => h[type] || 0);
  },

  getTrend: (type = 'totalWatts') => {
    const history = energyHistoryStorage.getHistory();
    if (history.length < 2) return null;

    const recent = history.slice(-7);
    const previous = history.slice(-14, -7);

    if (previous.length === 0) return null;

    const recentAvg = recent.reduce((sum, h) => sum + (h[type] || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, h) => sum + (h[type] || 0), 0) / previous.length;

    if (previousAvg === 0) return null;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
};

const formatDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric' 
  });
};

export const shouldSaveSnapshot = () => {
  const history = energyHistoryStorage.getHistory();
  const today = new Date().toISOString().split('T')[0];
  const lastSnapshot = history[history.length - 1];

  if (!lastSnapshot) return true;
  if (lastSnapshot.date !== today) return true;

  const hoursSinceLastSave = (Date.now() - lastSnapshot.timestamp) / (1000 * 60 * 60);
  return hoursSinceLastSave >= 1;
};
