import { createContext, useContext } from 'react'

/**
 * GameConnectionContext (2026)
 *
 * Shares actions that use the game server connection (SignalR) with any component,
 * without passing them through every page as props.
 *
 * Provided by ConnectionWrapper. EX (in the navbar):
 *      const { declineInvite } = useGameConnection()
 */
export const GameConnectionContext = createContext({
    declineInvite: null
})

export const useGameConnection = () => useContext(GameConnectionContext)
