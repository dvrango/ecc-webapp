import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import Admin from './Admin.tsx';
import ShareCard from './ShareCard.tsx';
import HostCard from './HostCard.tsx';
import Members from './Members.tsx';
import AgendaPage from './AgendaPage.tsx';
import EventPage from './EventPage.tsx';
import HostPage from './HostPage.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/events',
    element: <AgendaPage />
  },
  {
    path: '/events/:id',
    element: <EventPage />
  },
  {
    path: '/host',
    element: <HostPage />
  },
  {
    path: '/members',
    element: <Members />
  },
  {
    path: '/admin',
    element: <Admin />
  },
  {
    path: '/admin/share',
    element: <ShareCard />
  },
  {
    path: '/admin/share/:eventId',
    element: <ShareCard />
  },
  {
    path: '/admin/host-card',
    element: <HostCard />
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
