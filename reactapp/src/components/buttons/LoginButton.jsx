import { useState, useEffect } from 'react'

import Button from 'react-bootstrap/Button';

import { useAuth0 } from "@auth0/auth0-react";


const LoginButton = ({ customStyle }) => {

    /**
     * 
     * Parameters:
     * - customStyle : str -- A string containing tailwind styles
     */

    const { loginWithRedirect, loginWithPopup } = useAuth0()

    const handleLogin = async () => {
        //await loginWithPopup({
        //    "audience": "https://localhost:7229",
        //    "scope": `read:current_user,
        //                update: current_user_identities,dddddddcccccxds
        //                update:current_user_metadata,
        //                create:current_user_metadata`
        //})
        await loginWithRedirect({
            appState: {
                returnTo: "/",
            },
        });

        // Authorize the custom API after logging in.
        //const accessToken = await getAccessTokenWithPopup({
        //    audience: "https://localhost:7229",
        //});

    };

    return (
        <a onClick={() => loginWithRedirect()}
            className={customStyle ? customStyle : "text-sky-500 font-semibold hover:cursor-pointer text-center inline-block w-full px-4 py-2 text-sm hover:bg-gray-50"}
        >Login</a>
        //<Button onClick={handleLogin} variant="secondary">Login</Button>

    )
}

export default LoginButton;