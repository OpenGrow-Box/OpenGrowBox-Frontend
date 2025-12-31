import { useGlobalState } from '../Components/Context/GlobalContext';
import { createGlobalStyle } from 'styled-components';

function ThemeGlobalStyle() {
    const {state } = useGlobalState()
    const { theme } = state.Design ;

  
    switch (theme) {
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
    // Standard: main
    default:
      return <GlobalStyle />;
  }
}

export default ThemeGlobalStyle;


const GlobalStyle = createGlobalStyle`
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

  .DeviationStatus[data-status="optimal"] {
    color: #22c55e;
  }

  .DeviationStatus[data-status="warning"] {
    color: #f59e0b;
  }

  .DeviationStatus[data-status="critical"] {
    color: #ef4444;
  }

  .DeviationStatus[data-status="default"] {
    color: var(--second-text-color);
  }

  :host, #react-container {
    --page-background: linear-gradient(135deg, #1a1a1a, #2c3e50);
    --primary-color:rgb(176, 187, 193);
    --secondary-color:rgb(245, 121, 63);

    --primary-accent:rgba(10, 226, 168, 0.86);
    --secondary-accent:rgba(219, 10, 226, 0.66);

    --main-text-color: #ffffff;
    --second-text-color:rgb(208, 112, 9);
    --error-text-color:rgba(225, 19, 19, 0.82);

    --primary-button-color: rgba(64, 226, 10, 0.82);
    --secondary-button-color: rgba(56, 205, 146, 0.74);

    --main-hover-color:rgba(13, 140, 110, 0.4);
    --secondary-hover-color:rgba(64, 226, 10, 0.82);
    --clear-hover-color:rgba(13, 211, 155, 0.83);

    --main-bg-color:rgba(23, 21, 47, 0.68);
    --second-bg-color:rgba(38, 141, 23, 0.68);

    --main-unit-color: rgba(10, 226, 168, 0.86);
    --second-unit-color: rgba(19, 194, 213, 0.86);

    --main-value-color: rgba(19, 213, 203, 0.86);

    --main-bg-nav-color:rgba(23, 21, 47, 0.95);

    --main-bg-card-color:rgba(53, 50, 50, 0.29);
    --main-bg-Innercard-color:rgba(83, 61, 85, 0.29);;


    --main-arrow-up: rgba(64, 226, 10, 0.82);
    --main-arrow-down: rgba(234, 24, 17, 0.84);

    --cannabis-active-color: #81C784;
    --cannabis-inactive-color: #4CAF50;

    /* Status & Neutral Colors */
    --warning-color: #eab308;           /* Yellow warning */
    --warning-text-color: #f59e0b;      /* Amber text */
    --warning-accent-color: #f97316;    /* Orange accent */
    --muted-text-color: #64748b;        /* Slate gray */
    --placeholder-text-color: #94a3b8;  /* Light slate */
    --disabled-text-color: #6b7280;     /* Medium gray */
    --border-light-color: #e2e8f0;      /* Very light gray */
    --focus-color: #60a5fa;             /* Focus blue */

    /* Chart & Sensor Colors */
    --chart-primary-color: #3b82f6;     /* Blue */
    --chart-secondary-color: #06b6d4;  /* Cyan */
    --chart-success-color: #10b981;    /* Green */
    --chart-warning-color: #eab308;    /* Yellow */
    --chart-error-color: #ef4444;      /* Red */
    --chart-neutral-color: #6b7280;    /* Gray */
    --sensor-temp-color: #ef4444;      /* Temperature */
    --sensor-humidity-color: #3b82f6; /* Humidity */
    --sensor-co2-color: #8b5cf6;       /* CO2 */
    --sensor-light-color: #eab308;    /* Light */
    --sensor-ph-color: #06b6d4;        /* pH */
    --sensor-ec-color: #10b981;        /* EC */

    /* UI Interactive States */
    --focus-color: #60a5fa;                    /* Focus blue */
    --border-color: rgba(255,255,255,0.1);    /* Default borders */
    --border-hover-color: rgba(255,255,255,0.2);
    --disabled-bg-color: rgba(255,255,255,0.05);
    --active-bg-color: rgba(255,255,255,0.1);
    --pressed-bg-color: rgba(255,255,255,0.15);
    --input-bg-color: rgba(255,255,255,0.05);
    --input-border-color: rgba(255,255,255,0.2);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(255,255,255,0.1);

    --slider-BG-color:linear-gradient(
    to right,
    rgb(189, 252, 192) 0%,
    rgb(13, 234, 20) calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
        #777 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
        #777 100%
    );

    --main-shadow-art: rgba(0, 0, 0, 0.25) 0px 54px 55px,
              rgba(0, 0, 0, 0.12) 0px -12px 30px,
              rgba(0, 0, 0, 0.12) 0px 4px 6px,
              rgba(0, 0, 0, 0.17) 0px 12px 13px,
              rgba(0, 0, 0, 0.09) 0px -3px 5px;


    --main-gradient-1:rgba(64, 226, 10, 0.4);
    --main-gradient-2:rgba(10, 226, 168, 0.4);
    --main-gradient-3:rgba(43, 135, 210, 0.4);
    --main-gradient-4:rgba(27, 197, 231, 0.4);
    --main-gradient-5:rgba(159, 11, 208, 0.35);

    /* Glass morphism effects */
    --glass-bg-primary: rgba(255, 255, 255, 0.05);
    --glass-bg-secondary: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-border-light: rgba(255, 255, 255, 0.15);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    min-height: 100%;
  }

  #react-container {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    background: linear-gradient(135deg, #1a1a1a, #2c3e50);
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }

  ::-webkit-scrollbar-thumb {
    background-color: darkgrey;
    width: 5px;
  }


`;

