import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import GlobalStyles from './GlobalStyles/index.tsx';
import { router } from './routes/router.tsx';

import './index.css';
// import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GlobalStyles>
            <RouterProvider router={router} />
        </GlobalStyles>
    </StrictMode>,
);
