import React, { ReactNode } from 'react';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/lib/utils';

interface ParallaxContainerProps {
  children: ReactNode;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  offset?: number;
  easing?: string;
  mobile?: boolean;
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  speed = 0.3,
  direction = 'up',
  className,
  offset = 0,
  easing = 'ease-out',
  mobile = true
}) => {
  const { style } = useParallax({ speed, direction, offset, easing, mobile });

  return (
    <div
      className={cn('parallax-container', className)}
      style={style}
    >
      {children}
    </div>
  );
};

export default ParallaxContainer;