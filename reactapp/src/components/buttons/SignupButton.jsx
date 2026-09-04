import { useState, useEffect } from 'react'

import Button from 'react-bootstrap/Button';

import { useAuth0 } from "@auth0/auth0-react";


const SignupButton = ({customStyle}) => {

    /**
     * 
     * Parameters:
     * - customStyle : str -- A string containing tailwind styles
     */

    const { loginWithRedirect } = useAuth0()

    const handleSignUp = async () => {
        await loginWithRedirect({
            appState: {
                returnTo: "/",
            },
            authorizationParams: {
                prompt: "login",
                screen_hint: "signup",
            },
        });

        //// Authorize the custom API after logging in.
        //const accessToken = await getAccessTokenWithPopup({
        //    audience: "https://localhost:7229",
        //});


    };

    return (
        //<Button onClick={handleSignUp} variant="outline-primary">Sign up</Button>
        <a onClick={handleSignUp}
            className={customStyle ? customStyle : "text-gray-700 font-semibold hover:cursor-pointer text-center inline-block w-full px-4 py-2 text-sm hover:bg-gray-50"}
        >Sign Up</a>
    )
}

export default SignupButton;