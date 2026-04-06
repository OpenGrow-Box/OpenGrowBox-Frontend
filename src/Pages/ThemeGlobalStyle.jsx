import { useContext } from 'react';
import { createGlobalStyle, css } from 'styled-components';
import { GlobalStateContext } from '../Components/Context/GlobalContext';

const BASE_FONT_FAMILY = "'Trebuchet MS', 'Segoe UI', sans-serif";

function ThemeGlobalStyle() {
  let theme = 'Main';

  try {
    const context = useContext(GlobalStateContext);
    theme = context?.state?.Design?.theme || 'Main';
  } catch (error) {
    console.warn('ThemeGlobalStyle context error:', error);
    theme = 'Main';
  }

  switch (theme) {
    case 'Main':
      return <GlobalStyle />;
    case 'Unicorn':
      return <GlobalUnicornStyle />;
    case 'Hacky':
      return <GlobalHackyStyle />;
    case 'BookWorm':
      return <GlobalWhiteStyle />;
    case 'BlueOcean':
      return <GlobalOceanStyle />;
    case 'CyberPunk':
      return <GlobalCyberStyle />;
    case 'Darkness':
      return <GlobalDarkModeStyle />;
    case 'Aurora':
      return <GlobalAuroraStyle />;
    case 'Sunshine':
      return <GlobalSunshineStyle />;
    case 'Crystal':
      return <GlobalCrystalStyle />;
    case 'Lumina':
      return <GlobalLuminaStyle />;
    case 'Radiance':
      return <GlobalRadianceStyle />;
    case 'NeonNights':
      return <GlobalNeonNightsStyle />;
    case 'MysticPurple':
      return <GlobalMysticPurpleStyle />;
    case 'SunsetGlow':
      return <GlobalSunsetGlowStyle />;
    case 'ForestDream':
      return <GlobalForestDreamStyle />;
    case 'OceanBreeze':
      return <GlobalOceanBreezeStyle />;
    case 'MidnightRose':
      return <GlobalMidnightRoseStyle />;
    case 'ArcticFrost':
      return <GlobalArcticFrostStyle />;
    case 'CherryBlossom':
      return <GlobalCherryBlossomStyle />;
    case 'Volcanic':
      return <GlobalVolcanicStyle />;
    default:
      return <GlobalStyle />;
  }
}

export default ThemeGlobalStyle;

const sharedStyles = css`
  .DeviationInfo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .DeviationStatus {
    font-size: 0.8rem;
    font-weight: 500;
  }

  .DeviationStatus[data-status='optimal'] {
    color: var(--main-arrow-up);
  }

  .DeviationStatus[data-status='warning'] {
    color: var(--warning-text-color);
  }

  .DeviationStatus[data-status='critical'] {
    color: var(--main-arrow-down);
  }

  .DeviationStatus[data-status='default'] {
    color: var(--second-text-color);
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    overscroll-behavior: none;
  }

  #react-container {
    font-family: var(--theme-font-family, ${BASE_FONT_FAMILY});
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    color: var(--main-text-color);
  }

  input,
  textarea,
  select,
  button {
    font: inherit;
  }

  input,
  textarea,
  select {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--input-border-color);
    background: var(--input-bg-color);
    color: var(--main-text-color);
    border-radius: 12px;
    box-shadow: none;
    outline: none;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease,
      color 0.2s ease;
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--placeholder-text-color);
    opacity: 1;
  }

  input:hover,
  textarea:hover,
  select:hover {
    border-color: var(--border-hover-color);
  }

  input:focus,
  textarea:focus,
  select:focus,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    border-color: var(--input-focus-border-color);
    box-shadow: 0 0 0 3px var(--button-hover-bg);
  }

  input:disabled,
  textarea:disabled,
  select:disabled {
    background: var(--disabled-bg-color);
    color: var(--disabled-text-color);
    border-color: var(--border-color);
    cursor: not-allowed;
    opacity: 1;
  }

  input[type='checkbox'],
  input[type='radio'] {
    appearance: auto;
    -webkit-appearance: auto;
    accent-color: var(--primary-accent);
    border-radius: 4px;
    box-shadow: none;
  }

  input[type='color'] {
    appearance: none;
    -webkit-appearance: none;
    min-height: 2.5rem;
    padding: 0.2rem;
    cursor: pointer;
  }

  input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type='color']::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  select {
    background-image:
      linear-gradient(45deg, transparent 50%, var(--second-text-color) 50%),
      linear-gradient(135deg, var(--second-text-color) 50%, transparent 50%);
    background-position:
      calc(100% - 18px) calc(50% - 3px),
      calc(100% - 12px) calc(50% - 3px);
    background-size: 6px 6px, 6px 6px;
    background-repeat: no-repeat;
    padding-right: 2.25rem;
  }

  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.24);
  }

  ::-webkit-scrollbar-thumb {
    width: 5px;
    border-radius: 999px;
    background-color: var(--scrollbar-thumb, var(--border-light-color));
  }
`;

const createTheme = ({ variables, background, scrollbar }) => createGlobalStyle`
  ${sharedStyles}

  :host, :root, #react-container {
    ${variables}
    --scrollbar-thumb: ${scrollbar};
  }

  #react-container {
    background: ${background};
  }
`;

// LITE Mode Theme - Clean, Fresh, Lightweight
const GlobalLiteStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 28%),
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.12), transparent 26%),
    radial-gradient(circle at bottom center, rgba(234, 179, 8, 0.08), transparent 30%),
    linear-gradient(145deg, #0a0f1a 0%, #131c2d 46%, #1f2b40 100%)
  `,
  scrollbar: '#38bdf8',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 28%),
      radial-gradient(circle at top right, rgba(74, 222, 128, 0.12), transparent 26%),
      radial-gradient(circle at bottom center, rgba(234, 179, 8, 0.08), transparent 30%),
      linear-gradient(145deg, #0a0f1a 0%, #131c2d 46%, #1f2b40 100%);
    --primary-color: #e0f2fe;
    --secondary-color: #ccfbf1;
    --primary-accent: #38bdf8;
    --secondary-accent: #4ade80;
    --main-text-color: #f1f5f9;
    --second-text-color: #cbd5e1;
    --error-text-color: #f87171;
    --primary-button-color: #0284c7;
    --secondary-button-color: #16a34a;
    --main-hover-color: rgba(56, 189, 248, 0.14);
    --secondary-hover-color: rgba(74, 222, 128, 0.14);
    --clear-hover-color: rgba(234, 179, 8, 0.12);
    --main-bg-color: rgba(10, 15, 26, 0.88);
    --second-bg-color: rgba(19, 28, 45, 0.8);
    --main-unit-color: #38bdf8;
    --second-unit-color: #4ade80;
    --main-value-color: #e2e8f0;
    --main-bg-nav-color: rgba(10, 15, 26, 0.95);
    --main-bg-card-color: rgba(19, 28, 45, 0.72);
    --main-bg-Innercard-color: rgba(31, 43, 64, 0.56);
    --main-arrow-up: #4ade80;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #4ade80;
    --cannabis-inactive-color: #64748b;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #f59e0b;
    --muted-text-color: #94a3b8;
    --placeholder-text-color: #94a3b8;
    --disabled-text-color: #475569;
    --border-light-color: #334155;
    --focus-color: #38bdf8;
    --chart-primary-color: #38bdf8;
    --chart-secondary-color: #4ade80;
    --chart-success-color: #34d399;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #38bdf8;
    --sensor-humidity-color: #4ade80;
    --sensor-co2-color: #f472b6;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #38bdf8;
    --sensor-ec-color: #34d399;
    --border-color: rgba(56, 189, 248, 0.15);
    --border-hover-color: rgba(74, 222, 128, 0.24);
    --disabled-bg-color: rgba(15, 23, 42, 0.32);
    --active-bg-color: rgba(56, 189, 248, 0.12);
    --pressed-bg-color: rgba(74, 222, 128, 0.16);
    --input-bg-color: rgba(15, 23, 42, 0.62);
    --input-border-color: rgba(56, 189, 248, 0.22);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(56, 189, 248, 0.14);
    --slider-BG-color: linear-gradient(
      to right,
      #38bdf8 0%,
      #4ade80 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #334155 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #334155 100%
    );
    --main-shadow-art: rgba(15, 23, 42, 0.5) 0px 24px 60px,
      rgba(56, 189, 248, 0.1) 0px 10px 24px,
      rgba(74, 222, 128, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(56, 189, 248, 0.28);
    --main-gradient-2: rgba(74, 222, 128, 0.22);
    --main-gradient-3: rgba(234, 179, 8, 0.16);
    --main-gradient-4: rgba(56, 189, 248, 0.14);
    --main-gradient-5: rgba(74, 222, 128, 0.12);
    --glass-bg-primary: rgba(56, 189, 248, 0.06);
    --glass-bg-secondary: rgba(74, 222, 128, 0.04);
    --glass-border: rgba(56, 189, 248, 0.12);
    --glass-border-light: rgba(74, 222, 128, 0.14);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  `,
});

const GlobalStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(16, 185, 129, 0.2), transparent 30%),
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.16), transparent 34%),
    radial-gradient(circle at bottom center, rgba(6, 182, 212, 0.1), transparent 34%),
    linear-gradient(145deg, #07101c 0%, #0d1626 46%, #1b2a3f 100%)
  `,
  scrollbar: '#64748b',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(16, 185, 129, 0.2), transparent 30%),
      radial-gradient(circle at top right, rgba(96, 165, 250, 0.16), transparent 34%),
      radial-gradient(circle at bottom center, rgba(6, 182, 212, 0.1), transparent 34%),
      linear-gradient(145deg, #07101c 0%, #0d1626 46%, #1b2a3f 100%);
    --primary-color: #e2f0ff;
    --secondary-color: #9ae6b4;
    --primary-accent: #14b8a6;
    --secondary-accent: #60a5fa;
    --main-text-color: #f8fbff;
    --second-text-color: #d2dae7;
    --error-text-color: #f87171;
    --primary-button-color: #0f8f7f;
    --secondary-button-color: #2563eb;
    --main-hover-color: rgba(20, 184, 166, 0.14);
    --secondary-hover-color: rgba(96, 165, 250, 0.16);
    --clear-hover-color: rgba(56, 189, 248, 0.12);
    --main-bg-color: rgba(7, 16, 28, 0.86);
    --second-bg-color: rgba(27, 42, 63, 0.74);
    --main-unit-color: #2dd4bf;
    --second-unit-color: #60a5fa;
    --main-value-color: #7dd3fc;
    --main-bg-nav-color: rgba(8, 15, 27, 0.95);
    --main-bg-card-color: rgba(14, 24, 40, 0.62);
    --main-bg-Innercard-color: rgba(27, 42, 63, 0.5);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #ef4444;
    --cannabis-active-color: #22c55e;
    --cannabis-inactive-color: #15803d;
    --warning-color: #f59e0b;
    --warning-text-color: #fbbf24;
    --warning-accent-color: #fb923c;
    --muted-text-color: #9fb0c5;
    --placeholder-text-color: #6d8198;
    --disabled-text-color: #475569;
    --border-light-color: #334155;
    --focus-color: #60a5fa;
    --chart-primary-color: #60a5fa;
    --chart-secondary-color: #14b8a6;
    --chart-success-color: #22c55e;
    --chart-warning-color: #f59e0b;
    --chart-error-color: #ef4444;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #ef4444;
    --sensor-humidity-color: #38bdf8;
    --sensor-co2-color: #8b5cf6;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #2dd4bf;
    --sensor-ec-color: #22c55e;
    --border-color: rgba(255, 255, 255, 0.08);
    --border-hover-color: rgba(255, 255, 255, 0.14);
    --disabled-bg-color: rgba(255, 255, 255, 0.04);
    --active-bg-color: rgba(20, 184, 166, 0.1);
    --pressed-bg-color: rgba(96, 165, 250, 0.12);
    --input-bg-color: rgba(255, 255, 255, 0.045);
    --input-border-color: rgba(255, 255, 255, 0.12);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(20, 184, 166, 0.12);
    --slider-BG-color: linear-gradient(
      to right,
      #5eead4 0%,
      #14b8a6 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #475569 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #475569 100%
    );
    --main-shadow-art: rgba(2, 6, 23, 0.48) 0px 24px 60px,
      rgba(20, 184, 166, 0.1) 0px 10px 24px,
      rgba(96, 165, 250, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(20, 184, 166, 0.3);
    --main-gradient-2: rgba(96, 165, 250, 0.24);
    --main-gradient-3: rgba(34, 197, 94, 0.2);
    --main-gradient-4: rgba(6, 182, 212, 0.18);
    --main-gradient-5: rgba(99, 102, 241, 0.18);
    --glass-bg-primary: rgba(255, 255, 255, 0.045);
    --glass-bg-secondary: rgba(255, 255, 255, 0.025);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-border-light: rgba(255, 255, 255, 0.14);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  `,
});

const GlobalUnicornStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(255, 184, 226, 0.24), transparent 26%),
    radial-gradient(circle at top right, rgba(196, 181, 253, 0.2), transparent 28%),
    radial-gradient(circle at bottom center, rgba(244, 114, 182, 0.12), transparent 30%),
    linear-gradient(145deg, #140f1f 0%, #231533 44%, #332047 100%)
  `,
  scrollbar: '#d8b4fe',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(255, 184, 226, 0.24), transparent 26%),
      radial-gradient(circle at top right, rgba(196, 181, 253, 0.2), transparent 28%),
      radial-gradient(circle at bottom center, rgba(244, 114, 182, 0.12), transparent 30%),
      linear-gradient(145deg, #140f1f 0%, #231533 44%, #332047 100%);
    --primary-color: #fff0fb;
    --secondary-color: #e9d5ff;
    --primary-accent: #fb6dbb;
    --secondary-accent: #c4a2ff;
    --main-text-color: #fff7fd;
    --second-text-color: #f1defd;
    --error-text-color: #f87171;
    --primary-button-color: #e2529f;
    --secondary-button-color: #9d6df5;
    --main-hover-color: rgba(251, 109, 187, 0.18);
    --secondary-hover-color: rgba(196, 162, 255, 0.18);
    --clear-hover-color: rgba(233, 213, 255, 0.14);
    --main-bg-color: rgba(20, 15, 31, 0.9);
    --second-bg-color: rgba(35, 21, 51, 0.82);
    --main-unit-color: #fb6dbb;
    --second-unit-color: #c4a2ff;
    --main-value-color: #ffd4ef;
    --main-bg-nav-color: rgba(20, 15, 31, 0.95);
    --main-bg-card-color: rgba(52, 32, 74, 0.72);
    --main-bg-Innercard-color: rgba(76, 47, 108, 0.56);
    --main-arrow-up: #c4a2ff;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #86efac;
    --cannabis-inactive-color: #a855f7;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #fb7185;
    --muted-text-color: #d3b7f6;
    --placeholder-text-color: #be9bf2;
    --disabled-text-color: #74509f;
    --border-light-color: #7b55b1;
    --focus-color: #fb6dbb;
    --chart-primary-color: #c4a2ff;
    --chart-secondary-color: #fb6dbb;
    --chart-success-color: #86efac;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #9d6df5;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #c4a2ff;
    --sensor-co2-color: #fb6dbb;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #86efac;
    --sensor-ec-color: #e9d5ff;
    --border-color: rgba(196, 162, 255, 0.22);
    --border-hover-color: rgba(251, 109, 187, 0.3);
    --disabled-bg-color: rgba(116, 80, 159, 0.22);
    --active-bg-color: rgba(196, 162, 255, 0.16);
    --pressed-bg-color: rgba(251, 109, 187, 0.22);
    --input-bg-color: rgba(20, 15, 31, 0.66);
    --input-border-color: rgba(196, 162, 255, 0.28);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(251, 109, 187, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #ffc3e3 0%,
      #c4a2ff calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #7b55b1 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #7b55b1 100%
    );
    --main-shadow-art: rgba(15, 10, 25, 0.5) 0px 24px 60px,
      rgba(196, 162, 255, 0.14) 0px 10px 24px,
      rgba(251, 109, 187, 0.1) 0px 2px 10px;
    --main-gradient-1: rgba(255, 184, 226, 0.32);
    --main-gradient-2: rgba(196, 181, 253, 0.26);
    --main-gradient-3: rgba(196, 162, 255, 0.22);
    --main-gradient-4: rgba(251, 109, 187, 0.2);
    --main-gradient-5: rgba(157, 109, 245, 0.18);
    --glass-bg-primary: rgba(20, 15, 31, 0.56);
    --glass-bg-secondary: rgba(52, 32, 74, 0.36);
    --glass-border: rgba(196, 162, 255, 0.18);
    --glass-border-light: rgba(251, 109, 187, 0.22);
    --glass-shadow-inset: inset 0 1px 0 rgba(250, 245, 255, 0.08);
  `,
});

const GlobalAuroraStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(45, 212, 191, 0.22), transparent 26%),
    radial-gradient(circle at top right, rgba(139, 92, 246, 0.18), transparent 30%),
    linear-gradient(145deg, #09111f 0%, #142235 44%, #22354c 100%)
  `,
  scrollbar: '#5eead4',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(45, 212, 191, 0.22), transparent 26%),
      radial-gradient(circle at top right, rgba(139, 92, 246, 0.18), transparent 30%),
      linear-gradient(145deg, #09111f 0%, #142235 44%, #22354c 100%);
    --primary-color: #e6fffb;
    --secondary-color: #99f6e4;
    --primary-accent: #5eead4;
    --secondary-accent: #8b5cf6;
    --main-text-color: #f8fbff;
    --second-text-color: #d5deea;
    --error-text-color: #f87171;
    --primary-button-color: #0f9f96;
    --secondary-button-color: #6d4ae6;
    --main-hover-color: rgba(94, 234, 212, 0.16);
    --secondary-hover-color: rgba(139, 92, 246, 0.16);
    --clear-hover-color: rgba(34, 211, 238, 0.14);
    --main-bg-color: rgba(9, 17, 31, 0.88);
    --second-bg-color: rgba(20, 34, 53, 0.78);
    --main-unit-color: #5eead4;
    --second-unit-color: #38bdf8;
    --main-value-color: #c4b5fd;
    --main-bg-nav-color: rgba(9, 17, 31, 0.95);
    --main-bg-card-color: rgba(20, 34, 53, 0.7);
    --main-bg-Innercard-color: rgba(34, 53, 76, 0.54);
    --main-arrow-up: #5eead4;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #5eead4;
    --cannabis-inactive-color: #8b5cf6;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #f59e0b;
    --muted-text-color: #b8c5d6;
    --placeholder-text-color: #92a4bc;
    --disabled-text-color: #475569;
    --border-light-color: #314458;
    --focus-color: #5eead4;
    --chart-primary-color: #5eead4;
    --chart-secondary-color: #8b5cf6;
    --chart-success-color: #34d399;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #f59e0b;
    --sensor-humidity-color: #5eead4;
    --sensor-co2-color: #8b5cf6;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #38bdf8;
    --sensor-ec-color: #34d399;
    --border-color: rgba(94, 234, 212, 0.18);
    --border-hover-color: rgba(139, 92, 246, 0.24);
    --disabled-bg-color: rgba(9, 17, 31, 0.24);
    --active-bg-color: rgba(94, 234, 212, 0.14);
    --pressed-bg-color: rgba(139, 92, 246, 0.18);
    --input-bg-color: rgba(9, 17, 31, 0.62);
    --input-border-color: rgba(94, 234, 212, 0.22);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(94, 234, 212, 0.14);
    --slider-BG-color: linear-gradient(
      to right,
      #5eead4 0%,
      #8b5cf6 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #334155 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #334155 100%
    );
    --main-shadow-art: rgba(0, 10, 18, 0.54) 0px 24px 60px,
      rgba(94, 234, 212, 0.12) 0px 10px 24px,
      rgba(139, 92, 246, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(94, 234, 212, 0.3);
    --main-gradient-2: rgba(139, 92, 246, 0.24);
    --main-gradient-3: rgba(56, 189, 248, 0.2);
    --main-gradient-4: rgba(167, 139, 250, 0.18);
    --main-gradient-5: rgba(34, 211, 238, 0.18);
    --glass-bg-primary: rgba(9, 17, 31, 0.52);
    --glass-bg-secondary: rgba(20, 34, 53, 0.34);
    --glass-border: rgba(94, 234, 212, 0.14);
    --glass-border-light: rgba(139, 92, 246, 0.16);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  `,
});

const GlobalHackyStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(57, 255, 20, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(0, 255, 163, 0.12), transparent 26%),
    linear-gradient(145deg, #030504 0%, #08100c 45%, #0d1711 100%)
  `,
  scrollbar: '#39ff14',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(57, 255, 20, 0.18), transparent 28%),
      radial-gradient(circle at top right, rgba(0, 255, 163, 0.12), transparent 26%),
      linear-gradient(145deg, #030504 0%, #08100c 45%, #0d1711 100%);
    --primary-color: #d7ffe2;
    --secondary-color: #7fffc5;
    --primary-accent: #1dbf3a;
    --secondary-accent: #00c97a;
    --main-text-color: #c8ffd2;
    --second-text-color: #7df0a3;
    --error-text-color: #ff5c5c;
    --primary-button-color: #136f2b;
    --secondary-button-color: #0c8a58;
    --main-hover-color: rgba(29, 191, 58, 0.16);
    --secondary-hover-color: rgba(0, 201, 122, 0.18);
    --clear-hover-color: rgba(125, 255, 180, 0.12);
    --main-bg-color: rgba(3, 5, 4, 0.92);
    --second-bg-color: rgba(8, 16, 12, 0.84);
    --main-unit-color: #39ff14;
    --second-unit-color: #00ff9c;
    --main-value-color: #dbffe5;
    --main-bg-nav-color: rgba(4, 7, 5, 0.96);
    --main-bg-card-color: rgba(10, 20, 14, 0.72);
    --main-bg-Innercard-color: rgba(16, 33, 23, 0.54);
    --main-arrow-up: #39ff14;
    --main-arrow-down: #ff7a45;
    --cannabis-active-color: #39ff14;
    --cannabis-inactive-color: #2ebf68;
    --warning-color: #facc15;
    --warning-text-color: #facc15;
    --warning-accent-color: #f97316;
    --muted-text-color: #4fd57f;
    --placeholder-text-color: #31b865;
    --disabled-text-color: #1a6b3e;
    --border-light-color: #1f7d49;
    --focus-color: #39ff14;
    --chart-primary-color: #39ff14;
    --chart-secondary-color: #00ff9c;
    --chart-success-color: #22c55e;
    --chart-warning-color: #facc15;
    --chart-error-color: #ef4444;
    --chart-neutral-color: #2c8b54;
    --sensor-temp-color: #ef4444;
    --sensor-humidity-color: #39ff14;
    --sensor-co2-color: #00ff9c;
    --sensor-light-color: #facc15;
    --sensor-ph-color: #34d399;
    --sensor-ec-color: #22c55e;
    --border-color: rgba(29, 191, 58, 0.22);
    --border-hover-color: rgba(0, 201, 122, 0.3);
    --disabled-bg-color: rgba(29, 191, 58, 0.08);
    --active-bg-color: rgba(29, 191, 58, 0.16);
    --pressed-bg-color: rgba(0, 201, 122, 0.2);
    --input-bg-color: rgba(4, 8, 6, 0.74);
    --input-border-color: rgba(29, 191, 58, 0.26);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(29, 191, 58, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #97ff84 0%,
      #39ff14 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #123321 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #123321 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.6) 0px 24px 60px,
      rgba(57, 255, 20, 0.1) 0px 10px 24px,
      rgba(0, 255, 156, 0.06) 0px 2px 10px;
    --main-gradient-1: rgba(57, 255, 20, 0.22);
    --main-gradient-2: rgba(0, 255, 156, 0.18);
    --main-gradient-3: rgba(34, 197, 94, 0.16);
    --main-gradient-4: rgba(18, 76, 44, 0.14);
    --main-gradient-5: rgba(126, 255, 170, 0.1);
    --glass-bg-primary: rgba(5, 9, 7, 0.56);
    --glass-bg-secondary: rgba(10, 20, 14, 0.36);
    --glass-border: rgba(57, 255, 20, 0.12);
    --glass-border-light: rgba(0, 255, 156, 0.16);
    --glass-shadow-inset: inset 0 1px 0 rgba(200, 255, 210, 0.06);
  `,
});

const GlobalSunshineStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(251, 146, 60, 0.24), transparent 28%),
    radial-gradient(circle at top right, rgba(239, 68, 68, 0.2), transparent 30%),
    radial-gradient(circle at bottom center, rgba(245, 158, 11, 0.12), transparent 32%),
    linear-gradient(145deg, #160804 0%, #261007 44%, #3b180d 100%)
  `,
  scrollbar: '#fb923c',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(251, 146, 60, 0.24), transparent 28%),
      radial-gradient(circle at top right, rgba(239, 68, 68, 0.2), transparent 30%),
      radial-gradient(circle at bottom center, rgba(245, 158, 11, 0.12), transparent 32%),
      linear-gradient(145deg, #160804 0%, #261007 44%, #3b180d 100%);
    --primary-color: #ffe2bf;
    --secondary-color: #fdba74;
    --primary-accent: #fb923c;
    --secondary-accent: #f87171;
    --main-text-color: #fff8ef;
    --second-text-color: #ffd7ad;
    --error-text-color: #fca5a5;
    --primary-button-color: #c85a14;
    --secondary-button-color: #c2410c;
    --main-hover-color: rgba(251, 146, 60, 0.2);
    --secondary-hover-color: rgba(248, 113, 113, 0.18);
    --clear-hover-color: rgba(245, 158, 11, 0.14);
    --main-bg-color: rgba(22, 8, 4, 0.92);
    --second-bg-color: rgba(38, 16, 7, 0.84);
    --main-unit-color: #fb923c;
    --second-unit-color: #f87171;
    --main-value-color: #fdba74;
    --main-bg-nav-color: rgba(18, 7, 4, 0.96);
    --main-bg-card-color: rgba(50, 22, 11, 0.7);
    --main-bg-Innercard-color: rgba(72, 31, 16, 0.54);
    --main-arrow-up: #fdba74;
    --main-arrow-down: #ef4444;
    --cannabis-active-color: #fb923c;
    --cannabis-inactive-color: #9a3412;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #f59e0b;
    --muted-text-color: #f6b97a;
    --placeholder-text-color: #d97706;
    --disabled-text-color: #7c2d12;
    --border-light-color: #9a3412;
    --focus-color: #fb923c;
    --chart-primary-color: #fb923c;
    --chart-secondary-color: #f87171;
    --chart-success-color: #fdba74;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #d97706;
    --sensor-temp-color: #ef4444;
    --sensor-humidity-color: #fb923c;
    --sensor-co2-color: #f97316;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #fdba74;
    --sensor-ec-color: #fb923c;
    --border-color: rgba(251, 146, 60, 0.24);
    --border-hover-color: rgba(245, 158, 11, 0.32);
    --disabled-bg-color: rgba(124, 45, 18, 0.28);
    --active-bg-color: rgba(251, 146, 60, 0.18);
    --pressed-bg-color: rgba(248, 113, 113, 0.22);
    --input-bg-color: rgba(22, 8, 4, 0.68);
    --input-border-color: rgba(251, 146, 60, 0.3);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(251, 146, 60, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #fdba74 0%,
      #fb923c calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #7c2d12 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #7c2d12 100%
    );
    --main-shadow-art: rgba(10, 4, 2, 0.54) 0px 24px 60px,
      rgba(251, 146, 60, 0.14) 0px 10px 24px,
      rgba(239, 68, 68, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(251, 146, 60, 0.3);
    --main-gradient-2: rgba(239, 68, 68, 0.24);
    --main-gradient-3: rgba(245, 158, 11, 0.22);
    --main-gradient-4: rgba(253, 186, 116, 0.18);
    --main-gradient-5: rgba(194, 65, 12, 0.16);
    --glass-bg-primary: rgba(22, 8, 4, 0.54);
    --glass-bg-secondary: rgba(50, 22, 11, 0.36);
    --glass-border: rgba(251, 146, 60, 0.18);
    --glass-border-light: rgba(245, 158, 11, 0.22);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 247, 237, 0.08);
  `,
});

const GlobalWhiteStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(120, 53, 15, 0.07), transparent 24%),
    radial-gradient(circle at bottom right, rgba(161, 98, 7, 0.06), transparent 20%),
    linear-gradient(145deg, #fffaf1 0%, #f4ebdc 42%, #e4d3b8 100%)
  `,
  scrollbar: '#8f6b3f',
  variables: css`
    --theme-font-family: Georgia, 'Times New Roman', serif;
    --page-background:
      radial-gradient(circle at top left, rgba(120, 53, 15, 0.07), transparent 24%),
      radial-gradient(circle at bottom right, rgba(161, 98, 7, 0.06), transparent 20%),
      linear-gradient(145deg, #fffaf1 0%, #f4ebdc 42%, #e4d3b8 100%);
    --primary-color: #40291b;
    --secondary-color: #6d4c32;
    --primary-accent: #b07a47;
    --secondary-accent: #c8923a;
    --main-text-color: #24180f;
    --second-text-color: #5e4a38;
    --error-text-color: #dc2626;
    --primary-button-color: #c39263;
    --secondary-button-color: #d7a24b;
    --main-hover-color: rgba(176, 122, 71, 0.14);
    --secondary-hover-color: rgba(200, 146, 58, 0.14);
    --clear-hover-color: rgba(143, 107, 63, 0.08);
    --main-bg-color: rgba(255, 249, 240, 0.92);
    --second-bg-color: rgba(244, 235, 220, 0.94);
    --main-unit-color: #7a4b24;
    --second-unit-color: #a56a1c;
    --main-value-color: #5f4627;
    --main-bg-nav-color: rgba(251, 243, 231, 0.97);
    --main-bg-card-color: rgba(255, 248, 238, 0.94);
    --main-bg-Innercard-color: rgba(238, 225, 205, 0.96);
    --main-arrow-up: #59734b;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #59734b;
    --cannabis-inactive-color: #9d866f;
    --warning-color: #c97a11;
    --warning-text-color: #9f5b07;
    --warning-accent-color: #c2410c;
    --muted-text-color: #76614f;
    --placeholder-text-color: #9a846d;
    --disabled-text-color: #c1af98;
    --border-light-color: #d7c5ad;
    --focus-color: #b07a47;
    --chart-primary-color: #7a4b24;
    --chart-secondary-color: #a56a1c;
    --chart-success-color: #59734b;
    --chart-warning-color: #c97a11;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #9a846d;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #6e6257;
    --sensor-co2-color: #7a4b24;
    --sensor-light-color: #c97a11;
    --sensor-ph-color: #8f6b3f;
    --sensor-ec-color: #59734b;
    --border-color: rgba(109, 76, 50, 0.14);
    --border-hover-color: rgba(109, 76, 50, 0.24);
    --disabled-bg-color: rgba(109, 76, 50, 0.05);
    --active-bg-color: rgba(176, 122, 71, 0.12);
    --pressed-bg-color: rgba(176, 122, 71, 0.18);
    --input-bg-color: rgba(255, 250, 243, 0.96);
    --input-border-color: rgba(143, 107, 63, 0.26);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(176, 122, 71, 0.14);
    --slider-BG-color: linear-gradient(
      to right,
      #d8bc93 0%,
      #7a4b24 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #d7c4a8 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #d7c4a8 100%
    );
    --main-shadow-art: rgba(71, 53, 36, 0.11) 0px 18px 40px,
      rgba(143, 107, 63, 0.1) 0px 5px 14px;
    --main-gradient-1: rgba(255, 249, 240, 0.76);
    --main-gradient-2: rgba(244, 235, 220, 0.66);
    --main-gradient-3: rgba(228, 211, 184, 0.58);
    --main-gradient-4: rgba(215, 197, 173, 0.48);
    --main-gradient-5: rgba(165, 106, 28, 0.2);
    --glass-bg-primary: rgba(255, 250, 243, 0.8);
    --glass-bg-secondary: rgba(244, 235, 220, 0.56);
    --glass-border: rgba(143, 107, 63, 0.18);
    --glass-border-light: rgba(143, 107, 63, 0.26);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.86);
  `,
});

const GlobalOceanStyle = createTheme({
  background: `
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.2), transparent 30%),
    radial-gradient(circle at bottom left, rgba(45, 212, 191, 0.16), transparent 32%),
    linear-gradient(145deg, #02131d 0%, #08283a 46%, #0c425a 100%)
  `,
  scrollbar: '#60a5fa',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top right, rgba(96, 165, 250, 0.2), transparent 30%),
      radial-gradient(circle at bottom left, rgba(45, 212, 191, 0.16), transparent 32%),
      linear-gradient(145deg, #02131d 0%, #08283a 46%, #0c425a 100%);
    --primary-color: #e0f2fe;
    --secondary-color: #93c5fd;
    --primary-accent: #60a5fa;
    --secondary-accent: #2dd4bf;
    --main-text-color: #e6f7ff;
    --second-text-color: #bfe6ff;
    --error-text-color: #f87171;
    --primary-button-color: #2563eb;
    --secondary-button-color: #0f766e;
    --main-hover-color: rgba(96, 165, 250, 0.16);
    --secondary-hover-color: rgba(45, 212, 191, 0.16);
    --clear-hover-color: rgba(56, 189, 248, 0.14);
    --main-bg-color: rgba(2, 19, 29, 0.88);
    --second-bg-color: rgba(8, 40, 58, 0.78);
    --main-unit-color: #2dd4bf;
    --second-unit-color: #60a5fa;
    --main-value-color: #93c5fd;
    --main-bg-nav-color: rgba(2, 19, 29, 0.95);
    --main-bg-card-color: rgba(8, 44, 64, 0.66);
    --main-bg-Innercard-color: rgba(12, 67, 90, 0.5);
    --main-arrow-up: #34d399;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #2dd4bf;
    --cannabis-inactive-color: #60a5fa;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #f59e0b;
    --muted-text-color: #8ecae6;
    --placeholder-text-color: #60a5fa;
    --disabled-text-color: #155e75;
    --border-light-color: #1d4f6b;
    --focus-color: #60a5fa;
    --chart-primary-color: #60a5fa;
    --chart-secondary-color: #2dd4bf;
    --chart-success-color: #34d399;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #0ea5e9;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #60a5fa;
    --sensor-co2-color: #2dd4bf;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #34d399;
    --sensor-ec-color: #2dd4bf;
    --border-color: rgba(96, 165, 250, 0.2);
    --border-hover-color: rgba(45, 212, 191, 0.26);
    --disabled-bg-color: rgba(21, 94, 117, 0.18);
    --active-bg-color: rgba(96, 165, 250, 0.14);
    --pressed-bg-color: rgba(45, 212, 191, 0.18);
    --input-bg-color: rgba(2, 19, 29, 0.64);
    --input-border-color: rgba(96, 165, 250, 0.24);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(96, 165, 250, 0.16);
    --slider-BG-color: linear-gradient(
      to right,
      #93c5fd 0%,
      #60a5fa calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #164e63 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #164e63 100%
    );
    --main-shadow-art: rgba(2, 15, 26, 0.54) 0px 24px 60px,
      rgba(96, 165, 250, 0.12) 0px 10px 24px,
      rgba(45, 212, 191, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(96, 165, 250, 0.26);
    --main-gradient-2: rgba(45, 212, 191, 0.22);
    --main-gradient-3: rgba(56, 189, 248, 0.2);
    --main-gradient-4: rgba(14, 165, 233, 0.18);
    --main-gradient-5: rgba(147, 197, 253, 0.14);
    --glass-bg-primary: rgba(2, 19, 29, 0.54);
    --glass-bg-secondary: rgba(8, 44, 64, 0.34);
    --glass-border: rgba(96, 165, 250, 0.14);
    --glass-border-light: rgba(45, 212, 191, 0.18);
    --glass-shadow-inset: inset 0 1px 0 rgba(224, 247, 250, 0.08);
  `,
});

const GlobalCyberStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(255, 0, 128, 0.26), transparent 28%),
    radial-gradient(circle at top right, rgba(0, 229, 255, 0.2), transparent 30%),
    linear-gradient(145deg, #04040a 0%, #090912 42%, #141423 100%)
  `,
  scrollbar: '#ff2d95',
  variables: css`
    --theme-font-family: 'Trebuchet MS', Verdana, sans-serif;
    --page-background:
      radial-gradient(circle at top left, rgba(255, 0, 128, 0.26), transparent 28%),
      radial-gradient(circle at top right, rgba(0, 229, 255, 0.2), transparent 30%),
      linear-gradient(145deg, #04040a 0%, #090912 42%, #141423 100%);
    --primary-color: #ffe4f2;
    --secondary-color: #7de7ff;
    --primary-accent: #ff2d95;
    --secondary-accent: #00d9ff;
    --main-text-color: #f3f6ff;
    --second-text-color: #b8c7dd;
    --error-text-color: #ff4d6d;
    --primary-button-color: #c2185b;
    --secondary-button-color: #0077c8;
    --main-hover-color: rgba(255, 45, 149, 0.18);
    --secondary-hover-color: rgba(0, 217, 255, 0.16);
    --clear-hover-color: rgba(0, 217, 255, 0.12);
    --main-bg-color: rgba(6, 6, 14, 0.92);
    --second-bg-color: rgba(18, 18, 34, 0.84);
    --main-unit-color: #ff2d95;
    --second-unit-color: #00d9ff;
    --main-value-color: #89efff;
    --main-bg-nav-color: rgba(5, 5, 12, 0.96);
    --main-bg-card-color: rgba(18, 18, 34, 0.72);
    --main-bg-Innercard-color: rgba(28, 28, 52, 0.56);
    --main-arrow-up: #00d9ff;
    --main-arrow-down: #ff4d6d;
    --cannabis-active-color: #00ff9f;
    --cannabis-inactive-color: #ff7a00;
    --warning-color: #ffcc00;
    --warning-text-color: #ffd84d;
    --warning-accent-color: #ff9f1c;
    --muted-text-color: #7f8aa8;
    --placeholder-text-color: #5f6884;
    --disabled-text-color: #39425a;
    --border-light-color: #2b3350;
    --focus-color: #00d9ff;
    --chart-primary-color: #00d9ff;
    --chart-secondary-color: #ff2d95;
    --chart-success-color: #00ff9f;
    --chart-warning-color: #ffcc00;
    --chart-error-color: #ff4d6d;
    --chart-neutral-color: #ff7a00;
    --sensor-temp-color: #ff4d6d;
    --sensor-humidity-color: #00d9ff;
    --sensor-co2-color: #ff2d95;
    --sensor-light-color: #ffcc00;
    --sensor-ph-color: #00ff9f;
    --sensor-ec-color: #38bdf8;
    --border-color: rgba(255, 45, 149, 0.22);
    --border-hover-color: rgba(0, 217, 255, 0.26);
    --disabled-bg-color: rgba(20, 20, 30, 0.56);
    --active-bg-color: rgba(255, 45, 149, 0.16);
    --pressed-bg-color: rgba(0, 217, 255, 0.18);
    --input-bg-color: rgba(6, 6, 14, 0.76);
    --input-border-color: rgba(255, 45, 149, 0.28);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(255, 45, 149, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #89efff 0%,
      #00d9ff calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #3b4360 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #3b4360 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.64) 0px 24px 60px,
      rgba(255, 45, 149, 0.16) 0px 10px 26px,
      rgba(0, 217, 255, 0.1) 0px 2px 12px;
    --main-gradient-1: rgba(255, 45, 149, 0.3);
    --main-gradient-2: rgba(0, 217, 255, 0.24);
    --main-gradient-3: rgba(255, 77, 109, 0.2);
    --main-gradient-4: rgba(56, 189, 248, 0.18);
    --main-gradient-5: rgba(255, 122, 0, 0.14);
    --glass-bg-primary: rgba(6, 6, 14, 0.58);
    --glass-bg-secondary: rgba(18, 18, 34, 0.38);
    --glass-border: rgba(255, 45, 149, 0.18);
    --glass-border-light: rgba(0, 217, 255, 0.2);
    --glass-shadow-inset: inset 0 1px 0 rgba(232, 244, 248, 0.06);
  `,
});

const GlobalDarkModeStyle = createTheme({
  background: `
    radial-gradient(circle at top center, rgba(96, 165, 250, 0.1), transparent 30%),
    radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.08), transparent 28%),
    linear-gradient(145deg, #06070b 0%, #0d1016 44%, #171b23 100%)
  `,
  scrollbar: '#475569',
  variables: css`
    --theme-font-family: 'Segoe UI', Tahoma, sans-serif;
    --page-background:
      radial-gradient(circle at top center, rgba(96, 165, 250, 0.1), transparent 30%),
      radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.08), transparent 28%),
      linear-gradient(145deg, #06070b 0%, #0d1016 44%, #171b23 100%);
    --primary-color: #f8fafc;
    --secondary-color: #cbd5e1;
    --primary-accent: #4ade80;
    --secondary-accent: #60a5fa;
    --main-text-color: #f5f7fb;
    --second-text-color: #cdd5e2;
    --error-text-color: #f87171;
    --primary-button-color: #15803d;
    --secondary-button-color: #2563eb;
    --main-hover-color: rgba(74, 222, 128, 0.14);
    --secondary-hover-color: rgba(96, 165, 250, 0.14);
    --clear-hover-color: rgba(148, 163, 184, 0.1);
    --main-bg-color: rgba(6, 7, 11, 0.9);
    --second-bg-color: rgba(13, 16, 22, 0.82);
    --main-unit-color: #4ade80;
    --second-unit-color: #60a5fa;
    --main-value-color: #e2e8f0;
    --main-bg-nav-color: rgba(6, 7, 11, 0.96);
    --main-bg-card-color: rgba(13, 16, 22, 0.72);
    --main-bg-Innercard-color: rgba(23, 27, 35, 0.56);
    --main-arrow-up: #4ade80;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #4ade80;
    --cannabis-inactive-color: #64748b;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #f59e0b;
    --muted-text-color: #94a3b8;
    --placeholder-text-color: #64748b;
    --disabled-text-color: #334155;
    --border-light-color: #334155;
    --focus-color: #4ade80;
    --chart-primary-color: #60a5fa;
    --chart-secondary-color: #4ade80;
    --chart-success-color: #34d399;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #60a5fa;
    --sensor-co2-color: #8b5cf6;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #4ade80;
    --sensor-ec-color: #60a5fa;
    --border-color: rgba(255, 255, 255, 0.08);
    --border-hover-color: rgba(255, 255, 255, 0.12);
    --disabled-bg-color: rgba(255, 255, 255, 0.04);
    --active-bg-color: rgba(74, 222, 128, 0.1);
    --pressed-bg-color: rgba(96, 165, 250, 0.12);
    --input-bg-color: rgba(6, 7, 11, 0.68);
    --input-border-color: rgba(255, 255, 255, 0.1);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(74, 222, 128, 0.1);
    --slider-BG-color: linear-gradient(
      to right,
      #86efac 0%,
      #4ade80 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #334155 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #334155 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.56) 0px 24px 60px,
      rgba(74, 222, 128, 0.06) 0px 10px 24px,
      rgba(96, 165, 250, 0.05) 0px 2px 8px;
    --main-gradient-1: rgba(74, 222, 128, 0.16);
    --main-gradient-2: rgba(96, 165, 250, 0.14);
    --main-gradient-3: rgba(52, 211, 153, 0.12);
    --main-gradient-4: rgba(23, 27, 35, 0.24);
    --main-gradient-5: rgba(51, 65, 85, 0.18);
    --glass-bg-primary: rgba(6, 7, 11, 0.54);
    --glass-bg-secondary: rgba(13, 16, 22, 0.34);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-border-light: rgba(255, 255, 255, 0.12);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  `,
});

const GlobalCrystalStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(6, 182, 212, 0.06), transparent 28%),
    linear-gradient(145deg, #ffffff 0%, #f8fafc 46%, #f1f5f9 100%)
  `,
  scrollbar: '#3b82f6',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 30%),
      radial-gradient(circle at top right, rgba(6, 182, 212, 0.06), transparent 28%),
      linear-gradient(145deg, #ffffff 0%, #f8fafc 46%, #f1f5f9 100%);
    --primary-color: #1f2937;
    --secondary-color: #4b5563;
    --primary-accent: #3b82f6;
    --secondary-accent: #06b6d4;
    --main-text-color: #111827;
    --second-text-color: #374151;
    --error-text-color: #dc2626;
    --primary-button-color: #3b82f6;
    --secondary-button-color: #06b6d4;
    --main-hover-color: rgba(59, 130, 246, 0.1);
    --secondary-hover-color: rgba(6, 182, 212, 0.1);
    --clear-hover-color: rgba(59, 130, 246, 0.08);
    --main-bg-color: rgba(255, 255, 255, 0.98);
    --second-bg-color: rgba(248, 250, 252, 0.95);
    --main-unit-color: #3b82f6;
    --second-unit-color: #06b6d4;
    --main-value-color: #1e40af;
    --main-bg-nav-color: rgba(255, 255, 255, 0.99);
    --main-bg-card-color: rgba(255, 255, 255, 0.95);
    --main-bg-Innercard-color: rgba(248, 250, 252, 0.92);
    --main-arrow-up: #16a34a;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #16a34a;
    --cannabis-inactive-color: #6b7280;
    --warning-color: #f59e0b;
    --warning-text-color: #d97706;
    --warning-accent-color: #ea580c;
    --muted-text-color: #6b7280;
    --placeholder-text-color: #9ca3af;
    --disabled-text-color: #d1d5db;
    --border-light-color: #94a3b8;
    --focus-color: #3b82f6;
    --chart-primary-color: #3b82f6;
    --chart-secondary-color: #06b6d4;
    --chart-success-color: #16a34a;
    --chart-warning-color: #f59e0b;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #6b7280;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #3b82f6;
    --sensor-co2-color: #06b6d4;
    --sensor-light-color: #f59e0b;
    --sensor-ph-color: #16a34a;
    --sensor-ec-color: #06b6d4;
    --border-color: #cbd5e1;
    --border-hover-color: #3b82f6;
    --disabled-bg-color: #f1f5f9;
    --active-bg-color: rgba(59, 130, 246, 0.12);
    --pressed-bg-color: rgba(6, 182, 212, 0.16);
    --input-bg-color: rgba(255, 255, 255, 0.98);
    --input-border-color: #cbd5e1;
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(59, 130, 246, 0.1);
    --slider-BG-color: linear-gradient(
      to right,
      #60a5fa 0%,
      #3b82f6 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e2e8f0 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e2e8f0 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.1) 0px 8px 24px,
      rgba(59, 130, 246, 0.08) 0px 4px 12px,
      rgba(0, 0, 0, 0.04) 0px 2px 4px;
    --main-gradient-1: rgba(59, 130, 246, 0.12);
    --main-gradient-2: rgba(6, 182, 212, 0.1);
    --main-gradient-3: rgba(16, 163, 74, 0.08);
    --main-gradient-4: rgba(59, 130, 246, 0.06);
    --main-gradient-5: rgba(6, 182, 212, 0.04);
    --glass-bg-primary: rgba(255, 255, 255, 0.9);
    --glass-bg-secondary: rgba(248, 250, 252, 0.8);
    --glass-border: rgba(203, 213, 225, 0.6);
    --glass-border-light: rgba(59, 130, 246, 0.3);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  `,
});

const GlobalLuminaStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.12), transparent 32%),
    radial-gradient(circle at top right, rgba(253, 230, 138, 0.1), transparent 30%),
    linear-gradient(145deg, #fafbfc 0%, #f5f6f8 46%, #eef0f4 100%)
  `,
  scrollbar: '#f59e0b',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(251, 191, 36, 0.12), transparent 32%),
      radial-gradient(circle at top right, rgba(253, 230, 138, 0.1), transparent 30%),
      linear-gradient(145deg, #fafbfc 0%, #f5f6f8 46%, #eef0f4 100%);
    --primary-color: #1e293b;
    --secondary-color: #475569;
    --primary-accent: #f59e0b;
    --secondary-accent: #d97706;
    --main-text-color: #0f172a;
    --second-text-color: #334155;
    --error-text-color: #dc2626;
    --primary-button-color: #f59e0b;
    --secondary-button-color: #d97706;
    --main-hover-color: rgba(251, 191, 36, 0.12);
    --secondary-hover-color: rgba(217, 119, 6, 0.14);
    --clear-hover-color: rgba(251, 191, 36, 0.1);
    --main-bg-color: rgba(255, 255, 255, 0.96);
    --second-bg-color: rgba(250, 251, 252, 0.94);
    --main-unit-color: #f59e0b;
    --second-unit-color: #d97706;
    --main-value-color: #b45309;
    --main-bg-nav-color: rgba(255, 255, 255, 0.98);
    --main-bg-card-color: rgba(255, 255, 255, 0.94);
    --main-bg-Innercard-color: rgba(250, 251, 252, 0.9);
    --main-arrow-up: #16a34a;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #f59e0b;
    --cannabis-inactive-color: #64748b;
    --warning-color: #ea580c;
    --warning-text-color: #c2410c;
    --warning-accent-color: #dc2626;
    --muted-text-color: #64748b;
    --placeholder-text-color: #94a3b8;
    --disabled-text-color: #cbd5e1;
    --border-light-color: #e2e8f0;
    --focus-color: #f59e0b;
    --chart-primary-color: #f59e0b;
    --chart-secondary-color: #d97706;
    --chart-success-color: #16a34a;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #f59e0b;
    --sensor-co2-color: #d97706;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #16a34a;
    --sensor-ec-color: #f59e0b;
    --border-color: #e2e8f0;
    --border-hover-color: #f59e0b;
    --disabled-bg-color: #f1f5f9;
    --active-bg-color: rgba(251, 191, 36, 0.14);
    --pressed-bg-color: rgba(217, 119, 6, 0.18);
    --input-bg-color: rgba(255, 255, 255, 0.96);
    --input-border-color: #e2e8f0;
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(251, 191, 36, 0.12);
    --slider-BG-color: linear-gradient(
      to right,
      #fcd34d 0%,
      #f59e0b calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e2e8f0 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e2e8f0 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.08) 0px 8px 24px,
      rgba(251, 191, 36, 0.08) 0px 4px 12px,
      rgba(0, 0, 0, 0.04) 0px 2px 4px;
    --main-gradient-1: rgba(251, 191, 36, 0.14);
    --main-gradient-2: rgba(253, 230, 138, 0.12);
    --main-gradient-3: rgba(16, 163, 74, 0.1);
    --main-gradient-4: rgba(251, 191, 36, 0.08);
    --main-gradient-5: rgba(217, 119, 6, 0.06);
    --glass-bg-primary: rgba(255, 255, 255, 0.85);
    --glass-bg-secondary: rgba(250, 251, 252, 0.75);
    --glass-border: rgba(226, 232, 240, 0.7);
    --glass-border-light: rgba(251, 191, 36, 0.25);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  `,
});

const GlobalRadianceStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.1), transparent 34%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 32%),
    radial-gradient(circle at bottom center, rgba(16, 185, 129, 0.06), transparent 28%),
    linear-gradient(145deg, #fafafa 0%, #f4f5f7 46%, #eef0f3 100%)
  `,
  scrollbar: '#22c55e',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(34, 197, 94, 0.1), transparent 34%),
      radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 32%),
      radial-gradient(circle at bottom center, rgba(16, 185, 129, 0.06), transparent 28%),
      linear-gradient(145deg, #fafafa 0%, #f4f5f7 46%, #eef0f3 100%);
    --primary-color: #1a1a2e;
    --secondary-color: #2d3748;
    --primary-accent: #22c55e;
    --secondary-accent: #38bdf8;
    --main-text-color: #0f172a;
    --second-text-color: #1e293b;
    --error-text-color: #dc2626;
    --primary-button-color: #22c55e;
    --secondary-button-color: #38bdf8;
    --main-hover-color: rgba(34, 197, 94, 0.12);
    --secondary-hover-color: rgba(56, 189, 248, 0.14);
    --clear-hover-color: rgba(34, 197, 94, 0.1);
    --main-bg-color: rgba(255, 255, 255, 0.97);
    --second-bg-color: rgba(250, 250, 250, 0.95);
    --main-unit-color: #22c55e;
    --second-unit-color: #38bdf8;
    --main-value-color: #15803d;
    --main-bg-nav-color: rgba(255, 255, 255, 0.99);
    --main-bg-card-color: rgba(255, 255, 255, 0.95);
    --main-bg-Innercard-color: rgba(250, 250, 250, 0.92);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #22c55e;
    --cannabis-inactive-color: #64748b;
    --warning-color: #f59e0b;
    --warning-text-color: #d97706;
    --warning-accent-color: #ea580c;
    --muted-text-color: #64748b;
    --placeholder-text-color: #94a3b8;
    --disabled-text-color: #cbd5e1;
    --border-light-color: #e2e8f0;
    --focus-color: #22c55e;
    --chart-primary-color: #38bdf8;
    --chart-secondary-color: #22c55e;
    --chart-success-color: #16a34a;
    --chart-warning-color: #f59e0b;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #38bdf8;
    --sensor-co2-color: #22c55e;
    --sensor-light-color: #f59e0b;
    --sensor-ph-color: #16a34a;
    --sensor-ec-color: #22c55e;
    --border-color: #e2e8f0;
    --border-hover-color: #22c55e;
    --disabled-bg-color: #f1f5f9;
    --active-bg-color: rgba(34, 197, 94, 0.14);
    --pressed-bg-color: rgba(56, 189, 248, 0.18);
    --input-bg-color: rgba(255, 255, 255, 0.97);
    --input-border-color: #e2e8f0;
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(34, 197, 94, 0.12);
    --slider-BG-color: linear-gradient(
      to right,
      #4ade80 0%,
      #22c55e calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e2e8f0 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e2e8f0 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.06) 0px 8px 24px,
      rgba(34, 197, 94, 0.06) 0px 4px 12px,
      rgba(0, 0, 0, 0.03) 0px 2px 4px;
    --main-gradient-1: rgba(34, 197, 94, 0.12);
    --main-gradient-2: rgba(56, 189, 248, 0.1);
    --main-gradient-3: rgba(16, 185, 129, 0.08);
    --main-gradient-4: rgba(34, 197, 94, 0.06);
    --main-gradient-5: rgba(56, 189, 248, 0.04);
    --glass-bg-primary: rgba(255, 255, 255, 0.88);
    --glass-bg-secondary: rgba(250, 250, 250, 0.78);
    --glass-border: rgba(226, 232, 240, 0.68);
    --glass-border-light: rgba(34, 197, 94, 0.22);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.94);
  `,
});

const GlobalNeonNightsStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(236, 72, 153, 0.2), transparent 32%),
    radial-gradient(circle at top right, rgba(6, 182, 212, 0.16), transparent 30%),
    linear-gradient(145deg, #0a0a0f 0%, #13131a 46%, #1c1c26 100%)
  `,
  scrollbar: '#ec4899',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(236, 72, 153, 0.2), transparent 32%),
      radial-gradient(circle at top right, rgba(6, 182, 212, 0.16), transparent 30%),
      linear-gradient(145deg, #0a0a0f 0%, #13131a 46%, #1c1c26 100%);
    --primary-color: #fce7f3;
    --secondary-color: #cffafe;
    --primary-accent: #ec4899;
    --secondary-accent: #06b6d4;
    --main-text-color: #fdf2f8;
    --second-text-color: #e5e7eb;
    --error-text-color: #f87171;
    --primary-button-color: #ec4899;
    --secondary-button-color: #06b6d4;
    --main-hover-color: rgba(236, 72, 153, 0.18);
    --secondary-hover-color: rgba(6, 182, 212, 0.2);
    --clear-hover-color: rgba(6, 182, 212, 0.12);
    --main-bg-color: rgba(10, 10, 15, 0.94);
    --second-bg-color: rgba(19, 19, 26, 0.86);
    --main-unit-color: #ec4899;
    --second-unit-color: #06b6d4;
    --main-value-color: #f0abfc;
    --main-bg-nav-color: rgba(10, 10, 15, 0.97);
    --main-bg-card-color: rgba(19, 19, 26, 0.74);
    --main-bg-Innercard-color: rgba(28, 28, 38, 0.58);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #22c55e;
    --cannabis-inactive-color: #737373;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #fb923c;
    --muted-text-color: #a1a1aa;
    --placeholder-text-color: #71717a;
    --disabled-text-color: #52525b;
    --border-light-color: #3f3f46;
    --focus-color: #ec4899;
    --chart-primary-color: #ec4899;
    --chart-secondary-color: #06b6d4;
    --chart-success-color: #22c55e;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #71717a;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #06b6d4;
    --sensor-co2-color: #ec4899;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #22c55e;
    --sensor-ec-color: #06b6d4;
    --border-color: rgba(236, 72, 153, 0.22);
    --border-hover-color: rgba(6, 182, 212, 0.3);
    --disabled-bg-color: rgba(82, 82, 91, 0.24);
    --active-bg-color: rgba(236, 72, 153, 0.16);
    --pressed-bg-color: rgba(6, 182, 212, 0.22);
    --input-bg-color: rgba(10, 10, 15, 0.72);
    --input-border-color: rgba(236, 72, 153, 0.26);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(236, 72, 153, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #f9a8d4 0%,
      #ec4899 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #27272a calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #27272a 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.64) 0px 24px 60px,
      rgba(236, 72, 153, 0.16) 0px 10px 24px,
      rgba(6, 182, 212, 0.1) 0px 2px 10px;
    --main-gradient-1: rgba(236, 72, 153, 0.26);
    --main-gradient-2: rgba(6, 182, 212, 0.22);
    --main-gradient-3: rgba(34, 197, 94, 0.18);
    --main-gradient-4: rgba(6, 182, 212, 0.14);
    --main-gradient-5: rgba(236, 72, 153, 0.12);
    --glass-bg-primary: rgba(10, 10, 15, 0.58);
    --glass-bg-secondary: rgba(19, 19, 26, 0.38);
    --glass-border: rgba(236, 72, 153, 0.18);
    --glass-border-light: rgba(6, 182, 212, 0.22);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  `,
});

const GlobalMysticPurpleStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(139, 92, 246, 0.22), transparent 30%),
    radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 28%),
    linear-gradient(145deg, #0f0a1e 0%, #1a1235 44%, #251a42 100%)
  `,
  scrollbar: '#a78bfa',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(139, 92, 246, 0.22), transparent 30%),
      radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 28%),
      linear-gradient(145deg, #0f0a1e 0%, #1a1235 44%, #251a42 100%);
    --primary-color: #ede9fe;
    --secondary-color: #ddd6fe;
    --primary-accent: #a78bfa;
    --secondary-accent: #c084fc;
    --main-text-color: #faf5ff;
    --second-text-color: #e9d5ff;
    --error-text-color: #f87171;
    --primary-button-color: #7c3aed;
    --secondary-button-color: #9333ea;
    --main-hover-color: rgba(139, 92, 246, 0.16);
    --secondary-hover-color: rgba(168, 85, 247, 0.18);
    --clear-hover-color: rgba(192, 132, 252, 0.12);
    --main-bg-color: rgba(15, 10, 30, 0.92);
    --second-bg-color: rgba(26, 18, 53, 0.84);
    --main-unit-color: #a78bfa;
    --second-unit-color: #c084fc;
    --main-value-color: #e9d5ff;
    --main-bg-nav-color: rgba(15, 10, 30, 0.96);
    --main-bg-card-color: rgba(26, 18, 53, 0.72);
    --main-bg-Innercard-color: rgba(37, 26, 66, 0.56);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #a78bfa;
    --cannabis-inactive-color: #6b7280;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #fb923c;
    --muted-text-color: #a78bfa;
    --placeholder-text-color: #8b5cf6;
    --disabled-text-color: #6d28d9;
    --border-light-color: #5b21b6;
    --focus-color: #a78bfa;
    --chart-primary-color: #a78bfa;
    --chart-secondary-color: #c084fc;
    --chart-success-color: #34d399;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #7c3aed;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #a78bfa;
    --sensor-co2-color: #c084fc;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #34d399;
    --sensor-ec-color: #22c55e;
    --border-color: rgba(139, 92, 246, 0.24);
    --border-hover-color: rgba(168, 85, 247, 0.3);
    --disabled-bg-color: rgba(109, 40, 217, 0.22);
    --active-bg-color: rgba(139, 92, 246, 0.14);
    --pressed-bg-color: rgba(168, 85, 247, 0.18);
    --input-bg-color: rgba(15, 10, 30, 0.66);
    --input-border-color: rgba(139, 92, 246, 0.28);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(139, 92, 246, 0.16);
    --slider-BG-color: linear-gradient(
      to right,
      #c4b5fd 0%,
      #a78bfa calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #4c1d95 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #4c1d95 100%
    );
    --main-shadow-art: rgba(15, 10, 30, 0.56) 0px 24px 60px,
      rgba(139, 92, 246, 0.12) 0px 10px 24px,
      rgba(168, 85, 247, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(139, 92, 246, 0.28);
    --main-gradient-2: rgba(168, 85, 247, 0.24);
    --main-gradient-3: rgba(192, 132, 252, 0.2);
    --main-gradient-4: rgba(167, 139, 250, 0.18);
    --main-gradient-5: rgba(124, 58, 237, 0.14);
    --glass-bg-primary: rgba(15, 10, 30, 0.54);
    --glass-bg-secondary: rgba(26, 18, 53, 0.34);
    --glass-border: rgba(139, 92, 246, 0.16);
    --glass-border-light: rgba(168, 85, 247, 0.2);
    --glass-shadow-inset: inset 0 1px 0 rgba(250, 245, 255, 0.06);
  `,
});

const GlobalSunsetGlowStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.28), transparent 30%),
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.24), transparent 32%),
    radial-gradient(circle at bottom center, rgba(234, 179, 8, 0.16), transparent 28%),
    linear-gradient(145deg, #1a1508 0%, #2d240d 44%, #403412 100%)
  `,
  scrollbar: '#facc15',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(250, 204, 21, 0.28), transparent 30%),
      radial-gradient(circle at top right, rgba(251, 146, 60, 0.24), transparent 32%),
      radial-gradient(circle at bottom center, rgba(234, 179, 8, 0.16), transparent 28%),
      linear-gradient(145deg, #1a1508 0%, #2d240d 44%, #403412 100%);
    --primary-color: #fef9c3;
    --secondary-color: #fde047;
    --primary-accent: #facc15;
    --secondary-accent: #fb923c;
    --main-text-color: #fefce8;
    --second-text-color: #fef08a;
    --error-text-color: #fca5a5;
    --primary-button-color: #eab308;
    --secondary-button-color: #f97316;
    --main-hover-color: rgba(250, 204, 21, 0.22);
    --secondary-hover-color: rgba(251, 146, 60, 0.2);
    --clear-hover-color: rgba(253, 224, 71, 0.14);
    --main-bg-color: rgba(26, 21, 8, 0.92);
    --second-bg-color: rgba(45, 36, 13, 0.84);
    --main-unit-color: #facc15;
    --second-unit-color: #fb923c;
    --main-value-color: #fde047;
    --main-bg-nav-color: rgba(26, 21, 8, 0.96);
    --main-bg-card-color: rgba(45, 36, 13, 0.72);
    --main-bg-Innercard-color: rgba(64, 52, 18, 0.56);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #ef4444;
    --cannabis-active-color: #facc15;
    --cannabis-inactive-color: #854d0e;
    --warning-color: #f97316;
    --warning-text-color: #fdba74;
    --warning-accent-color: #ea580c;
    --muted-text-color: #fde047;
    --placeholder-text-color: #ca8a04;
    --disabled-text-color: #a16207;
    --border-light-color: #a16207;
    --focus-color: #facc15;
    --chart-primary-color: #facc15;
    --chart-secondary-color: #fb923c;
    --chart-success-color: #22c55e;
    --chart-warning-color: #f97316;
    --chart-error-color: #ef4444;
    --chart-neutral-color: #ca8a04;
    --sensor-temp-color: #ef4444;
    --sensor-humidity-color: #facc15;
    --sensor-co2-color: #fb923c;
    --sensor-light-color: #fde047;
    --sensor-ph-color: #22c55e;
    --sensor-ec-color: #facc15;
    --border-color: rgba(250, 204, 21, 0.28);
    --border-hover-color: rgba(251, 146, 60, 0.36);
    --disabled-bg-color: rgba(161, 98, 7, 0.32);
    --active-bg-color: rgba(250, 204, 21, 0.2);
    --pressed-bg-color: rgba(251, 146, 60, 0.26);
    --input-bg-color: rgba(26, 21, 8, 0.68);
    --input-border-color: rgba(250, 204, 21, 0.34);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(250, 204, 21, 0.2);
    --slider-BG-color: linear-gradient(
      to right,
      #fde047 0%,
      #facc15 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #713f12 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #713f12 100%
    );
    --main-shadow-art: rgba(10, 8, 2, 0.56) 0px 24px 60px,
      rgba(250, 204, 21, 0.16) 0px 10px 24px,
      rgba(251, 146, 60, 0.1) 0px 2px 10px;
    --main-gradient-1: rgba(250, 204, 21, 0.34);
    --main-gradient-2: rgba(251, 146, 60, 0.28);
    --main-gradient-3: rgba(234, 179, 8, 0.24);
    --main-gradient-4: rgba(253, 224, 71, 0.2);
    --main-gradient-5: rgba(202, 138, 4, 0.18);
    --glass-bg-primary: rgba(26, 21, 8, 0.56);
    --glass-bg-secondary: rgba(45, 36, 13, 0.38);
    --glass-border: rgba(250, 204, 21, 0.22);
    --glass-border-light: rgba(251, 146, 60, 0.26);
    --glass-shadow-inset: inset 0 1px 0 rgba(254, 252, 232, 0.08);
  `,
});

const GlobalForestDreamStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 32%),
    radial-gradient(circle at top right, rgba(132, 204, 22, 0.14), transparent 30%),
    linear-gradient(145deg, #0a1a0a 0%, #122d12 46%, #1a3a1a 100%)
  `,
  scrollbar: '#22c55e',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 32%),
      radial-gradient(circle at top right, rgba(132, 204, 22, 0.14), transparent 30%),
      linear-gradient(145deg, #0a1a0a 0%, #122d12 46%, #1a3a1a 100%);
    --primary-color: #dcfce7;
    --secondary-color: #ecfccb;
    --primary-accent: #22c55e;
    --secondary-accent: #84cc16;
    --main-text-color: #f0fdf4;
    --second-text-color: #bbf7d0;
    --error-text-color: #f87171;
    --primary-button-color: #16a34a;
    --secondary-button-color: #65a30d;
    --main-hover-color: rgba(34, 197, 94, 0.16);
    --secondary-hover-color: rgba(132, 204, 22, 0.18);
    --clear-hover-color: rgba(74, 222, 128, 0.12);
    --main-bg-color: rgba(10, 26, 10, 0.92);
    --second-bg-color: rgba(18, 45, 18, 0.84);
    --main-unit-color: #22c55e;
    --second-unit-color: #84cc16;
    --main-value-color: #86efac;
    --main-bg-nav-color: rgba(10, 26, 10, 0.96);
    --main-bg-card-color: rgba(18, 45, 18, 0.72);
    --main-bg-Innercard-color: rgba(26, 58, 26, 0.56);
    --main-arrow-up: #4ade80;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #22c55e;
    --cannabis-inactive-color: #166534;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #fb923c;
    --muted-text-color: #6ee7b7;
    --placeholder-text-color: #4ade80;
    --disabled-text-color: #14532d;
    --border-light-color: #15803d;
    --focus-color: #22c55e;
    --chart-primary-color: #22c55e;
    --chart-secondary-color: #84cc16;
    --chart-success-color: #4ade80;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #166534;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #22c55e;
    --sensor-co2-color: #84cc16;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #4ade80;
    --sensor-ec-color: #22c55e;
    --border-color: rgba(34, 197, 94, 0.22);
    --border-hover-color: rgba(132, 204, 22, 0.28);
    --disabled-bg-color: rgba(20, 83, 45, 0.24);
    --active-bg-color: rgba(34, 197, 94, 0.14);
    --pressed-bg-color: rgba(132, 204, 22, 0.18);
    --input-bg-color: rgba(10, 26, 10, 0.68);
    --input-border-color: rgba(34, 197, 94, 0.26);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(34, 197, 94, 0.16);
    --slider-BG-color: linear-gradient(
      to right,
      #86efac 0%,
      #22c55e calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #14532d calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #14532d 100%
    );
    --main-shadow-art: rgba(10, 26, 10, 0.56) 0px 24px 60px,
      rgba(34, 197, 94, 0.12) 0px 10px 24px,
      rgba(132, 204, 22, 0.08) 0px 2px 10px;
    --main-gradient-1: rgba(34, 197, 94, 0.24);
    --main-gradient-2: rgba(132, 204, 22, 0.2);
    --main-gradient-3: rgba(74, 222, 128, 0.18);
    --main-gradient-4: rgba(34, 197, 94, 0.14);
    --main-gradient-5: rgba(101, 163, 13, 0.12);
    --glass-bg-primary: rgba(10, 26, 10, 0.54);
    --glass-bg-secondary: rgba(18, 45, 18, 0.36);
    --glass-border: rgba(34, 197, 94, 0.16);
    --glass-border-light: rgba(132, 204, 22, 0.2);
    --glass-shadow-inset: inset 0 1px 0 rgba(240, 253, 244, 0.06);
  `,
});

const GlobalOceanBreezeStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 34%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 32%),
    linear-gradient(145deg, #e0f7fa 0%, #d4f5fc 46%, #c5f0f7 100%)
  `,
  scrollbar: '#0ea5e9',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 34%),
      radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 32%),
      linear-gradient(145deg, #e0f7fa 0%, #d4f5fc 46%, #c5f0f7 100%);
    --primary-color: #0c4a6e;
    --secondary-color: #075985;
    --primary-accent: #0ea5e9;
    --secondary-accent: #38bdf8;
    --main-text-color: #083344;
    --second-text-color: #0e7490;
    --error-text-color: #dc2626;
    --primary-button-color: #0284c7;
    --secondary-button-color: #0ea5e9;
    --main-hover-color: rgba(14, 165, 233, 0.12);
    --secondary-hover-color: rgba(56, 189, 248, 0.14);
    --clear-hover-color: rgba(14, 165, 233, 0.1);
    --main-bg-color: rgba(255, 255, 255, 0.96);
    --second-bg-color: rgba(240, 249, 255, 0.94);
    --main-unit-color: #0ea5e9;
    --second-unit-color: #38bdf8;
    --main-value-color: #0369a1;
    --main-bg-nav-color: rgba(255, 255, 255, 0.98);
    --main-bg-card-color: rgba(255, 255, 255, 0.94);
    --main-bg-Innercard-color: rgba(240, 249, 255, 0.92);
    --main-arrow-up: #16a34a;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #0ea5e9;
    --cannabis-inactive-color: #64748b;
    --warning-color: #f59e0b;
    --warning-text-color: #d97706;
    --warning-accent-color: #ea580c;
    --muted-text-color: #64748b;
    --placeholder-text-color: #94a3b8;
    --disabled-text-color: #cbd5e1;
    --border-light-color: #bae6fd;
    --focus-color: #0ea5e9;
    --chart-primary-color: #38bdf8;
    --chart-secondary-color: #0ea5e9;
    --chart-success-color: #16a34a;
    --chart-warning-color: #f59e0b;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #64748b;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #38bdf8;
    --sensor-co2-color: #0ea5e9;
    --sensor-light-color: #f59e0b;
    --sensor-ph-color: #16a34a;
    --sensor-ec-color: #0ea5e9;
    --border-color: #bae6fd;
    --border-hover-color: #0ea5e9;
    --disabled-bg-color: #e0f2fe;
    --active-bg-color: rgba(14, 165, 233, 0.12);
    --pressed-bg-color: rgba(56, 189, 248, 0.16);
    --input-bg-color: rgba(255, 255, 255, 0.96);
    --input-border-color: #bae6fd;
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(14, 165, 233, 0.12);
    --slider-BG-color: linear-gradient(
      to right,
      #7dd3fc 0%,
      #0ea5e9 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #bae6fd calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #bae6fd 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.06) 0px 8px 24px,
      rgba(14, 165, 233, 0.08) 0px 4px 12px,
      rgba(0, 0, 0, 0.04) 0px 2px 4px;
    --main-gradient-1: rgba(14, 165, 233, 0.14);
    --main-gradient-2: rgba(56, 189, 248, 0.12);
    --main-gradient-3: rgba(16, 163, 74, 0.1);
    --main-gradient-4: rgba(14, 165, 233, 0.08);
    --main-gradient-5: rgba(56, 189, 248, 0.06);
    --glass-bg-primary: rgba(255, 255, 255, 0.88);
    --glass-bg-secondary: rgba(240, 249, 255, 0.78);
    --glass-border: rgba(186, 230, 253, 0.68);
    --glass-border-light: rgba(14, 165, 233, 0.25);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.94);
  `,
});

const GlobalMidnightRoseStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(244, 114, 182, 0.2), transparent 32%),
    radial-gradient(circle at top right, rgba(192, 132, 252, 0.16), transparent 30%),
    linear-gradient(145deg, #0f0a14 0%, #1a1022 46%, #251a30 100%)
  `,
  scrollbar: '#f472b6',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(244, 114, 182, 0.2), transparent 32%),
      radial-gradient(circle at top right, rgba(192, 132, 252, 0.16), transparent 30%),
      linear-gradient(145deg, #0f0a14 0%, #1a1022 46%, #251a30 100%);
    --primary-color: #fce7f3;
    --secondary-color: #f3e8ff;
    --primary-accent: #f472b6;
    --secondary-accent: #c084fc;
    --main-text-color: #fdf2f8;
    --second-text-color: #f9a8d4;
    --error-text-color: #f87171;
    --primary-button-color: #db2777;
    --secondary-button-color: #a855f7;
    --main-hover-color: rgba(244, 114, 182, 0.18);
    --secondary-hover-color: rgba(192, 132, 252, 0.2);
    --clear-hover-color: rgba(232, 121, 249, 0.12);
    --main-bg-color: rgba(15, 10, 20, 0.94);
    --second-bg-color: rgba(26, 16, 34, 0.86);
    --main-unit-color: #f472b6;
    --second-unit-color: #c084fc;
    --main-value-color: #f9a8d4;
    --main-bg-nav-color: rgba(15, 10, 20, 0.97);
    --main-bg-card-color: rgba(26, 16, 34, 0.74);
    --main-bg-Innercard-color: rgba(37, 26, 48, 0.58);
    --main-arrow-up: #4ade80;
    --main-arrow-down: #f87171;
    --cannabis-active-color: #f472b6;
    --cannabis-inactive-color: #737373;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #fb923c;
    --muted-text-color: #f472b6;
    --placeholder-text-color: #a855f7;
    --disabled-text-color: #86198f;
    --border-light-color: #701a75;
    --focus-color: #f472b6;
    --chart-primary-color: #f472b6;
    --chart-secondary-color: #c084fc;
    --chart-success-color: #34d399;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #f87171;
    --chart-neutral-color: #86198f;
    --sensor-temp-color: #f87171;
    --sensor-humidity-color: #f472b6;
    --sensor-co2-color: #c084fc;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #34d399;
    --sensor-ec-color: #22c55e;
    --border-color: rgba(244, 114, 182, 0.24);
    --border-hover-color: rgba(192, 132, 252, 0.3);
    --disabled-bg-color: rgba(134, 25, 143, 0.24);
    --active-bg-color: rgba(244, 114, 182, 0.16);
    --pressed-bg-color: rgba(192, 132, 252, 0.22);
    --input-bg-color: rgba(15, 10, 20, 0.72);
    --input-border-color: rgba(244, 114, 182, 0.26);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(244, 114, 182, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #f9a8d4 0%,
      #f472b6 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #581c87 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #581c87 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.64) 0px 24px 60px,
      rgba(244, 114, 182, 0.16) 0px 10px 24px,
      rgba(192, 132, 252, 0.1) 0px 2px 10px;
    --main-gradient-1: rgba(244, 114, 182, 0.26);
    --main-gradient-2: rgba(192, 132, 252, 0.22);
    --main-gradient-3: rgba(52, 211, 153, 0.18);
    --main-gradient-4: rgba(232, 121, 249, 0.14);
    --main-gradient-5: rgba(168, 85, 247, 0.12);
    --glass-bg-primary: rgba(15, 10, 20, 0.58);
    --glass-bg-secondary: rgba(26, 16, 34, 0.38);
    --glass-border: rgba(244, 114, 182, 0.18);
    --glass-border-light: rgba(192, 132, 252, 0.22);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  `,
});

const GlobalArcticFrostStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(186, 230, 253, 0.18), transparent 34%),
    radial-gradient(circle at top right, rgba(224, 242, 254, 0.14), transparent 32%),
    linear-gradient(145deg, #f0f9ff 0%, #e5f5fa 46%, #dbeafe 100%)
  `,
  scrollbar: '#0ea5e9',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(186, 230, 253, 0.18), transparent 34%),
      radial-gradient(circle at top right, rgba(224, 242, 254, 0.14), transparent 32%),
      linear-gradient(145deg, #f0f9ff 0%, #e5f5fa 46%, #dbeafe 100%);
    --primary-color: #0f172a;
    --secondary-color: #334155;
    --primary-accent: #0ea5e9;
    --secondary-accent: #7dd3fc;
    --main-text-color: #0c4a6e;
    --second-text-color: #0e7490;
    --error-text-color: #dc2626;
    --primary-button-color: #0284c7;
    --secondary-button-color: #0ea5e9;
    --main-hover-color: rgba(14, 165, 233, 0.14);
    --secondary-hover-color: rgba(125, 211, 252, 0.16);
    --clear-hover-color: rgba(14, 165, 233, 0.1);
    --main-bg-color: rgba(255, 255, 255, 0.98);
    --second-bg-color: rgba(240, 249, 255, 0.96);
    --main-unit-color: #0ea5e9;
    --second-unit-color: #7dd3fc;
    --main-value-color: #0369a1;
    --main-bg-nav-color: rgba(255, 255, 255, 0.99);
    --main-bg-card-color: rgba(255, 255, 255, 0.96);
    --main-bg-Innercard-color: rgba(240, 249, 255, 0.94);
    --main-arrow-up: #16a34a;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #0ea5e9;
    --cannabis-inactive-color: #94a3b8;
    --warning-color: #f59e0b;
    --warning-text-color: #d97706;
    --warning-accent-color: #ea580c;
    --muted-text-color: #64748b;
    --placeholder-text-color: #94a3b8;
    --disabled-text-color: #cbd5e1;
    --border-light-color: #bae6fd;
    --focus-color: #0ea5e9;
    --chart-primary-color: #7dd3fc;
    --chart-secondary-color: #0ea5e9;
    --chart-success-color: #16a34a;
    --chart-warning-color: #f59e0b;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #94a3b8;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #7dd3fc;
    --sensor-co2-color: #0ea5e9;
    --sensor-light-color: #f59e0b;
    --sensor-ph-color: #16a34a;
    --sensor-ec-color: #0ea5e9;
    --border-color: #bae6fd;
    --border-hover-color: #0ea5e9;
    --disabled-bg-color: #f0f9ff;
    --active-bg-color: rgba(14, 165, 233, 0.14);
    --pressed-bg-color: rgba(125, 211, 252, 0.18);
    --input-bg-color: rgba(255, 255, 255, 0.98);
    --input-border-color: #bae6fd;
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(14, 165, 233, 0.14);
    --slider-BG-color: linear-gradient(
      to right,
      #bae6fd 0%,
      #0ea5e9 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e0f2fe calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #e0f2fe 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.04) 0px 8px 24px,
      rgba(14, 165, 233, 0.06) 0px 4px 12px,
      rgba(0, 0, 0, 0.02) 0px 2px 4px;
    --main-gradient-1: rgba(14, 165, 233, 0.16);
    --main-gradient-2: rgba(125, 211, 252, 0.14);
    --main-gradient-3: rgba(16, 163, 74, 0.12);
    --main-gradient-4: rgba(14, 165, 233, 0.1);
    --main-gradient-5: rgba(125, 211, 252, 0.08);
    --glass-bg-primary: rgba(255, 255, 255, 0.92);
    --glass-bg-secondary: rgba(240, 249, 255, 0.82);
    --glass-border: rgba(186, 230, 253, 0.72);
    --glass-border-light: rgba(14, 165, 233, 0.28);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.96);
  `,
});

const GlobalCherryBlossomStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(244, 114, 182, 0.14), transparent 32%),
    radial-gradient(circle at top right, rgba(251, 207, 232, 0.1), transparent 30%),
    linear-gradient(145deg, #fdf2f8 0%, #fce7f3 46%, #fbcfe8 100%)
  `,
  scrollbar: '#f472b6',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(244, 114, 182, 0.14), transparent 32%),
      radial-gradient(circle at top right, rgba(251, 207, 232, 0.1), transparent 30%),
      linear-gradient(145deg, #fdf2f8 0%, #fce7f3 46%, #fbcfe8 100%);
    --primary-color: #831843;
    --secondary-color: #be185d;
    --primary-accent: #ec4899;
    --secondary-accent: #f472b6;
    --main-text-color: #500724;
    --second-text-color: #9d174d;
    --error-text-color: #dc2626;
    --primary-button-color: #db2777;
    --secondary-button-color: #ec4899;
    --main-hover-color: rgba(236, 72, 153, 0.12);
    --secondary-hover-color: rgba(244, 114, 182, 0.14);
    --clear-hover-color: rgba(251, 207, 232, 0.1);
    --main-bg-color: rgba(253, 242, 248, 0.96);
    --second-bg-color: rgba(252, 231, 243, 0.94);
    --main-unit-color: #ec4899;
    --second-unit-color: #f472b6;
    --main-value-color: #be185d;
    --main-bg-nav-color: rgba(253, 242, 248, 0.98);
    --main-bg-card-color: rgba(255, 255, 255, 0.95);
    --main-bg-Innercard-color: rgba(251, 207, 232, 0.92);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #dc2626;
    --cannabis-active-color: #22c55e;
    --cannabis-inactive-color: #f472b6;
    --warning-color: #f59e0b;
    --warning-text-color: #d97706;
    --warning-accent-color: #ea580c;
    --muted-text-color: #9d174d;
    --placeholder-text-color: #db2777;
    --disabled-text-color: #fbcfe8;
    --border-light-color: #fbcfe8;
    --focus-color: #ec4899;
    --chart-primary-color: #ec4899;
    --chart-secondary-color: #f472b6;
    --chart-success-color: #22c55e;
    --chart-warning-color: #f59e0b;
    --chart-error-color: #dc2626;
    --chart-neutral-color: #be185d;
    --sensor-temp-color: #dc2626;
    --sensor-humidity-color: #ec4899;
    --sensor-co2-color: #f472b6;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #22c55e;
    --sensor-ec-color: #ec4899;
    --border-color: #fbcfe8;
    --border-hover-color: #ec4899;
    --disabled-bg-color: #fce7f3;
    --active-bg-color: rgba(236, 72, 153, 0.12);
    --pressed-bg-color: rgba(244, 114, 182, 0.16);
    --input-bg-color: rgba(255, 255, 255, 0.98);
    --input-border-color: #fbcfe8;
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(236, 72, 153, 0.12);
    --slider-BG-color: linear-gradient(
      to right,
      #f9a8d4 0%,
      #ec4899 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #fce7f3 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #fce7f3 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.06) 0px 8px 24px,
      rgba(236, 72, 153, 0.08) 0px 4px 12px,
      rgba(0, 0, 0, 0.04) 0px 2px 4px;
    --main-gradient-1: rgba(236, 72, 153, 0.14);
    --main-gradient-2: rgba(244, 114, 182, 0.12);
    --main-gradient-3: rgba(251, 207, 232, 0.1);
    --main-gradient-4: rgba(236, 72, 153, 0.08);
    --main-gradient-5: rgba(244, 114, 182, 0.06);
    --glass-bg-primary: rgba(255, 255, 255, 0.9);
    --glass-bg-secondary: rgba(251, 207, 232, 0.8);
    --glass-border: rgba(251, 207, 232, 0.7);
    --glass-border-light: rgba(236, 72, 153, 0.25);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.95);
  `,
});

const GlobalVolcanicStyle = createTheme({
  background: `
    radial-gradient(circle at top left, rgba(239, 68, 68, 0.2), transparent 32%),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 30%),
    radial-gradient(circle at bottom center, rgba(153, 27, 27, 0.12), transparent 28%),
    linear-gradient(145deg, #1a0505 0%, #2d0a0a 46%, #450a0a 100%)
  `,
  scrollbar: '#ef4444',
  variables: css`
    --theme-font-family: ${BASE_FONT_FAMILY};
    --page-background:
      radial-gradient(circle at top left, rgba(239, 68, 68, 0.2), transparent 32%),
      radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 30%),
      radial-gradient(circle at bottom center, rgba(153, 27, 27, 0.12), transparent 28%),
      linear-gradient(145deg, #1a0505 0%, #2d0a0a 46%, #450a0a 100%);
    --primary-color: #fef2f2;
    --secondary-color: #fecaca;
    --primary-accent: #ef4444;
    --secondary-accent: #f97316;
    --main-text-color: #fef2f2;
    --second-text-color: #fca5a5;
    --error-text-color: #fca5a5;
    --primary-button-color: #dc2626;
    --secondary-button-color: #ea580c;
    --main-hover-color: rgba(239, 68, 68, 0.18);
    --secondary-hover-color: rgba(249, 115, 22, 0.16);
    --clear-hover-color: rgba(254, 202, 202, 0.12);
    --main-bg-color: rgba(26, 5, 5, 0.94);
    --second-bg-color: rgba(45, 10, 10, 0.86);
    --main-unit-color: #ef4444;
    --second-unit-color: #f97316;
    --main-value-color: #fca5a5;
    --main-bg-nav-color: rgba(26, 5, 5, 0.97);
    --main-bg-card-color: rgba(45, 10, 10, 0.74);
    --main-bg-Innercard-color: rgba(69, 10, 10, 0.58);
    --main-arrow-up: #22c55e;
    --main-arrow-down: #fca5a5;
    --cannabis-active-color: #22c55e;
    --cannabis-inactive-color: #7f1d1d;
    --warning-color: #fbbf24;
    --warning-text-color: #fcd34d;
    --warning-accent-color: #f97316;
    --muted-text-color: #fca5a5;
    --placeholder-text-color: #dc2626;
    --disabled-text-color: #991b1b;
    --border-light-color: #991b1b;
    --focus-color: #ef4444;
    --chart-primary-color: #ef4444;
    --chart-secondary-color: #f97316;
    --chart-success-color: #22c55e;
    --chart-warning-color: #fbbf24;
    --chart-error-color: #fca5a5;
    --chart-neutral-color: #b91c1c;
    --sensor-temp-color: #fca5a5;
    --sensor-humidity-color: #ef4444;
    --sensor-co2-color: #f97316;
    --sensor-light-color: #fbbf24;
    --sensor-ph-color: #22c55e;
    --sensor-ec-color: #ef4444;
    --border-color: rgba(239, 68, 68, 0.26);
    --border-hover-color: rgba(249, 115, 22, 0.34);
    --disabled-bg-color: rgba(153, 27, 27, 0.24);
    --active-bg-color: rgba(239, 68, 68, 0.16);
    --pressed-bg-color: rgba(249, 115, 22, 0.2);
    --input-bg-color: rgba(26, 5, 5, 0.72);
    --input-border-color: rgba(239, 68, 68, 0.32);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(239, 68, 68, 0.18);
    --slider-BG-color: linear-gradient(
      to right,
      #fca5a5 0%,
      #ef4444 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #7f1d1d calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #7f1d1d 100%
    );
    --main-shadow-art: rgba(0, 0, 0, 0.64) 0px 24px 60px,
      rgba(239, 68, 68, 0.16) 0px 10px 24px,
      rgba(249, 115, 22, 0.1) 0px 2px 10px;
    --main-gradient-1: rgba(239, 68, 68, 0.26);
    --main-gradient-2: rgba(249, 115, 22, 0.22);
    --main-gradient-3: rgba(220, 38, 38, 0.2);
    --main-gradient-4: rgba(251, 146, 60, 0.18);
    --main-gradient-5: rgba(185, 28, 28, 0.16);
    --glass-bg-primary: rgba(26, 5, 5, 0.58);
    --glass-bg-secondary: rgba(45, 10, 10, 0.38);
    --glass-border: rgba(239, 68, 68, 0.2);
    --glass-border-light: rgba(249, 115, 22, 0.24);
    --glass-shadow-inset: inset 0 1px 0 rgba(254, 242, 242, 0.06);
  `,
});
