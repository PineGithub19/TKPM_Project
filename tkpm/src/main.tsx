import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import GlobalStyles from './GlobalStyles/index.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './routes/router.tsx';

import './index.css';
// import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
            <GlobalStyles>
                <RouterProvider router={router} />
            </GlobalStyles>
        </GoogleOAuthProvider>
    </StrictMode>,
);