const GlobalUnicornStyle = createGlobalStyle`
  :host, #react-container {
    --page-background: linear-gradient(135deg, #1a1a1a, #2c3e50);
    /* Kräftige Pastellfarben, etwas verspielt/unicorn-mäßig */
    --primary-color:rgb(176, 187, 193);
    --secondary-color:rgb(245, 121, 63);

    --primary-accent: #ff9de2;
    --secondary-accent: #c4a2fc;

    --main-text-color: #ffffff;
    --second-text-color: #fce4ff;
    --error-text-color:rgba(225, 19, 19, 0.82);

    --primary-button-color: #ff9de2;
    --secondary-button-color: #c4a2fc;

    --main-hover-color: rgba(255, 255, 255, 0.1);
    --secondary-hover-color: #ff9de2;
    --clear-hover-color: #fcaae8;

    --main-bg-color: #3c2a3b;
    --second-bg-color: #f5d6ff;

    --main-unit-color: #ff9de2;
    --main-value-color: rgba(119, 165, 235, 0.9);
    --main-bg-nav-color: rgba(177, 157, 255, 0.9);
    --main-bg-card-color: rgba(196, 162, 252, 0.2);

    --main-arrow-up: #ff9de2;
    --main-arrow-down: #c4a2fc;
    --cannabis-active-color: #c9f7c7;
    --cannabis-inactive-color: #89c784;

    /* Status & Neutral Colors */
    --warning-color: #fce4ff;           /* Pastel warning */
    --warning-text-color: #fce4ff;      /* Pastel amber */
    --warning-accent-color: #ff9de2;    /* Pastel orange */
    --muted-text-color: #fce4ff;        /* Pastel slate */
    --placeholder-text-color: #fce4ff;  /* Pastel light slate */
    --disabled-text-color: #c4a2fc;     /* Pastel gray */
    --border-light-color: #fce4ff;      /* Pastel light gray */
    --focus-color: #ff9de2;             /* Pastel focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #c4a2fc;     /* Pastel purple */
    --chart-secondary-color: #ff9de2;  /* Pastel pink */
    --chart-success-color: #c4a2fc;    /* Pastel purple */
    --chart-warning-color: #fce4ff;    /* Pastel warning */
    --chart-error-color: #ff9de2;      /* Pastel pink */
    --chart-neutral-color: #c4a2fc;    /* Pastel neutral */
    --sensor-temp-color: #ff9de2;      /* Pastel temp */
    --sensor-humidity-color: #c4a2fc; /* Pastel humidity */
    --sensor-co2-color: #ff9de2;       /* Pastel CO2 */
    --sensor-light-color: #fce4ff;    /* Pastel light */
    --sensor-ph-color: #c4a2fc;        /* Pastel pH */
    --sensor-ec-color: #ff9de2;        /* Pastel EC */

    /* UI Interactive States */
    --focus-color: #ff9de2;                    /* Pastel focus */
    --border-color: rgba(255,255,255,0.1);    /* Pastel borders */
    --border-hover-color: rgba(255,255,255,0.2);
    --disabled-bg-color: rgba(255,255,255,0.05);
    --active-bg-color: rgba(255,255,255,0.1);
    --pressed-bg-color: rgba(255,255,255,0.15);
    --input-bg-color: rgba(255,255,255,0.05);
    --input-border-color: rgba(255,255,255,0.2);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(255,255,255,0.1);

    --main-shadow-art: rgba(0, 0, 0, 0.25) 0px 54px 55px,
      rgba(0, 0, 0, 0.12) 0px -12px 30px,
      rgba(0, 0, 0, 0.12) 0px 4px 6px,
      rgba(0, 0, 0, 0.17) 0px 12px 13px,
      rgba(0, 0, 0, 0.09) 0px -3px 5px;

    /* Sanfte Pastell-Gradients */
    --main-gradient-1: rgba(255, 157, 226, 0.4);
    --main-gradient-2: rgba(196, 162, 252, 0.4);
    --main-gradient-3: rgba(255, 214, 250, 0.4);
    --main-gradient-4: rgba(255, 157, 226, 0.35);
    --main-gradient-5: rgba(196, 162, 252, 0.4);

    /* Glass morphism effects */
    --glass-bg-primary: rgba(255, 255, 255, 0.05);
    --glass-bg-secondary: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-border-light: rgba(255, 255, 255, 0.15);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a1a, #2c3e50);
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }
  ::-webkit-scrollbar-thumb {
    background-color: #bbb;
    width: 5px;
  }
`;

