import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { Auth0Provider } from '@auth0/auth0-react';



const Root = () => {
    return (
        <React.StrictMode>
            <Auth0Provider
                //DOMAIN AND CLIENTID OF PREVIOUS AUTH0 SETTINGS
                //domain="dev-w5kn5y38eszy14v4.us.auth0.com"
                //clientId="Gg6kHUxBcMsaY4COp7nsJhY8P84IBY3M"
                domain="dev-ippqzudwhbjx1jrd.us.auth0.com"
                clientId="KWZmfE4mBDF7rZmgm5FdSHwAZa0cwqlO"
                authorizationParams={{
                    //audience: "https://dev-w5kn5y38eszy14v4.us.auth0.com/api/v2/",
                    audience: "https://localhost:7229",
                    redirect_uri: "https://localhost:5173",
                    //scope: "read:current_user update:current_user_metadata update:users",
                    returnTo: "/"
                }}
            >
                <App />
            </Auth0Provider>
        </React.StrictMode>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);