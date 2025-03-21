import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteContextType {
    currentRoute: string;
    previousRoute: string;
}

const RouteContext = createContext<RouteContextType | null>(null);

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const [currentRoute, setCurrentRoute] = useState(location.pathname);
    const previousRouteRef = useRef<string>('');

    useEffect(() => {
        previousRouteRef.current = currentRoute;
        setCurrentRoute(location.pathname);
    }, [location]);

    return (
        <RouteContext.Provider value={{ currentRoute, previousRoute: previousRouteRef.current }}>
            {children}
        </RouteContext.Provider>
    );
};

export const useRouteTracker = () => {
    const context = useContext(RouteContext);
    if (!context) throw new Error('useRouteTracker must be used within RouteProvider');
    return context;
};