const GlobalAuroraStyle = createGlobalStyle`
  :host, #react-container {
    /* Aurora Theme - Northern Lights Inspired */
    --primary-color: #0c1425;        /* Deeper space blue for better contrast */
    --secondary-color: #00f5d4;      /* Brighter aurora teal */
    --primary-accent: #7c3aed;       /* Richer purple */
    --secondary-accent: #0891b2;     /* Deeper cyan */
    --main-text-color: #ffffff;      /* Pure white for readability */
    --second-text-color: #cbd5e1;    /* Softer slate gray */
    --error-text-color: #f87171;     /* Accessible red */
    --primary-button-color: #00f5d4; /* Bright aurora teal */
    --secondary-button-color: #7c3aed; /* Rich purple */
    --main-hover-color: rgba(0, 245, 212, 0.15); /* Subtle teal hover */
    --secondary-hover-color: #00f5d4; /* Bright teal on hover */
    --clear-hover-color: rgba(124, 58, 237, 0.2); /* Purple hover */
    --main-bg-color: #0c1425;        /* Deep space background */
    --second-bg-color: #1e293b;      /* Dark slate cards */
    --main-unit-color: #00f5d4;      /* Bright aurora teal */
    --second-unit-color: #0891b2;    /* Deep cyan */
    --main-value-color: #7c3aed;     /* Rich purple */
    --main-bg-nav-color: rgba(12, 20, 37, 0.95); /* Semi-transparent nav */
    --main-bg-card-color: rgba(30, 41, 59, 0.7); /* Glass-morphism effect */
    --main-bg-Innercard-color: rgba(51, 65, 85, 0.5); /* Lighter inner cards */
    --main-arrow-up: #00f5d4;        /* Bright teal for positive */
    --main-arrow-down: #f87171;      /* Accessible red for negative */
    --cannabis-active-color: #00f5d4;   /* Bright aurora teal */
    --cannabis-inactive-color: #7c3aed; /* Rich purple */

    /* Status & Neutral Colors */
    --warning-color: #fbbf24;           /* Aurora warning */
    --warning-text-color: #fbbf24;      /* Aurora amber */
    --warning-accent-color: #f59e0b;    /* Aurora orange */
    --muted-text-color: #cbd5e1;        /* Aurora slate */
    --placeholder-text-color: #cbd5e1;  /* Aurora light slate */
    --disabled-text-color: #7c3aed;     /* Aurora gray */
    --border-light-color: #e2e8f0;      /* Aurora border */
    --focus-color: #00f5d4;             /* Aurora focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #00f5d4;     /* Aurora teal */
    --chart-secondary-color: #7c3aed;  /* Aurora purple */
    --chart-success-color: #00f5d4;    /* Aurora teal */
    --chart-warning-color: #fbbf24;    /* Aurora warning */
    --chart-error-color: #f59e0b;      /* Aurora error */
    --chart-neutral-color: #7c3aed;    /* Aurora neutral */
    --sensor-temp-color: #f59e0b;      /* Aurora temp */
    --sensor-humidity-color: #00f5d4; /* Aurora humidity */
    --sensor-co2-color: #7c3aed;       /* Aurora CO2 */
    --sensor-light-color: #fbbf24;    /* Aurora light */
    --sensor-ph-color: #0891b2;        /* Aurora pH */
    --sensor-ec-color: #00f5d4;        /* Aurora EC */

    /* UI Interactive States */
    --focus-color: #00f5d4;                    /* Aurora focus */
    --border-color: rgba(0,245,212,0.2);     /* Aurora borders */
    --border-hover-color: rgba(0,245,212,0.3);
    --disabled-bg-color: rgba(0,245,212,0.1);
    --active-bg-color: rgba(0,245,212,0.15);
    --pressed-bg-color: rgba(0,245,212,0.2);
    --input-bg-color: rgba(0,245,212,0.1);
    --input-border-color: rgba(0,245,212,0.2);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(0,245,212,0.15);

    /* Aurora-inspired gradients */
    --main-gradient-1: rgba(0, 245, 212, 0.3);   /* Bright aurora teal */
    --main-gradient-2: rgba(124, 58, 237, 0.3);  /* Rich purple */
    --main-gradient-3: rgba(8, 145, 178, 0.3);   /* Deep cyan */
    --main-gradient-4: rgba(139, 92, 246, 0.25); /* Light purple accent */
    --main-gradient-5: rgba(6, 182, 212, 0.3);   /* Bright cyan */

    /* Enhanced shadows for aurora theme */
    --main-shadow-art: rgba(0, 245, 212, 0.15) 0px 54px 55px,
      rgba(0, 245, 212, 0.08) 0px -12px 30px,
      rgba(0, 245, 212, 0.08) 0px 4px 6px,
      rgba(124, 58, 237, 0.1) 0px 12px 13px,
      rgba(0, 245, 212, 0.05) 0px -3px 5px;

    /* Glass morphism effects */
    --glass-bg-primary: rgba(12, 20, 37, 0.4);
    --glass-bg-secondary: rgba(30, 41, 59, 0.3);
    --glass-border: rgba(0, 245, 212, 0.15);
    --glass-border-light: rgba(0, 245, 212, 0.2);
    --glass-shadow-inset: inset 0 1px 0 rgba(0, 245, 212, 0.1);
  }

  * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0c1425, #1e293b);
    color: var(--main-text-color);
  }

  /* Aurora-themed scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #00f5d4, #7c3aed);
    border-radius: 3px;
    border: 1px solid rgba(12, 20, 37, 0.5);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #7c3aed, #00f5d4);
  }
`;

