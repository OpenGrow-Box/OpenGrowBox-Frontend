import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheetManager, ServerStyleSheet } from 'styled-components';
import App from './App.jsx';

// Only define the custom element ONCE
class OgbGui extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Base styles for Shadow DOM
    const baseStyle = document.createElement('style');
    baseStyle.textContent = `
      :host {
        all: initial;
        display: block;
        width: 100%;
        height: 100%;
      }
      
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
      }
      #react-container {
        width: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
      }
    `;
    this.shadowRoot.appendChild(baseStyle);
    
    // Container for React app
    this.container = document.createElement('div');
    this.container.id = 'react-container';
    this.shadowRoot.appendChild(this.container);
  }
  
  connectedCallback() {
    let container = this.shadowRoot.getElementById('react-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'react-container';
      this.shadowRoot.appendChild(container);
    }
    
    // Create a style element for styled-components to inject into
    const styledStyle = document.createElement('style');
    this.shadowRoot.appendChild(styledStyle);
    
    // Use the styled style element as target for CSS injection
    createRoot(container).render(
      <StrictMode>
        <StyleSheetManager target={styledStyle}>
          <App />
        </StyleSheetManager>
      </StrictMode>
    );
  }
}

// Register the custom element
customElements.define('ogb-gui', OgbGui);

// In DEV mode: Create the element if needed
if (import.meta.env.DEV) {
  let ogbGui = document.querySelector('ogb-gui');
  if (!ogbGui) {
    ogbGui = document.createElement('ogb-gui');
    document.body.appendChild(ogbGui);
  }
}
