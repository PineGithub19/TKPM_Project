import clsx from 'clsx';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { publicRoutes } from '../../../routes';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

interface SidebarItem {
    name: string;
    route: string;
}

function formatName(str: string): string {
    return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function Sidebar() {
    const navigate = useNavigate();

    const location = useLocation();
    const [routes, setRoutes] = useState<SidebarItem[]>([]);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

    const handleSelectedItem = (index: number) => {
        const currentPath = location.pathname;
        if (currentPath === routes[index].route) {
            setSelectedItemIndex(index);
        }
    };

    useEffect(() => {
        const newRoutes = publicRoutes
            .filter((route) => !route.private) // Filter out non-private routes
            .map((route) => ({
                name: formatName(route.path.slice(1)), // Format the name
                route: route.path, // Keep the route path
            }));
        setRoutes(newRoutes);
    }, []);

    useEffect(() => {
        const currentPath = location.pathname;
        const index = routes.findIndex((route) => route.route === currentPath);
        if (index !== -1) {
            setSelectedItemIndex(index);
        } else {
            setSelectedItemIndex(0); // Default to the first item if not found
        }
    }, [location, routes]);

    const handleLogout = () => {
        // Xóa token và thời gian hết hạn khỏi localStorage
        localStorage.removeItem('googleToken');
        localStorage.removeItem('tokenExpiration');

        // Điều hướng người dùng về trang login
        navigate('/login');
    };

    return (
        <div className={clsx('d-flex', 'flex-column', styles.sidebar)}>
            <div className={clsx('text-light', 'mb-4', 'ms-auto', 'me-auto', 'd-flex', 'align-items-center')}>
                <img src="../../../../public/logotkpm.png" alt="ChillUS Logo" className={clsx(styles.logoImg)} />
                <Link to="/dashboard" className={clsx('text-light', 'text-decoration-none')}>
                    <span className={clsx('fs-2')}>ChillUS</span>
                </Link>
            </div>
            {routes.map((route, index) => (
                <Link
                    to={route.route}
                    key={index}
                    className={clsx(styles.sidebarItem, {
                        [styles.activeSelected]: index === selectedItemIndex || location.pathname === route.route,
                    })}
                    onClick={() => handleSelectedItem(index)}
                >
                    {route.name}
                </Link>
            ))}
            <div
                className={clsx('d-flex', 'align-items-center', 'mt-auto', styles.sidebarItem, styles.logoutBtn)}
                onClick={handleLogout}
            >
                <FontAwesomeIcon icon={faRightFromBracket} className={clsx('me-2')} />
                <p className={clsx('m-0')}>Logout</p>
            </div>
        </div>
    );
}

export default Sidebar;
