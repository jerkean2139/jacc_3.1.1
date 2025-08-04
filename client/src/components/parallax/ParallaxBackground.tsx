import React from 'react';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/lib/utils';

interface ParallaxBackgroundProps {
  children?: React.ReactNode;
  speed?: number;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({
  children,
  speed = 0.5,
  className,
  overlay = false,
  overlayOpacity = 0.3
}) => {
  const { style } = useParallax({ speed, direction: 'up', mobile: true });

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
        style={style}
      />
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ParallaxBackground;