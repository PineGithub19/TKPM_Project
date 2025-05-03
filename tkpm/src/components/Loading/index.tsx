import styles from './Loading.module.css';
import clsx from 'clsx';

interface LoadingComponentProps {
    customClassName?: string;
    description?: string;
    isOverlay?: boolean;
}

function LoadingComponent({ customClassName, description = '', isOverlay = false }: LoadingComponentProps) {
    const loader = (
        <div className={clsx('d-flex', 'flex-column', 'align-items-center', 'justify-content-center', customClassName)}>
            <div className={styles.loader}></div>
            <p className={clsx('mt-2', 'text-white', 'fs-5')}>{description}</p>
        </div>
    );

    return isOverlay ? <div className={clsx(styles.overlay)}>{loader}</div> : loader;
}

export default LoadingComponent;
