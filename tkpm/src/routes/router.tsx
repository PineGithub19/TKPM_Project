import { createBrowserRouter } from 'react-router-dom';
import { DefaultLayout } from '../layouts';
import { publicRoutes } from './index';

const withLayout = (Page: React.ComponentType, Layout = DefaultLayout) => (
    <Layout>
        <Page />
    </Layout>
);

export const router = createBrowserRouter(
    publicRoutes.map((route) => ({
        path: route.path,
        element: withLayout(route.component),
    })),
);
