import { ReactNode } from 'react';
import clsx from 'clsx';

import Sidebar from './Sidebar';
import Header from './Header';
import styles from './DefaultLayout.module.css';

interface DefaultLayoutProps {
    children?: ReactNode;
}

function DefaultLayout({ children }: DefaultLayoutProps) {
    return (
        <div className={clsx('d-flex', 'flex-row', 'h-100')}>
            <Sidebar />
            <div className={clsx('w-100', styles.bodyContent)}>
                <Header />
                <div className={clsx('w-100')}>{children}</div>
            </div>
        </div>
    );
}

export default DefaultLayout;
