import clsx from 'clsx';
import styles from './Header.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import SeearchBar from './HeaderComponenets/SearchBar/SearchBar';

interface UserI {
    username: string;
    role: string;
}

function Header() {
    const [user, setUser] = useState<UserI | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('token='))
            ?.split('=')[1];

        if (token) {
            try {
                const decoded: UserI = jwtDecode(token);
                setUser({
                    username: decoded.username || 'Guest',
                    role: decoded.role || 'User',
                });
            } catch (error) {
                console.error('Invalid token:', error);
            }
        }
    }, []);

    const handleLogout = () => {
        // Xóa token và thời gian hết hạn khỏi localStorage
        localStorage.removeItem('googleToken');
        localStorage.removeItem('tokenExpiration');
        
        // Điều hướng người dùng về trang login
        navigate('/login');
    };

    return (
        <div className={clsx('w-100', 'd-flex', 'justify-content-between', styles.headerContainer)}>
            <SeearchBar />
            <div className={clsx('d-flex')}>
                <img
                    src="https://www.marktechpost.com/wp-content/uploads/2023/05/7309681-scaled.jpg"
                    className={clsx(styles.image)}
                    alt="Avatar"
                />
                <div className={clsx('d-flex', 'flex-column', 'ms-2')}>
                    <h6>{user ? user.username : 'Guest'}</h6>
                    <h6>{user ? user.role : 'No Role'}</h6>
                </div>
            </div>

            {/* Nút Logout */}
            <button className={clsx('btn', 'btn-danger', 'ms-3')} onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default Header;
