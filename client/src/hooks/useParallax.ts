import { useEffect, useState, useCallback } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
  easing?: string;
  mobile?: boolean;
}

export const useParallax = ({
  speed = 0.5,
  direction = 'up',
  offset = 0,
  easing = 'ease-out',
  mobile = true
}: ParallaxOptions = {}) => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    
    // Optimize for mobile by reducing updates when not visible
    if (mobile) {
      setIsVisible(currentScrollY < window.innerHeight * 2);
    }
  }, [mobile]);

  useEffect(() => {
    if (!mobile && window.innerWidth <= 768) {
      return; // Skip parallax on mobile if disabled
    }

    const throttledScroll = throttle(handleScroll, 16); // 60fps
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll, mobile]);

  const getTransform = useCallback(() => {
    if (!isVisible && mobile) return 'translate3d(0, 0, 0)';
    
    const value = (scrollY + offset) * speed;
    
    switch (direction) {
      case 'up':
        return `translate3d(0, ${-value}px, 0)`;
      case 'down':
        return `translate3d(0, ${value}px, 0)`;
      case 'left':
        return `translate3d(${-value}px, 0, 0)`;
      case 'right':
        return `translate3d(${value}px, 0, 0)`;
      default:
        return `translate3d(0, ${-value}px, 0)`;
    }
  }, [scrollY, offset, speed, direction, isVisible, mobile]);

  return {
    transform: getTransform(),
    scrollY,
    isVisible,
    style: {
      transform: getTransform(),
      transition: easing !== 'none' ? `transform 0.1s ${easing}` : 'none',
      willChange: 'transform'
    }
  };
};

// Throttle utility for performance
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      if (direction !== scrollDirection && Math.abs(scrollY - lastScrollY) > 10) {
        setScrollDirection(direction);
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };

    const throttledUpdate = throttle(updateScrollDirection, 100);
    window.addEventListener('scroll', throttledUpdate, { passive: true });
    
    return () => window.removeEventListener('scroll', throttledUpdate);
  }, [scrollDirection, lastScrollY]);

  return scrollDirection;
};