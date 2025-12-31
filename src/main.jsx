import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheetManager, createGlobalStyle } from 'styled-components';
import App from './App.jsx';

// Force styled-components to use a consistent style injection method
const StyleSheetTarget = ({ children, target }) => (
  <StyleSheetManager target={target} enableVendorPrefixes>
    {children}
  </StyleSheetManager>
);

// Funktion, die ein simuliertes Shadow DOM erstellt, auch im DEV‑Modus
function mountWithShadow(container) {
  // Erstelle ein temporäres Element als Shadow Host
  const shadowHost = document.createElement('div');
  shadowHost.style.cssText = `
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100vh;
  `;
  container.appendChild(shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

   // Füge minimale strukturelle Styles in das Shadow DOM ein
   const style = document.createElement('style');
        style.textContent = `
          :host {
            all: initial;
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
          }

          #react-container {
            font-family: Arial, sans-serif;
            font-size: 1rem;
            overscroll-behavior: none;
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100vh;
            position: relative;
          }
        `;
       shadowRoot.appendChild(style);
  
  // Erstelle den React-Container im Shadow DOM
  const reactContainer = document.createElement('div');
  reactContainer.id = 'react-container';
  shadowRoot.appendChild(reactContainer);
  
  // Mounte die App in den Shadow Root
  createRoot(reactContainer).render(
    <StrictMode>
      <StyleSheetTarget target={shadowRoot}>
        <App />
      </StyleSheetTarget>
    </StrictMode>
  );
}

if (import.meta.env.DEV) {
  // DEV-Modus: Mit Shadow DOM wie PROD für konsistentes Verhalten
  let devContainer = document.getElementById('ogb-dev-root');
  if (!devContainer) {
    devContainer = document.createElement('div');
    devContainer.id = 'ogb-dev-root';
    devContainer.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    `;
    document.body.appendChild(devContainer);
  }
  mountWithShadow(devContainer);
} else {
  // PROD-Modus: Verwende ein Custom Element mit Shadow DOM
  class OgbGui extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      // Basis-Styles für das Shadow DOM
      const style = document.createElement('style');
       style.textContent = `
          :host {
            all: initial;
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
          }

          #react-container {
            font-family: Arial, sans-serif;
            font-size: 1rem;
            overscroll-behavior: none;
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100vh;
            position: relative;
          }
        `;
       this.shadowRoot.appendChild(style);
      // Container für die React-App
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
      createRoot(container).render(
        <StrictMode>
          <StyleSheetTarget target={this.shadowRoot}>
            <App />
          </StyleSheetTarget>
        </StrictMode>
      );
    }
  }
  
  customElements.define('ogb-gui', OgbGui);
}
