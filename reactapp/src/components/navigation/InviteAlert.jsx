

const InviteAlert = ({ showAlert = true, setShowAlert, invite = null }) => {

    

    return (


        showAlert && invite &&
        <>


            <div
                className="absolute bg-gray-100 border-l-4 border-sky-500 shadow-md py-3 px-5 flex gap-4 items-center"
                style={{
                    left: "50%",
                    transform: "translate(-50%)"
                }}
            >

                {/*left side, message and accept/decline buttons*/}
                <div>
                    <p className="mb-1">
                        <span className="font-semibold">{invite.senderUsername}</span> has invited you to a game
                    </p>

                    <div className="flex gap-2">

                            <a href={`game/private/${invite.roomId}`}
                                className="duration-200 rounded-md block bg-green-500 hover:bg-green-600 font-semibold text-white py-1 px-4">Join</a>

                            {/*<button className="rounded-md block bg-red-500 font-semibold text-white py-1 px-4">Decline</button>*/}


                    </div>


                </div>

                {/*right side, close button*/}
                <button type="button" onClick={() => setShowAlert(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>



            </div>

        </>

    )


}

export default InviteAlert