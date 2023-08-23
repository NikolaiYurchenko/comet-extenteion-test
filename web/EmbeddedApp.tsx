import './init';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useRPC } from './lib/useRPC';
import { useWeb3 } from './lib/useWeb3';
import {theme} from "../styles/theme";
import {ThemeProvider} from "@emotion/react";

function EmbeddedApp() {
  let rpc = useRPC();
  let web3 = useWeb3(rpc.sendRPC);

  return <App rpc={rpc} web3={web3} />
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <div className="backdrop"></div>
      <EmbeddedApp />
    </ThemeProvider>
  </React.StrictMode>
)
