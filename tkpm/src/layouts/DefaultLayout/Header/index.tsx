import clsx from 'clsx';
import styles from './Header.module.css';

function Header() {
    return (
        <div className={clsx('w-100', 'd-flex', 'justify-content-end', styles.headerContainer)}>
            <div className={clsx('d-flex')}>
                <img
                    src="https://www.marktechpost.com/wp-content/uploads/2023/05/7309681-scaled.jpg"
                    className={clsx(styles.image)}
                />
                <div className={clsx('d-flex', 'flex-column', 'ms-2')}>
                    <h6>Username</h6>
                    <h6>role</h6>
                </div>
            </div>
        </div>
    );
}

export default Header;
