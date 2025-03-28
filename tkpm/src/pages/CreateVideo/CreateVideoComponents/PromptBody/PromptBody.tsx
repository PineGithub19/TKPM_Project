import { ReactNode } from 'react';
import clsx from 'clsx';

function PromptBody({ children }: { children: ReactNode }) {
    return <div className={clsx('w-100', 'ms-4')}>{children}</div>;
}

export default PromptBody;
