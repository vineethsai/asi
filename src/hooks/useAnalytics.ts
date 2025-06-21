import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackPageEvents } from '@/lib/analytics';

// Hook to automatically track page views
export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const url = window.location.origin + location.pathname + location.search + location.hash;
    const title = document.title;
    
    trackPageView(url, title);
  }, [location]);

  return trackPageEvents;
};

// Hook for manual page view tracking with custom data
export const usePageTracking = (pageName: string, additionalData?: Record<string, any>) => {
  const location = useLocation();

  useEffect(() => {
    const url = window.location.origin + location.pathname + location.search + location.hash;
    
    // Track with custom page name and additional data
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-FB1F73HMB5', {
        page_location: url,
        page_title: pageName,
        custom_map: additionalData,
      });
    }
  }, [location, pageName, additionalData]);
}; 