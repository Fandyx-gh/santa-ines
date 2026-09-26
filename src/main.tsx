import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InternalResponses } from './pages/InternalResponses';
import { SantaInesDiscovery } from './pages/SantaInesDiscovery';
import './index.css';

const isInternalRoute = window.location.pathname.replace(/\/$/, '') === '/internal/responses';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isInternalRoute ? <InternalResponses /> : <SantaInesDiscovery />}
  </StrictMode>,
);
