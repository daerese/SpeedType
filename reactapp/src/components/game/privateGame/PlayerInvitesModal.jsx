import { useState, useEffect } from 'react'

import Avatar from '../../profile/Avatar'

const PlayerInvitesModal = ({
    showModal,
    setShowModal,
    inviteUrl,
    invitesSent = {},
    onlineFriends = [],
    connection,
    currUsername,
    currUserId,
    currProfileImg,
    roomId }) => {

    // * Determines if the invite button should be in the loading state or not. Waits for an invite to finish sending.
    const [inviteSending, setInviteSending] = useState(false)

    // * The user ID of the friend that the host currently wants to invite
    const [receiverUserId, setReceiverUserId] = useState("")


    const [linkIsCopied, setLinkIsCopied] = useState(false)




    useEffect(() => {

        // * If the state of userId of the invite receiver is not empty 
        if (receiverUserId && !inviteSending) {
            setInviteSending(true)
        }

    }, [receiverUserId])

    useEffect(() => {

        const sendInvite = async () => {

            const senderUserId = currUserId
            const senderUsername = currUsername
            const senderProfilePicturePath = currProfileImg


            await connection.invoke("SendInvite", senderUserId, senderUsername, senderProfilePicturePath, receiverUserId, roomId)

        }

        if (inviteSending) {

            sendInvite()

            setReceiverUserId("")
            setInviteSending(false)

        }

    }, [inviteSending])

    // * Triggers after the host successfully sent an invite. HOst recieves a new dictionary containing the invites sent
    useEffect(() => {

        console.log("New invite sent in playerInvitesModal: ", invitesSent)

    }, [invitesSent])


    /***************
     * Utilty functions
     */


    /**
     * Copy to clipboard function
     */

    const copyToClipboard = async (text) => {

        await navigator.clipboard.writeText(text)

        setLinkIsCopied(true)

    }


    return (

        <>

            {/*Modal container wrapper*/}
            <div tabIndex="-1" aria-hidden={showModal ? "false" : "true"}
                style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                className={`${showModal ? "" : "hidden"} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-screen`}>

                {/*Modal Content Wrapper*/}
                <div className="absolute p-4 w-full max-w-2xl max-h-full"
                    style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)"
                    }}>

                    {/*Modal Content*/}
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700 space-y-4 py-4">

                        {/*Modal header*/}
                        <div className="flex items-center justify-between px-5">
                            <h4 className="text-lg font-semibold">
                                Invite players
                            </h4>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>

                        <hr></hr>

                        {/*modal body*/}




                        <div class="w-full px-4 md:px-5">
                            <p className="font-semibold mb-2">Share the room link:</p>

                            <div class="relative">
                                <label for="npm-install-copy-text" class="sr-only">Label</label>
                                <input id="npm-install-copy-text" type="text" class="col-span-6 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" value={inviteUrl} disabled readonly></input>
                                <button
                                    class="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg py-2 px-2.5 inline-flex items-center justify-center bg-white border-gray-200 border"
                                    onClick={async () => {
                                        await copyToClipboard(inviteUrl)
                                        //const newText = await navigator.clipboard.readText()
                                        //console.log("The copied text: ", newText)
                                    }}
                                >
                                        

                                    {
                                        linkIsCopied ? 


                                            

                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                                            </svg>

                                            :

                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                            </svg>


                                    }




                                    </button>

                            </div>
                       
                        </div>

                        <hr></hr>

                        {/*online friends to invite*/}
                        {/*loop through the online friends and display them*/}
                        <div className="px-5">

                            <p className="font-semibold mb-2">Invite online friends:</p>

                            {
                                onlineFriends.length > 0 ?

                                    //onlineFriends scrollable container
                                    <div className="border rounded-md max-h-48 overflow-auto">
                                        {

                                   

                                            onlineFriends.map((friend, index, friendArray) =>


                                                <div key={index} className={`flex w-full p-2 justify-between items-center ${index != friendArray.length - 1 && "border-b"}`}>


                                                    {/*Profile name and picture*/}

                                                    <div className="flex items-center gap-2">

                                                        <Avatar
                                                            avatar={friend.profilePicturePath}
                                                            size={50}

                                                        />

                                                        <p className="font-semibold flex items-center">
                                                            {friend.username}
                                                            <span className="inline-block ml-1 bg-green-400 rounded-full size-3 animate-pulse mt-1"></span>
                                                        </p>

                                                    </div>

                                                    {/*Invite button */}

                                                    <div>

                                                        {
                                                            invitesSent.hasOwnProperty(friend.userId) ?
                                                                <button
                                                                    disabled={true}
                                                                    aria-disabled={true}
                                                                    type="button"
                                                                    className="py-2.5 px-5 opacity-60 bg-green-500 text-white text-sm rounded-md duration-200"
                                                                >
                                                                    Invite Sent
                                                                </button>
                                                                :
                                                                <button
                                                                    onClick={() => setReceiverUserId(friend.userId)}
                                                                    type="button"
                                                                    className="py-2.5 px-5 bg-green-500 text-white text-sm rounded-md duration-200 hover:bg-green-600"
                                                                >
                                                                    Invite
                                                                </button>

                                                        }

                                                    </div>

                                    

                                                </div>
                                                )



                                        }



                                    </div>
                                    :

                                    <div className="flex justify-center border-t pt-2">

                                        <p className="font-semibold">No friends are online</p>

                                    </div>


                            }


                        </div>

                       

                </div>

                {/*Modal container Wrapper end*/}
                </div>


            </div>

        </>

    )
}

export default PlayerInvitesModal