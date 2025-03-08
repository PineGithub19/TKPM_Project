import { ComponentType } from 'react';
import DashBoard from '../pages/Dashboard';
import CreateVideo from '../pages/CreateVideo';
import EditVideo from '../pages/EditVideo';
import Management from '../pages/Management';

interface Route {
    path: string;
    component: ComponentType;
    layout?: ComponentType;
}

// without authentication
const publicRoutes: Route[] = [
    { path: '/dashboard', component: DashBoard },
    { path: '/createvideo', component: CreateVideo },
    { path: '/editvideo', component: EditVideo },
    { path: '/management', component: Management },
];

// with authentication
const privateRoutes: string[] = [];

export { publicRoutes, privateRoutes };
