import React, { useEffect, useState } from 'react';
import styles from './Moon.module.css';

const Moon: React.FC = () => {
  const [left, setLeft] = useState(0);
  const moonSize = 60;
  const moveDistance = 0.2;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLeft(prevLeft => {
        const newLeft = prevLeft + moveDistance;
        if (newLeft > window.innerWidth) {
          return -moonSize;
        }
        return newLeft;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={styles.moon}
      style={{
        left: `${left}px`,
        filter: 'blur(1px)',
        position: 'absolute',
      }}
    />
  );
};

export default Moon;
