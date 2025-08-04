import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
  mobile?: boolean;
}

export const ParallaxCard: React.FC<ParallaxCardProps> = ({
  children,
  className,
  intensity = 0.1,
  perspective = 1000,
  mobile = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    if (!mobile && window.innerWidth <= 768) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * intensity;
      const deltaY = (e.clientY - centerY) * intensity;
      
      setTransform(
        `perspective(${perspective}px) rotateX(${-deltaY}deg) rotateY(${deltaX}deg) translateZ(10px)`
      );
    };

    const handleMouseLeave = () => {
      setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [intensity, perspective, mobile]);

  return (
    <div
      ref={cardRef}
      className={cn('parallax-card transition-transform duration-200 ease-out', className)}
      style={{
        transform,
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxCard;