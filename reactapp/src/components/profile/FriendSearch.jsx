import { useState, useEffect } from 'react'

import { useAuth0 } from "@auth0/auth0-react";

import { searchUsers } from '../../services/user.service.jsx'

import UserRow from './UserRow'

/**
 * FriendSearch (2026)
 *
 * A search box for finding players by username. Clicking a result opens their profile,
 * which has the "Add as Friend" button.
 *
 * SIMPLE TERMS: Type at least 2 letters, wait a moment, and matching players show up.
 *
 * @param {string} inputClassName - Optional extra styles for the text box
 */
const FriendSearch = ({ inputClassName = "" }) => {

    const { getAccessTokenSilently } = useAuth0()

    const [query, setQuery] = useState("")

    const [results, setResults] = useState([])

    const [searching, setSearching] = useState(false)

    useEffect(() => {

        const trimmedQuery = query.trim()

        // * Don't search for less than 2 letters
        if (trimmedQuery.length < 2) {
            setResults([])
            setSearching(false)
            return
        }

        setSearching(true)

        // * "Debounce": wait until the player STOPS typing for 300ms before searching.
        // * Every new keystroke runs the cleanup below, which cancels the previous wait.
        // * This stops us from calling the server on every single letter.
        let cancelled = false

        const timeoutId = setTimeout(async () => {

            try {
                const accessToken = await getAccessTokenSilently()

                const { data } = await searchUsers(accessToken, trimmedQuery)

                // * Ignore results for an old search (the player kept typing)
                if (!cancelled) {
                    setResults(data ?? [])
                }
            }
            catch (e) {
                console.error("Player search failed: ", e)
            }
            finally {
                if (!cancelled) {
                    setSearching(false)
                }
            }

        }, 300)

        return () => {
            cancelled = true
            clearTimeout(timeoutId)
        }

    }, [query])

    const hasSearched = query.trim().length >= 2

    return (
        <div>
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search players by username"
                aria-label="Search players by username"
                className={`w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${inputClassName}`}
            />

            {
                hasSearched &&
                <div className="mt-2">
                    {
                        searching ?
                            <p className="text-sm text-gray-500 p-2">Searching...</p>
                            :
                            results.length > 0 ?
                                results.map((user) =>
                                    <UserRow user={user} key={user.username} />
                                )
                                :
                                <p className="text-sm text-gray-500 p-2">No players found</p>
                    }
                </div>
            }
        </div>
    )
}

export default FriendSearch