const GlobalHackyStyle = createGlobalStyle`
  :host, #react-container {
    --page-background: linear-gradient(135deg, #0d0d0d, #2c3e50);
    /* Matrix-Style: Schwarzer Hintergrund, Neon-Grün, etc. */
    --primary-accent:rgba(68, 255, 0, 0.36);
    --secondary-accent: #0aff89;

    --main-text-color: #00ff00;
    --second-text-color: #0aff89;
    --error-text-color:rgba(225, 19, 19, 0.82);

    --primary-button-color: #0aff89;
    --secondary-button-color: #00ff00;

    --main-hover-color: rgba(255, 255, 255, 0.1);
    --secondary-hover-color: #0aff89;
    --clear-hover-color: rgba(10, 255, 137, 0.3);

    --main-bg-color: #0d0d0d;
    --second-bg-color: #1a1a1a;

    --main-unit-color: #00ff00;
    --main-value-color: rgba(219, 239, 226, 0.9);

    --main-bg-nav-color: rgba(13, 13, 13, 0.9);
    --main-bg-card-color: rgba(40, 40, 40, 0.5);

    --main-arrow-up: #00ff00;
    --main-arrow-down:rgb(255, 71, 10);
    --cannabis-active-color: #00ff00;
    --cannabis-inactive-color:#ffff10;

    /* Status & Neutral Colors */
    --warning-color: #ffff00;           /* Bright yellow */
    --warning-text-color: #ffff00;      /* Bright amber */
    --warning-accent-color: #ffaa00;    /* Bright orange */
    --muted-text-color: #0aff89;        /* Neon green */
    --placeholder-text-color: #0aff89;  /* Neon light green */
    --disabled-text-color: #00ff00;     /* Bright green */
    --border-light-color: #0aff89;      /* Neon border */
    --focus-color: #00ff00;             /* Neon focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #00ff00;     /* Neon green */
    --chart-secondary-color: #0aff89;  /* Neon cyan */
    --chart-success-color: #00ff00;    /* Neon green */
    --chart-warning-color: #ffff00;    /* Bright yellow */
    --chart-error-color: #ff0000;      /* Bright red */
    --chart-neutral-color: #00ff00;    /* Neon neutral */
    --sensor-temp-color: #ff0000;      /* Neon temp */
    --sensor-humidity-color: #00ff00; /* Neon humidity */
    --sensor-co2-color: #0aff89;       /* Neon CO2 */
    --sensor-light-color: #ffff00;    /* Neon light */
    --sensor-ph-color: #0aff89;        /* Neon pH */
    --sensor-ec-color: #00ff00;        /* Neon EC */

    /* UI Interactive States */
    --focus-color: #00ff00;                    /* Neon focus */
    --border-color: rgba(0,255,0,0.3);        /* Neon borders */
    --border-hover-color: rgba(0,255,0,0.5);
    --disabled-bg-color: rgba(0,255,0,0.1);
    --active-bg-color: rgba(0,255,0,0.2);
    --pressed-bg-color: rgba(0,255,0,0.3);
    --input-bg-color: rgba(0,255,0,0.1);
    --input-border-color: rgba(0,255,0,0.3);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(0,255,0,0.2);

    /* Neon-Grün-Gradients */
    --main-gradient-1: rgba(0, 255, 0, 0.3);
    --main-gradient-2: rgba(10, 255, 137, 0.3);
    --main-gradient-3: rgba(0, 200, 0, 0.3);
    --main-gradient-4: rgba(0, 128, 64, 0.3);
    --main-gradient-5: rgba(0, 255, 64, 0.3);

    /* Glass morphism effects */
    --glass-bg-primary: rgba(0, 255, 0, 0.05);
    --glass-bg-secondary: rgba(0, 255, 0, 0.03);
    --glass-border: rgba(0, 255, 0, 0.15);
    --glass-border-light: rgba(0, 255, 0, 0.2);
    --glass-shadow-inset: inset 0 1px 0 rgba(0, 255, 0, 0.1);
  }

  * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0d0d0d, #2c3e50);
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 255, 0, 0.3);
  }
  ::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    width: 5px;
  }
`;

