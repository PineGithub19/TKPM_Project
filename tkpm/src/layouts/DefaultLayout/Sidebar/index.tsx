import clsx from 'clsx';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { publicRoutes } from '../../../routes';
import { Link, useLocation } from 'react-router-dom';

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

    return (
        <div className={clsx('d-flex', 'flex-column', styles.sidebar)}>
            <h3 className={clsx('text-light', 'mb-4')}>Sidebar</h3>
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
        </div>
    );
}

export default Sidebar;
