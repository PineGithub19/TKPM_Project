import { ComponentType, ReactNode } from 'react';
import { DefaultLayout } from '../layouts';
import DashBoard from '../pages/Dashboard';
import CreateVideo from '../pages/CreateVideo';
import EditVideo from '../pages/EditVideo';
import ExportVideo from '../pages/ExportVideo';
import Management from '../pages/Management';
import Literature from '../pages/Literature';
import ScriptAutoGenerate from '../pages/ScriptAutoGenerate';
import ImagePrompt from '../pages/ImagePrompt';
import { OutSideLayout } from '../layouts';
import Login from '../pages/Login';
import Signup from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import GenerateVoice from '../pages/GenerateVoice';

interface Route {
    path: string;
    component: ComponentType;
    layout?: ComponentType<{ children?: ReactNode }>;
    private?: boolean;
}

// without authentication
const publicRoutes: Route[] = [
    { path: '/', component: Login, layout: OutSideLayout, private: true },
    { path: '/dashboard', component: DashBoard, layout: DefaultLayout },
    { path: '/create-video', component: CreateVideo, layout: DefaultLayout },
    { path: '/edit-video', component: EditVideo, layout: DefaultLayout },
    { path: '/export-video', component: ExportVideo, layout: DefaultLayout },
    { path: '/management', component: Management, layout: DefaultLayout },
    { path: '/image-prompt', component: ImagePrompt, private: true, layout: DefaultLayout },
    { path: '/login', component: Login, layout: OutSideLayout, private: true },
    { path: '/signup', component: Signup, layout: OutSideLayout, private: true },
    { path: '/forgot-password', component: ForgotPassword, layout: OutSideLayout, private: true },
    { path: '/reset-password', component: ResetPassword, layout: OutSideLayout, private: true },
    { path: '/literature', component: Literature, layout: OutSideLayout, private: true },
    { path: '/generate_scrip', component: ScriptAutoGenerate, layout: OutSideLayout, private: true},
    { path: '/voice', component: GenerateVoice, layout: DefaultLayout, private: true },
];

// with authentication
const privateRoutes: Route[] = [];

export { publicRoutes, privateRoutes };
