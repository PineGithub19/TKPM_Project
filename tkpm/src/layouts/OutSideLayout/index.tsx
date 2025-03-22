import { ReactNode } from 'react';
import clsx from 'clsx';


interface OutSideLayoutProps {
    children?: ReactNode;
}

function OutSideLayout({ children }: OutSideLayoutProps) {
    return (
        <div className={clsx('d-flex', 'flex-row', 'h-100', 'w-100')} style={{ backgroundColor: 'rgb(83, 79, 99)' }}>
            <div className={clsx('w-100')}>{children}</div>
        </div>
    );
}

export default OutSideLayout;
