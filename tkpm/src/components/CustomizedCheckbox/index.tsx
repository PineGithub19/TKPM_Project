import React from 'react';
import clsx from 'clsx';
import styles from './CustomizedCheckbox.module.css';

const CustomizedCheckbox: React.FC<{ isChecked: boolean; onClick: () => void }> = ({ onClick, isChecked }) => {
    return (
        <button
            className={clsx(styles['checkbox-wrapper-12'])}
            onClick={onClick}
            style={{ padding: '0px', border: 'none', background: 'transparent' }}
        >
            <div className={styles.cbx}>
                <input id="cbx-12" type="checkbox" checked={isChecked} readOnly />
                <label htmlFor="cbx-12"></label>
                <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                    <path d="M2 8.36364L6.23077 12L13 2"></path>
                </svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                <defs>
                    <filter id="goo-12">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
                            result="goo-12"
                        />
                        <feBlend in="SourceGraphic" in2="goo-12" />
                    </filter>
                </defs>
            </svg>
        </button>
    );
};

export default CustomizedCheckbox;
