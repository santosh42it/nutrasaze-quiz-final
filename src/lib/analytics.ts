
// Google Analytics 4 utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = 'G-83LRM8E7DZ';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = (action: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

// Track quiz events
export const trackQuizEvent = (eventName: string, parameters?: Record<string, any>) => {
  event(eventName, {
    event_category: 'Quiz',
    ...parameters,
  });
};

// Track quiz completion
export const trackQuizCompletion = (resultId: string, totalQuestions: number) => {
  event('quiz_complete', {
    event_category: 'Quiz',
    result_id: resultId,
    total_questions: totalQuestions,
  });
};

// Track product recommendations
export const trackProductRecommendation = (products: string[], resultId: string) => {
  event('view_item_list', {
    event_category: 'Product',
    item_list_name: 'Quiz Results',
    items: products.map((product, index) => ({
      item_name: product,
      index: index + 1,
    })),
    result_id: resultId,
  });
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location?: string) => {
  event('click', {
    event_category: 'Button',
    button_name: buttonName,
    location: location,
  });
};
