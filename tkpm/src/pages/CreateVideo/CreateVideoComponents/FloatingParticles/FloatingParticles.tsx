import React, { useEffect, useRef, useState } from 'react';
import styles from './FloatingParticles.module.css';

type Particle = {
  left: number;
  top: number;
  size: number;
  directionX: number;
  directionY: number;
};

const FloatingParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });

  const initParticles = (count: number, width: number, height: number) => {
    const generated: Particle[] = [];
    for (let i = 0; i < count; i++) {
      generated.push({
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 8 + 4,
        directionX: (Math.random() - 0.5) * 1,
        directionY: (Math.random() - 0.5) * 1,
      });
    }
    return generated;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newParticles = initParticles(200, rect.width, rect.height);
    setParticles(newParticles);

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = container.getBoundingClientRect();
      mousePos.current.x = e.clientX - bounds.left;
      mousePos.current.y = e.clientY - bounds.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => {
          const dx = mousePos.current.x - p.left;
          const dy = mousePos.current.y - p.top;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let speedMultiplier = 1;

          if (distance < 150) {
            speedMultiplier = 5; // Gần chuột thì bay nhanh hơn
          }

          const moveX = p.directionX * speedMultiplier;
          const moveY = p.directionY * speedMultiplier;

          let newLeft = p.left + moveX;
          let newTop = p.top + moveY;

          if (newLeft < 0 || newLeft > rect.width) {
            p.directionX *= -1;
          }
          if (newTop < 0 || newTop > rect.height) {
            p.directionY *= -1;
          }

          return {
            ...p,
            left: Math.max(0, Math.min(newLeft, rect.width)),
            top: Math.max(0, Math.min(newTop, rect.height)),
          };
        })
      );
    }, 30);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className={styles['floating-container']} ref={containerRef}>
      {particles.map((p, i) => (
        <div
          key={i}
          className={styles['floating-particle']}
          style={{
            left: `${p.left}px`,
            top: `${p.top}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
