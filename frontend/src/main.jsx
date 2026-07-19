import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import QueryProvider from './providers/QueryProvider';
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init({
  duration: 1000,
  once: true,
  offset: 100,
});

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <QueryProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className: 'dark:bg-surface-800 dark:text-surface-200',
          }}
        />
        <App />
      </BrowserRouter>
    </QueryProvider>
  </ThemeProvider>
);
