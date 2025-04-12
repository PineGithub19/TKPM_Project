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

  // Khởi tạo particle random trong vùng container
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

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => {
          let newLeft = p.left + p.directionX;
          let newTop = p.top + p.directionY;

          // Nếu chạm biên thì đảo chiều
          if (newLeft < 0 || newLeft > rect.width) p.directionX *= -1;
          if (newTop < 0 || newTop > rect.height) p.directionY *= -1;

          return {
            ...p,
            left: Math.max(0, Math.min(newLeft, rect.width)),
            top: Math.max(0, Math.min(newTop, rect.height)),
          };
        })
      );
    }, 30);

    return () => clearInterval(interval);
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