const GlobalWhiteStyle = createGlobalStyle`
  :host, #react-container {
    --page-background: linear-gradient(135deg, #fff,rgb(242, 242, 242));
    --primary-color: #222;
    --secondary-color: #444;

    --primary-accent: #007bff;
    --secondary-accent: #17a2b8;
    --error-text-color:rgba(225, 19, 19, 0.82);

    --main-text-color: #000;
    --second-text-color: #555;
    --error-text-color: #dc3545;

    --primary-button-color: #007bff;
    --secondary-button-color: #17a2b8;

    --main-hover-color: rgba(0, 123, 255, 0.1);
    --secondary-hover-color: rgba(23, 162, 184, 0.1);
    --third-hover-color: rgba(40, 167, 69, 0.1);

    --main-bg-color: #fff;
    --second-bg-color: #f8f9fa;

    --main-unit-color: #007bff;
    --second-unit-color: #17a2b8;

    --main-value-color: #28a745;

    --main-bg-nav-color: #f1f1f1;

    --main-bg-card-color: #ffffff;
    --main-bg-Innercard-color: #f8f9fa;

    --main-arrow-up: #28a745;
    --main-arrow-down: #dc3545;
    --cannabis-active-color: #28a745;
    --cannabis-inactive-color: #6c757d;

    /* Status & Neutral Colors */
    --warning-color: #ffc107;           /* Bootstrap warning */
    --warning-text-color: #ffc107;      /* Bootstrap amber */
    --warning-accent-color: #fd7e14;    /* Bootstrap orange */
    --muted-text-color: #6c757d;        /* Bootstrap secondary */
    --placeholder-text-color: #6c757d;  /* Bootstrap light */
    --disabled-text-color: #6c757d;     /* Bootstrap muted */
    --border-light-color: #dee2e6;      /* Bootstrap light border */
    --focus-color: #007bff;             /* Bootstrap focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #007bff;     /* Bootstrap blue */
    --chart-secondary-color: #17a2b8;  /* Bootstrap cyan */
    --chart-success-color: #28a745;    /* Bootstrap green */
    --chart-warning-color: #ffc107;    /* Bootstrap warning */
    --chart-error-color: #dc3545;      /* Bootstrap danger */
    --chart-neutral-color: #6c757d;    /* Bootstrap muted */
    --sensor-temp-color: #dc3545;      /* Bootstrap temp */
    --sensor-humidity-color: #007bff; /* Bootstrap humidity */
    --sensor-co2-color: #6f42c1;       /* Bootstrap CO2 */
    --sensor-light-color: #ffc107;    /* Bootstrap light */
    --sensor-ph-color: #17a2b8;        /* Bootstrap pH */
    --sensor-ec-color: #28a745;        /* Bootstrap EC */

    /* UI Interactive States */
    --focus-color: #007bff;                    /* Bootstrap focus */
    --border-color: rgba(0,0,0,0.1);          /* Bootstrap borders */
    --border-hover-color: rgba(0,0,0,0.2);
    --disabled-bg-color: rgba(0,0,0,0.05);
    --active-bg-color: rgba(0,0,0,0.1);
    --pressed-bg-color: rgba(0,0,0,0.15);
    --input-bg-color: rgba(0,0,0,0.05);
    --input-border-color: rgba(0,0,0,0.2);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(0,0,0,0.1);

    --slider-BG-color: linear-gradient(
      to right,
      #007bff 0%,
      #17a2b8 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #777 calc((var(--val) - var(--min)) / (var(--max) - var(--min)) * 100%),
      #777 100%
    );

    --main-shadow-art: rgba(0, 0, 0, 0.1) 0px 4px 6px,
                      rgba(0, 0, 0, 0.05) 0px 1px 3px;

    --main-gradient-1: #ffffff;
    --main-gradient-2: #f8f9fa;
    --main-gradient-3: #e9ecef;
    --main-gradient-4: #dee2e6;
    --main-gradient-5: #ced4da;

    /* Glass morphism effects - lighter for white theme */
    --glass-bg-primary: rgba(0, 0, 0, 0.02);
    --glass-bg-secondary: rgba(0, 0, 0, 0.01);
    --glass-border: rgba(0, 0, 0, 0.08);
    --glass-border-light: rgba(0, 0, 0, 0.12);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width:100%;
    height:100%;
    background: linear-gradient(135deg, #fff,rgb(242, 242, 242));
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background-color: #bbb;
    width: 5px;
  }
`;

