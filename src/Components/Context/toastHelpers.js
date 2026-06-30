export const getCurrentWeek = (startDateStr) => {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  return Math.floor(diffDays / 7) + 1;
};

export const buildCtaSet = (hasBreeder, week, hasStrainDbConnection = false, isPremiumActive = false) => {
  const premiumLabel = week % 4 === 0
    ? 'Automate grow journal'
    : week % 4 === 1
    ? 'Enable automatic grow plans'
    : week % 4 === 2
    ? 'Discover Premium'
    : 'Never manually check weeks again';

  const strainDisconnectedLabel = week % 3 === 0
    ? 'Start your grow journal'
    : week % 3 === 1
    ? 'Track this week in a journal'
    : 'Begin tracking your grow';

  const strainConnectedLabel = week % 3 === 0
    ? 'Open journal review'
    : week % 3 === 1
    ? 'View on StrainDB'
    : 'Check StrainDB journal';

  const ctas = [];

  // Non-premium: show premium upsell CTA
  if (!isPremiumActive) {
    ctas.push({
      key: 'premium',
      label: premiumLabel,
      url: 'https://opengrowbox.net',
      primary: true,
    });
  }

  // StrainDB CTA: redirect to journal review when connected, else onboarding
  ctas.push({
    key: 'straindb',
    label: hasStrainDbConnection ? strainConnectedLabel : strainDisconnectedLabel,
    url: 'https://straindb.io',
    primary: isPremiumActive,
  });

  if (hasBreeder && week % 2 === 0) {
    ctas.reverse();
  }

  return ctas;
};
