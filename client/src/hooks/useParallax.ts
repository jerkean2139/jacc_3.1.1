import { useEffect, useRef, useState } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
  enableOnMobile?: boolean;
}

export function useParallax(options: ParallaxOptions = {}) {
  const {
    speed = 0.5,
    direction = 'up',
    enableOnMobile = true
  } = options;
  
  const elementRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!enableOnMobile && isMobile) return;
    
    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };

    const throttledHandleScroll = throttle(handleScroll, 16); // ~60fps
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [enableOnMobile, isMobile]);

  useEffect(() => {
    if (!elementRef.current || (!enableOnMobile && isMobile)) return;
    
    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + window.pageYOffset;
    const elementHeight = rect.height;
    const windowHeight = window.innerHeight;
    
    // Calculate if element is in viewport
    const isInViewport = scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight;
    
    if (isInViewport) {
      const progress = (scrollY + windowHeight - elementTop) / (windowHeight + elementHeight);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      
      const translateY = direction === 'up' 
        ? -(clampedProgress * speed * 100)
        : (clampedProgress * speed * 100);
      
      element.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }
  }, [scrollY, speed, direction, enableOnMobile, isMobile]);

  return elementRef;
}

// Utility function to throttle scroll events
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Hook for smooth scroll-based animations
export function useScrollAnimation() {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(Math.min(100, Math.max(0, scrolled)));
    };

    const throttledHandleScroll = throttle(handleScroll, 16);
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);

  return scrollProgress;
}