const GlobalOceanStyle = createGlobalStyle`
  :host, #react-container {
    --page-background: linear-gradient(135deg, #fff,rgb(242, 242, 242));
    --primary-accent: #0099cc;
    --secondary-accent: #33cccc;

    --main-text-color: #ffffff;
    --second-text-color: #b3e0ff;
    --error-text-color:rgba(225, 19, 19, 0.82);

    --primary-button-color: #0099cc;
    --secondary-button-color: #33cccc;

    --main-hover-color: rgba(0, 153, 204, 0.3);
    --secondary-hover-color: #33cccc;

    --main-bg-color: #00264d;
    --second-bg-color: #004080;

    --main-unit-color: #33cccc;
    --main-value-color: rgba(219, 239, 226, 0.9);

    --main-bg-nav-color: rgba(0, 38, 77, 0.9);
    --main-bg-card-color: rgba(0, 64, 128, 0.5);

    --main-arrow-up: #0099cc;
    --main-arrow-down: #33cccc;
    --cannabis-active-color: #66ccff;
    --cannabis-inactive-color: #33cccc;

    /* Status & Neutral Colors */
    --warning-color: #fbbf24;           /* Ocean warning */
    --warning-text-color: #fbbf24;      /* Ocean amber */
    --warning-accent-color: #f59e0b;    /* Ocean orange */
    --muted-text-color: #b3e0ff;        /* Ocean slate */
    --placeholder-text-color: #b3e0ff;  /* Ocean light slate */
    --disabled-text-color: #0891b2;     /* Ocean gray */
    --border-light-color: #e0f2fe;      /* Ocean light border */
    --focus-color: #0099cc;             /* Ocean focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #0099cc;     /* Ocean blue */
    --chart-secondary-color: #33cccc;  /* Ocean cyan */
    --chart-success-color: #66ccff;    /* Ocean light blue */
    --chart-warning-color: #fbbf24;    /* Ocean warning */
    --chart-error-color: #f59e0b;      /* Ocean error */
    --chart-neutral-color: #0891b2;    /* Ocean neutral */
    --sensor-temp-color: #f59e0b;      /* Ocean temp */
    --sensor-humidity-color: #0099cc; /* Ocean humidity */
    --sensor-co2-color: #33cccc;       /* Ocean CO2 */
    --sensor-light-color: #fbbf24;    /* Ocean light */
    --sensor-ph-color: #33cccc;        /* Ocean pH */
    --sensor-ec-color: #66ccff;        /* Ocean EC */

    /* UI Interactive States */
    --focus-color: #0099cc;                    /* Ocean focus */
    --border-color: rgba(0,153,204,0.2);      /* Ocean borders */
    --border-hover-color: rgba(0,153,204,0.3);
    --disabled-bg-color: rgba(0,153,204,0.1);
    --active-bg-color: rgba(0,153,204,0.15);
    --pressed-bg-color: rgba(0,153,204,0.2);
    --input-bg-color: rgba(0,153,204,0.1);
    --input-border-color: rgba(0,153,204,0.2);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(0,153,204,0.15);

    --main-shadow-art: rgba(0, 153, 204, 0.25) 0px 54px 55px,
      rgba(0, 153, 204, 0.12) 0px -12px 30px,
      rgba(0, 153, 204, 0.12) 0px 4px 6px,
      rgba(0, 153, 204, 0.17) 0px 12px 13px,
      rgba(0, 153, 204, 0.09) 0px -3px 5px;

    --main-gradient-1: rgba(0, 153, 204, 0.4);
    --main-gradient-2: rgba(51, 204, 204, 0.4);
    --main-gradient-3: rgba(0, 102, 204, 0.4);
    --main-gradient-4: rgba(0, 153, 204, 0.35);
    --main-gradient-5: rgba(51, 204, 255, 0.4);

    /* Glass morphism effects */
    --glass-bg-primary: rgba(0, 153, 204, 0.08);
    --glass-bg-secondary: rgba(0, 153, 204, 0.05);
    --glass-border: rgba(0, 153, 204, 0.2);
    --glass-border-light: rgba(51, 204, 204, 0.3);
    --glass-shadow-inset: inset 0 1px 0 rgba(51, 204, 204, 0.15);
  }
      * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width:100%;
    height:100%;
    background: linear-gradient(135deg, #fff,rgb(242, 242, 242));
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background-color: #bbb;
    width: 5px;
  }
`;

