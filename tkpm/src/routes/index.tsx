import { ComponentType } from 'react';
import DashBoard from '../pages/Dashboard';
import CreateVideo from '../pages/CreateVideo';
import EditVideo from '../pages/EditVideo';
import Management from '../pages/Management';
import ImagePrompt from '../pages/ImagePrompt';

interface Route {
    path: string;
    component: ComponentType;
    layout?: ComponentType;
    private?: boolean;
}

// without authentication
const publicRoutes: Route[] = [
    { path: '/dashboard', component: DashBoard },
    { path: '/create-video', component: CreateVideo },
    { path: '/edit-video', component: EditVideo },
    { path: '/management', component: Management },
    { path: '/image-prompt', component: ImagePrompt, private: true },
];

// with authentication
const privateRoutes: Route[] = [];

export { publicRoutes, privateRoutes };
