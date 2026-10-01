import { createContext, useContext, useState, useEffect, useCallback } from 'react'

import { useAuth0 } from "@auth0/auth0-react";

import { getCurrentUser, createCurrentUser } from '../services/user.service.jsx'

/**
 * DbUserContext (2026)
 *
 * Stores the logged-in user's data from OUR database (username, stats, color, picture, bio)
 * and shares it with every page.
 *
 * SIMPLE TERMS: Auth0 tells us WHO the user is. This asks our backend (/api/user/me)
 * for their LATEST data, so stats and profile changes show up without logging out and back in.
 *
 * How to use it in a component:
 *      const { dbUser, dbUserLoading, refreshDbUser } = useDbUser()
 *
 * - dbUser: the user's data (null while loading or when logged out)
 * - dbUserLoading: true while the data is being fetched
 * - refreshDbUser(): fetches the latest data again (EX: after saving profile changes)
 */

const DbUserContext = createContext(null)

export const DbUserProvider = ({ children }) => {

    const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()

    const [dbUser, setDbUser] = useState(null)

    const [dbUserLoading, setDbUserLoading] = useState(true)

    const refreshDbUser = useCallback(async () => {

        try {
            const accessToken = await getAccessTokenSilently()

            let { data, error } = await getCurrentUser(accessToken)

            // * 404 = this user has no database profile yet (their first login). Create it.
            if (error && error.status === 404) {
                console.log("First login: creating the database user");

                ({ data, error } = await createCurrentUser(accessToken))
            }

            if (error) {
                console.error("Could not load the database user: ", error.message)
            }

            setDbUser(data)
        }
        catch (e) {
            console.error("Could not load the database user: ", e)
        }
        finally {
            setDbUserLoading(false)
        }

    }, [getAccessTokenSilently])

    useEffect(() => {

        // * Wait for Auth0 to finish loading before deciding anything
        if (isLoading) return;

        if (isAuthenticated) {
            refreshDbUser()
        }
        else {
            setDbUser(null)
            setDbUserLoading(false)
        }

    }, [isLoading, isAuthenticated, refreshDbUser])

    return (
        <DbUserContext.Provider value={{ dbUser, dbUserLoading, refreshDbUser }}>
            {children}
        </DbUserContext.Provider>
    )
}

export const useDbUser = () => useContext(DbUserContext)
