import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: "Vanilla Whale";
    src: url("/fonts/Vanilla Whale.otf") format("opentype");
    font-weight: normal;
    font-style: normal;
    font-display: block;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Unbounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
  }

  html {
    font-family: 'Unbounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    /* Prevent font scaling on orientation change in iOS */
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Unbounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #ffffff;
    color: #2c3e50;
    font-weight: 400;
    line-height: 1.6;
    /* Prevent horizontal scroll on mobile */
    overflow-x: hidden;
    width: 100%;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Unbounded', sans-serif;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0.5em;
  }

  p, span, div, a, li, td, th, label, input, textarea, select, button {
    font-family: 'Unbounded', sans-serif;
  }

  input, textarea, select, button {
    font-family: 'Unbounded', sans-serif;
    font-size: inherit;
    /* Prevent zoom on input focus in iOS */
    font-size: max(16px, 1em);
  }

  code {
    font-family: 'Fira Code', 'JetBrains Mono', source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Unbounded', sans-serif;
    width: 100%;
    overflow-x: hidden;
  }

  /* Asegurar que React Router y otros elementos usen la fuente */
  .App {
    font-family: 'Unbounded', sans-serif;
    flex: 1;
    width: 100%;
    overflow-x: hidden;
  }

  /* Touch improvements */
  button, a, [role="button"] {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    min-height: 44px;
  }

  /* Estilos para mejorar la legibilidad de Unbounded */
  .unbounded-light { font-weight: 300; }
  .unbounded-regular { font-weight: 400; }
  .unbounded-medium { font-weight: 500; }
  .unbounded-semibold { font-weight: 600; }
  .unbounded-bold { font-weight: 700; }
  .unbounded-extrabold { font-weight: 800; }
`;
