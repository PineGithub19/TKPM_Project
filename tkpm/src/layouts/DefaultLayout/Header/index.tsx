import clsx from 'clsx';
import styles from './Header.module.css';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface UserI {
    username: string;
    role: string;
}

function Header() {
    const [user, setUser] = useState<UserI | null>(null);

    useEffect(() => {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];

        if (token) {
            try {
                const decoded: UserI = jwtDecode(token);
                setUser({
                    username: decoded.username || 'Guest',
                    role: decoded.role || 'User',
                });
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    }, []);

    return (
        <div className={clsx('w-100', 'd-flex', 'justify-content-end', styles.headerContainer)}>
            <div className={clsx('d-flex')}>
                <img
                    src="https://www.marktechpost.com/wp-content/uploads/2023/05/7309681-scaled.jpg"
                    className={clsx(styles.image)}
                    alt="Avatar"
                />
                <div className={clsx('d-flex', 'flex-column', 'ms-2')}>
                    <h6>{user ? user.username : "Guest"}</h6>
                    <h6>{user ? user.role : "No Role"}</h6>
                </div>
            </div>
        </div>
    );
}

export default Header;
