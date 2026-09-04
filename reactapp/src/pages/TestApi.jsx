import { useState, useEffect } from "react";

import { useAuth0 } from "@auth0/auth0-react";

import { testRoute, testAuth } from "../services/user.service"

const TestApi = () => {

    const [message, setMessage] = useState("");

    const { isAuthenticated, getAccessTokenSilently } = useAuth0()

    useEffect(() => {
        let isMounted = true;

        const getMessage = async () => {


            //const accessToken = isAuthenticated ? await getAccessTokenSilently() : null

            const accessToken = isAuthenticated ? await getAccessTokenSilently({
                authorizationParams: {
                    audience: `https://localhost:7229`,
                },
            })
                :
            null

            console.log(accessToken)
            console.log(isAuthenticated)

            
            const { data, error } = accessToken ?
                await testAuth(accessToken)
                :
                await testRoute()

            //const {data, error } = await testAuth(accessToken)

            if (!isMounted) {
                return;
            }

            if (data) {
                setMessage(JSON.stringify(data, null, 2));
            }

            if (error) {
                setMessage(JSON.stringify(error, null, 2));
            }
        };

        getMessage();

        return () => {
            isMounted = false;
        };
    }, [])


    return (
        <>
            <h2>Message:</h2>
            <p>{message}</p>
        </>
    )
}

export default TestApi