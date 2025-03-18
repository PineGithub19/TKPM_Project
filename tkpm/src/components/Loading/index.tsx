import styles from './Loading.module.css';
import clsx from 'clsx';

function LoadingComponent() {
    return (
        <div className={clsx('d-flex', 'justify-content-center', 'mb-4', 'mt-4')}>
            <div className={styles.loader}></div>
        </div>
    );
}

export default LoadingComponent;
