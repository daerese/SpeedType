

import { useState, useEffect } from 'react'

import Button from 'react-bootstrap/Button';

import { useAuth0 } from "@auth0/auth0-react";


const LogoutButton = () => {

    const { logout } = useAuth0();

    const handleLogout = () => {
        logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
    };

    return (
        //<Button onClick={handleLogout} variant="outline-info">Logout</Button>
        <a onClick={handleLogout}
            className="text-gray-700 font-semibold hover:cursor-pointer text-center inline-block w-full px-4 py-2 text-sm hover:bg-gray-50"
        >Log Out</a>
    )
}

export default LogoutButton;