import { useState, useEffect } from 'react'

import { useAuth0 } from "@auth0/auth0-react";

import Avatar from '../../profile/Avatar'

import { getMyFriends } from '../../../services/user.service.jsx'

/**
 * PlayerInvitesModal
 *
 * The host's "Invite players" window in a private game:
 * 1. A link to the room that can be copied and shared with anyone
 * 2. A list of online friends with an "Invite" button
 *
 * 2026:
 * - The online friends list is loaded fresh every time the window opens
 *   (before, it was only loaded once when the page opened, so it got out of date).
 * - The server fills in who the invite is from, so only the friend's id and the room are sent.
 */
const PlayerInvitesModal = ({
    showModal,
    setShowModal,
    inviteUrl,
    invitesSent = {},
    connection,
    roomId }) => {

    const { getAccessTokenSilently } = useAuth0()

    const [onlineFriends, setOnlineFriends] = useState([])

    const [friendsLoading, setFriendsLoading] = useState(false)

    // * The user id of the friend whose invite is being sent right now (shows "Sending...")
    const [sendingTo, setSendingTo] = useState(null)

    const [linkIsCopied, setLinkIsCopied] = useState(false)

    // * Load the online friends each time the window opens
    useEffect(() => {

        if (!showModal) return;

        const loadOnlineFriends = async () => {

            setFriendsLoading(true)

            try {
                const accessToken = await getAccessTokenSilently()

                const { data } = await getMyFriends(accessToken)

                setOnlineFriends((data ?? []).filter(friend => friend.isOnline))
            }
            catch (e) {
                console.error("Could not load online friends: ", e)
            }
            finally {
                setFriendsLoading(false)
            }
        }

        loadOnlineFriends()

    }, [showModal])

    // * Change the "copied" icon back after 2 seconds
    useEffect(() => {

        if (!linkIsCopied) return;

        const timeoutId = setTimeout(() => setLinkIsCopied(false), 2000)

        return () => clearTimeout(timeoutId)

    }, [linkIsCopied])


    /***************
     * Utilty functions
     */

    const sendInvite = async (friendUserId) => {

        setSendingTo(friendUserId)

        try {
            // * The server ignores the first 3 values (who it's from) and uses the logged-in host instead
            await connection.invoke("SendInvite", "", "", "", friendUserId, roomId)
        }
        catch (e) {
            console.error("Could not send the invite: ", e)
        }
        finally {
            setSendingTo(null)
        }
    }

    const copyToClipboard = async (text) => {

        await navigator.clipboard.writeText(text)

        setLinkIsCopied(true)

    }


    if (!showModal) {
        return null
    }

    return (

        //Modal container wrapper (clicking the dark background closes it)
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-players-title"
            onClick={() => setShowModal(false)}
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            className="overflow-y-auto overflow-x-hidden fixed inset-0 z-50 w-full h-screen"
        >

            {/*Modal Content Wrapper*/}
            <div className="absolute p-4 w-full max-w-2xl max-h-full"
                style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                }}>

                {/*Modal Content (clicks inside don't close it)*/}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white rounded-lg shadow space-y-4 py-4"
                >

                    {/*Modal header*/}
                    <div className="flex items-center justify-between px-5">
                        <h4 id="invite-players-title" className="text-lg font-semibold">
                            Invite players
                        </h4>
                        <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                            </svg>
                            <span className="sr-only">Close</span>
                        </button>
                    </div>

                    <hr></hr>

                    {/*room link*/}
                    <div className="w-full px-4 md:px-5">
                        <p className="font-semibold mb-2">Share the room link:</p>

                        <div className="relative">
                            <label htmlFor="room-link" className="sr-only">Room link</label>
                            <input id="room-link" type="text" className="bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg block w-full pl-2.5 pr-14 py-4" value={inviteUrl} readOnly></input>
                            <button
                                type="button"
                                aria-label={linkIsCopied ? "Link copied" : "Copy link"}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-900 hover:bg-gray-100 rounded-lg py-2 px-2.5 inline-flex items-center justify-center bg-white border-gray-200 border"
                                onClick={() => copyToClipboard(inviteUrl)}
                            >
                                {
                                    linkIsCopied ?

                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-green-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                                        </svg>

                                        :

                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                        </svg>
                                }
                            </button>
                        </div>

                        {linkIsCopied && <p className="text-sm text-green-600 mt-1">Link copied!</p>}
                    </div>

                    <hr></hr>

                    {/*online friends to invite*/}
                    <div className="px-5">

                        <p className="font-semibold mb-2">Invite online friends:</p>

                        {
                            friendsLoading && onlineFriends.length === 0 ?

                                <p className="text-sm text-gray-500 border-t pt-2 text-center">Loading friends...</p>

                                :

                                onlineFriends.length > 0 ?

                                    //onlineFriends scrollable container
                                    <div className="border rounded-md max-h-48 overflow-auto">
                                        {
                                            onlineFriends.map((friend, index, friendArray) =>

                                                <div key={friend.userId} className={`flex w-full p-2 justify-between items-center ${index != friendArray.length - 1 && "border-b"}`}>

                                                    {/*Avatar and name*/}
                                                    <div className="flex items-center gap-2">

                                                        <Avatar
                                                            avatar={friend.profilePicturePath}
                                                            color={friend.color}
                                                            size={44}
                                                            noRing={true}
                                                        />

                                                        <p className="font-semibold flex items-center">
                                                            {friend.username}
                                                            <span className="inline-block ml-2 bg-green-400 rounded-full size-2.5"></span>
                                                        </p>

                                                    </div>

                                                    {/*Invite button */}
                                                    {
                                                        invitesSent.hasOwnProperty(friend.userId) ?
                                                            <button
                                                                disabled={true}
                                                                type="button"
                                                                className="py-2 px-4 opacity-60 bg-green-500 text-white text-sm rounded-md"
                                                            >
                                                                Invite Sent
                                                            </button>
                                                            :
                                                            <button
                                                                onClick={() => sendInvite(friend.userId)}
                                                                disabled={sendingTo === friend.userId}
                                                                type="button"
                                                                className="py-2 px-4 bg-green-500 text-white text-sm rounded-md duration-200 hover:bg-green-600 disabled:opacity-60"
                                                            >
                                                                {sendingTo === friend.userId ? "Sending..." : "Invite"}
                                                            </button>
                                                    }

                                                </div>
                                            )
                                        }
                                    </div>

                                    :

                                    <p className="text-sm text-gray-500 border-t pt-2 text-center">
                                        None of your friends are online right now. Share the link above instead!
                                    </p>
                        }

                    </div>

                </div>

            </div>

        </div>

    )
}

export default PlayerInvitesModal
