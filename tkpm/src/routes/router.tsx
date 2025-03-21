import React, { ComponentType, ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './index';

const withLayout = (Page: React.ComponentType, Layout: React.ComponentType<{ children?: ReactNode }>) => {
    return (
        <Layout>
            <Page />
        </Layout>
    );
};

export const router = createBrowserRouter(
    publicRoutes.map((route) => ({
        path: route.path,
        element: withLayout(route.component, route.layout as ComponentType<{ children?: ReactNode }>),
    })),
);
