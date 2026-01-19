// Contributors Service - Fetches and manages contributor data from GitHub repos
const REPOS = [
  'OpenGrow-Box/OpenGrowBox-Frontend',
  'OpenGrow-Box/OpenGrowBox-HA'
];

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEY = 'ogb_contributors_cache';

// Fallback contributors in case API fails
const FALLBACK_CONTRIBUTORS = [
  { name: 'OpenGrowBox', login: 'OpenGrowBox' },
  { name: '0xW3bJun6l3', login: '0xW3bJun6l3' },
  { name: 'Tobiwan91', login: 'Tobiwan91' },
  { name: 'SZip', login: 'SZip' }
];

export const fetchContributorsFromRepo = async (repo) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/contributors`);
    if (!response.ok) {
      throw new Error(`Failed to fetch contributors from ${repo}`);
    }
    const data = await response.json();
    return data.map(contributor => ({
      name: contributor.login,
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      html_url: contributor.html_url,
      contributions: contributor.contributions,
      repo: repo
    }));
  } catch (error) {
    console.warn(`Error fetching contributors from ${repo}:`, error);
    return [];
  }
};

export const fetchAllContributors = async () => {
  try {
    // Check cache first
    const cached = getCachedContributors();
    if (cached) {
      return cached;
    }

    // Fetch from all repos in parallel
    const promises = REPOS.map(repo => fetchContributorsFromRepo(repo));
    const results = await Promise.all(promises);

    // Flatten and deduplicate
    const allContributors = results.flat();
    const deduplicated = deduplicateContributors(allContributors);

    // Filter out unwanted contributors
    const filtered = deduplicated.filter(contributor => {
      const login = contributor.login.toLowerCase();
      const shouldInclude = login !== 'secusolve';
      if (!shouldInclude) {
        console.log('Filtering out contributor:', contributor.login);
      }
      return shouldInclude;
    });

    // Add manual contributors that should be included
    const manualContributors = [
      {
        name: '0xW3bJun6l3',
        login: '0xW3bJun6l3',
        avatar_url: 'https://github.com/images/error/octocat_happy.gif', // Default avatar
        html_url: 'https://github.com/0xW3bJun6l3',
        contributions: 0, // Will be sorted by priority
        repo: 'manual'
      }
    ];

    const allContributorsWithManual = [...filtered, ...manualContributors];

    // Sort contributors
    const sorted = sortContributors(allContributorsWithManual);

    // Cache the result
    setCachedContributors(sorted);

    return sorted;
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return FALLBACK_CONTRIBUTORS;
  }
};

const deduplicateContributors = (contributors) => {
  const contributorMap = new Map();

  contributors.forEach(contributor => {
    const login = contributor.login;
    if (contributorMap.has(login)) {
      // Keep the one with more contributions
      const existing = contributorMap.get(login);
      if (contributor.contributions > existing.contributions) {
        contributorMap.set(login, contributor);
      }
    } else {
      contributorMap.set(login, contributor);
    }
  });

  return Array.from(contributorMap.values());
};

const sortContributors = (contributors) => {
  const priorityUsers = ['OpenGrowBox', '0xW3bJun6l3'];

  return contributors.sort((a, b) => {
    // Always put priority users first and second
    const aPriorityIndex = priorityUsers.indexOf(a.login);
    const bPriorityIndex = priorityUsers.indexOf(b.login);

    if (aPriorityIndex !== -1 && bPriorityIndex !== -1) {
      return aPriorityIndex - bPriorityIndex;
    }
    if (aPriorityIndex !== -1) return -1;
    if (bPriorityIndex !== -1) return 1;

    // Sort by contributions (descending)
    return b.contributions - a.contributions;
  });
};

const getCachedContributors = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Error reading cached contributors:', error);
    return null;
  }
};

const setCachedContributors = (contributors) => {
  try {
    const cacheData = {
      data: contributors,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error caching contributors:', error);
  }
};

export default fetchAllContributors;