const GlobalCyberStyle = createGlobalStyle`
  :host, #react-container {
    --page-background: linear-gradient(135deg, #fff,rgb(242, 242, 242));
    --primary-accent: #ff0090;
    --secondary-accent: #00eaff;

    --main-text-color: #00eaff;
    --second-text-color: #ff0090;
    --error-text-color:rgba(225, 19, 19, 0.82);

    --primary-button-color: #ff0090;
    --secondary-button-color: #00eaff;

    --main-hover-color: rgba(255, 0, 144, 0.3);
    --secondary-hover-color: #00eaff;

    --main-bg-color: #0d0027;
    --second-bg-color: #2a0034;

    --main-unit-color: #ff0090;
    --main-value-color: rgba(219, 239, 226, 0.9);

    --main-bg-nav-color: rgba(13, 0, 39, 0.9);
    --main-bg-card-color: rgba(42, 0, 52, 0.5);

    --main-arrow-up: #ff0090;
    --main-arrow-down: #00eaff;
    --cannabis-active-color: #00ffea;
    --cannabis-inactive-color: #0088ff;

    /* Status & Neutral Colors */
    --warning-color: #fbbf24;           /* Cyber warning */
    --warning-text-color: #fbbf24;      /* Cyber amber */
    --warning-accent-color: #f59e0b;    /* Cyber orange */
    --muted-text-color: #ff0090;        /* Cyber slate */
    --placeholder-text-color: #ff0090;  /* Cyber light slate */
    --disabled-text-color: #00eaff;     /* Cyber gray */
    --border-light-color: #ff0090;      /* Cyber border */
    --focus-color: #00eaff;             /* Cyber focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #00eaff;     /* Cyber cyan */
    --chart-secondary-color: #ff0090;  /* Cyber pink */
    --chart-success-color: #00ffea;    /* Cyber green */
    --chart-warning-color: #fbbf24;    /* Cyber warning */
    --chart-error-color: #f59e0b;      /* Cyber error */
    --chart-neutral-color: #00eaff;    /* Cyber neutral */
    --sensor-temp-color: #f59e0b;      /* Cyber temp */
    --sensor-humidity-color: #00eaff; /* Cyber humidity */
    --sensor-co2-color: #ff0090;       /* Cyber CO2 */
    --sensor-light-color: #fbbf24;    /* Cyber light */
    --sensor-ph-color: #00eaff;        /* Cyber pH */
    --sensor-ec-color: #00ffea;        /* Cyber EC */

    /* UI Interactive States */
    --focus-color: #00eaff;                    /* Cyber focus */
    --border-color: rgba(255,0,144,0.3);      /* Cyber borders */
    --border-hover-color: rgba(255,0,144,0.5);
    --disabled-bg-color: rgba(255,0,144,0.1);
    --active-bg-color: rgba(255,0,144,0.2);
    --pressed-bg-color: rgba(255,0,144,0.3);
    --input-bg-color: rgba(255,0,144,0.1);
    --input-border-color: rgba(255,0,144,0.3);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(255,0,144,0.2);

    --main-shadow-art: rgba(255, 0, 144, 0.25) 0px 54px 55px,
      rgba(0, 234, 255, 0.12) 0px -12px 30px,
      rgba(255, 0, 144, 0.12) 0px 4px 6px,
      rgba(0, 234, 255, 0.17) 0px 12px 13px,
      rgba(255, 0, 144, 0.09) 0px -3px 5px;

    --main-gradient-1: rgba(255, 0, 144, 0.4);
    --main-gradient-2: rgba(0, 234, 255, 0.4);
    --main-gradient-3: rgba(255, 0, 90, 0.4);
    --main-gradient-4: rgba(0, 200, 255, 0.35);
    --main-gradient-5: rgba(255, 0, 180, 0.4);

    /* Glass morphism effects */
    --glass-bg-primary: rgba(255, 0, 144, 0.08);
    --glass-bg-secondary: rgba(0, 234, 255, 0.05);
    --glass-border: rgba(255, 0, 144, 0.2);
    --glass-border-light: rgba(0, 234, 255, 0.25);
    --glass-shadow-inset: inset 0 1px 0 rgba(255, 0, 144, 0.15);
  }
      * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width:100%;
    height:100%;
    background: linear-gradient(135deg, #fff,rgb(242, 242, 242));
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background-color: #bbb;
    width: 5px;
  }
`;

