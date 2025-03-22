import styles from './Loading.module.css';
import clsx from 'clsx';

interface LoadingComponentProps {
    customClassName?: string;
    isOverlay?: boolean;
}

function LoadingComponent({ customClassName, isOverlay = false }: LoadingComponentProps) {
    const loader = (
        <div className={clsx('d-flex', 'justify-content-center', 'mb-4', 'mt-4', customClassName)}>
            <div className={styles.loader}></div>
        </div>
    );

    return isOverlay ? <div className={clsx(styles.overlay)}>{loader}</div> : loader;
}

export default LoadingComponent;
