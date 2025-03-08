import './GlobalStyles.css';
import { ReactNode } from 'react';

interface GlobalStylesProps {
    children: ReactNode;
}

function GlobalStyles({ children }: GlobalStylesProps) {
    return <>{children}</>;
}

export default GlobalStyles;
