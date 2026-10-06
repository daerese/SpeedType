import { useEffect } from 'react'

import Avatar from '../profile/Avatar'

/**
 * InviteAlert
 *
 * The pop-up at the top of the page when someone invites you to a private game.
 *
 * 2026: Stays at the top of the screen even when scrolled, shows the sender's avatar,
 * and hides itself after 10 seconds (the invite is still in the navbar's invites menu).
 */
const InviteAlert = ({ showAlert = true, setShowAlert, invite = null }) => {

    // * Hide the alert automatically after 10 seconds
    useEffect(() => {

        if (!showAlert || !invite) return;

        const timeoutId = setTimeout(() => setShowAlert(false), 10000)

        return () => clearTimeout(timeoutId)

    }, [showAlert, invite])

    if (!showAlert || !invite) {
        return null
    }

    return (

        <div
            role="alert"
            className="fixed top-4 z-50 bg-white border-l-4 border-sky-500 shadow-lg rounded-md py-3 px-4 flex gap-4 items-center max-w-[calc(100%-2rem)]"
            style={{
                left: "50%",
                transform: "translate(-50%)"
            }}
        >

            <Avatar
                avatar={invite.senderProfilePicturePath}
                color={invite.senderColor}
                size={40}
                noRing={true}
            />

            {/*message and join button*/}
            <div>
                <p className="mb-1">
                    <span className="font-semibold">{invite.senderUsername}</span> has invited you to a game
                </p>

                {/* 2026 FIX: Starts with "/" so the link works from any page */}
                <a href={`/game/private/${invite.roomId}`}
                    className="duration-200 rounded-md inline-block bg-green-500 hover:bg-green-600 font-semibold text-white py-1 px-4">Join</a>
            </div>

            {/*close button*/}
            <button type="button" onClick={() => setShowAlert(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center shrink-0">
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close</span>
            </button>

        </div>

    )

}

export default InviteAlert
