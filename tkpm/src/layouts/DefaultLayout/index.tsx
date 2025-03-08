import { ReactNode } from 'react';
import Header from './Header';
import './DefaultLayout.module.css';

interface DefaultLayoutProps {
    children: ReactNode;
}

function DefaultLayout({ children }: DefaultLayoutProps) {
    return (
        <div>
            <Header />
            <div className="container">{children}</div>
        </div>
    );
}

export default DefaultLayout;
