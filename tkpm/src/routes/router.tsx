import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { DefaultLayout } from '../layouts';
import { publicRoutes } from './index';

const withLayout = (Page: React.ComponentType, Layout?: React.ComponentType) => {
    const AppliedLayout = Layout || DefaultLayout;
    return (
        <AppliedLayout>
            <Page />
        </AppliedLayout>
    );
};

export const router = createBrowserRouter(
    publicRoutes.map((route) => ({
        path: route.path,
        element: withLayout(route.component, route.layout),
    })),
);
