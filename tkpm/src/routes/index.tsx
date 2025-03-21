import { ComponentType, ReactNode } from 'react';
import { DefaultLayout } from '../layouts';
import DashBoard from '../pages/Dashboard';
import CreateVideo from '../pages/CreateVideo';
import EditVideo from '../pages/EditVideo';
import Management from '../pages/Management';
import ImagePrompt from '../pages/ImagePrompt';

interface Route {
    path: string;
    component: ComponentType;
    layout?: ComponentType<{ children?: ReactNode }>;
    private?: boolean;
}

// without authentication
const publicRoutes: Route[] = [
    { path: '/dashboard', component: DashBoard, layout: DefaultLayout },
    { path: '/create-video', component: CreateVideo, layout: DefaultLayout },
    { path: '/edit-video', component: EditVideo, layout: DefaultLayout },
    { path: '/management', component: Management, layout: DefaultLayout },
    { path: '/image-prompt', component: ImagePrompt, private: true, layout: DefaultLayout },
];

// with authentication
const privateRoutes: Route[] = [];

export { publicRoutes, privateRoutes };