const GlobalDarkModeStyle = createGlobalStyle`
  :host, #react-container {
    --page-background: linear-gradient(135deg, rgb(1, 55, 19),rgb(38, 30, 69));
    --primary-accent: #1db954;
    --secondary-accent: #535353;

    --main-text-color: #ffffff;
    --second-text-color: #b3b3b3;
    --error-text-color:rgba(225, 19, 19, 0.82);

    --primary-button-color: #1db954;
    --secondary-button-color: #535353;

    --main-hover-color: rgba(255, 255, 255, 0.1);
    --secondary-hover-color: #1db954;

    --main-bg-color: #121212;
    --second-bg-color: #181818;

    --main-unit-color: #1db954;
    --main-value-color: rgba(219, 239, 226, 0.9);


    --main-bg-nav-color: rgba(18, 18, 18, 0.9);
    --main-bg-card-color: rgba(24, 24, 24, 0.5);

    --main-arrow-up: #1db954;
    --main-arrow-down:rgb(213, 26, 26);
    --cannabis-active-color: #1db954;
    --cannabis-inactive-color: #535353;

    /* Status & Neutral Colors */
    --warning-color: #fbbf24;           /* Dark warning */
    --warning-text-color: #fbbf24;      /* Dark amber */
    --warning-accent-color: #f59e0b;    /* Dark orange */
    --muted-text-color: #b3b3b3;        /* Dark slate */
    --placeholder-text-color: #b3b3b3;  /* Dark light slate */
    --disabled-text-color: #535353;     /* Dark gray */
    --border-light-color: #404040;      /* Dark border */
    --focus-color: #1db954;             /* Dark focus */

    /* Chart & Sensor Colors */
    --chart-primary-color: #1db954;     /* Spotify green */
    --chart-secondary-color: #535353;  /* Dark gray */
    --chart-success-color: #1db954;    /* Spotify green */
    --chart-warning-color: #fbbf24;    /* Dark warning */
    --chart-error-color: #f59e0b;      /* Dark error */
    --chart-neutral-color: #535353;    /* Dark neutral */
    --sensor-temp-color: #f59e0b;      /* Dark temp */
    --sensor-humidity-color: #1db954; /* Dark humidity */
    --sensor-co2-color: #b3b3b3;       /* Dark CO2 */
    --sensor-light-color: #fbbf24;    /* Dark light */
    --sensor-ph-color: #535353;        /* Dark pH */
    --sensor-ec-color: #1db954;        /* Dark EC */

    /* UI Interactive States */
    --focus-color: #1db954;                    /* Dark focus */
    --border-color: rgba(255,255,255,0.1);    /* Dark borders */
    --border-hover-color: rgba(255,255,255,0.2);
    --disabled-bg-color: rgba(255,255,255,0.05);
    --active-bg-color: rgba(255,255,255,0.1);
    --pressed-bg-color: rgba(255,255,255,0.15);
    --input-bg-color: rgba(255,255,255,0.05);
    --input-border-color: rgba(255,255,255,0.2);
    --input-focus-border-color: var(--primary-accent);
    --button-hover-bg: rgba(255,255,255,0.1);

    --main-shadow-art: rgba(0, 0, 0, 0.5) 0px 54px 55px,
      rgba(0, 0, 0, 0.3) 0px -12px 30px,
      rgba(0, 0, 0, 0.3) 0px 4px 6px,
      rgba(0, 0, 0, 0.4) 0px 12px 13px,
      rgba(0, 0, 0, 0.2) 0px -3px 5px;

    --main-gradient-1: rgba(29, 185, 84, 0.3);
    --main-gradient-2: rgba(67, 80, 71, 0.3);
    --main-gradient-3: rgba(32, 28, 48, 0.3);
    --main-gradient-4: rgba(18, 18, 18, 0.25);
    --main-gradient-5: rgba(83, 83, 83, 0.3);

    /* Glass morphism effects */
    --glass-bg-primary: rgba(29, 185, 84, 0.08);
    --glass-bg-secondary: rgba(29, 185, 84, 0.05);
    --glass-border: rgba(29, 185, 84, 0.2);
    --glass-border-light: rgba(29, 185, 84, 0.3);
    --glass-shadow-inset: inset 0 1px 0 rgba(29, 185, 84, 0.15);
  }
      * {
    box-sizing: border-box;
  }

  html {
    overscroll-behavior: none;
  }

  #react-container {
    font-family: Arial, sans-serif;
    font-size: 1rem;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
    width:100%;
    height:100%;
    background: linear-gradient(135deg, rgb(1, 55, 19),rgb(38, 30, 69));
    color: var(--main-text-color);
  }

  /* scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background-color: #bbb;
    width: 5px;
  }
`;