// Google Analytics utilities
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'G-FB1F73HMB5';

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track specific AI security interactions
export const trackSecurityEvent = (
  eventType: 'threat_view' | 'control_view' | 'assessment_start' | 'quiz_complete' | 'architecture_view' | 'nist_mapping_view',
  details?: Record<string, any>
) => {
  trackEvent(eventType, 'AI_Security', JSON.stringify(details));
};

// Track page-specific events
export const trackPageEvents = {
  // Homepage events
  heroInteraction: () => trackEvent('hero_interaction', 'Homepage'),
  
  // AISVS events
  aisvsControlView: (controlId: string) => 
    trackSecurityEvent('control_view', { type: 'aisvs', controlId }),
  
  // Threats events
  threatView: (threatId: string) => 
    trackSecurityEvent('threat_view', { threatId }),
  
  // Architecture events
  architectureView: (architectureId: string) => 
    trackSecurityEvent('architecture_view', { architectureId }),
  
  // Assessment events
  assessmentStart: () => trackSecurityEvent('assessment_start'),
  
  // Quiz events
  quizComplete: (score: number, category: string) => 
    trackSecurityEvent('quiz_complete', { score, category }),
  
  // NIST Mapping events
  nistMappingView: (section: string) => 
    trackSecurityEvent('nist_mapping_view', { section }),
  
  // Interactive tools
  toolUsage: (toolName: string) => 
    trackEvent('tool_usage', 'Interactive', toolName),
}; 