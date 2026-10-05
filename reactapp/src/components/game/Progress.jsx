import { useState, useEffect, useRef } from 'react'

//import Image from 'react-bootstrap/Image';

import Avatar from "../profile/Avatar"


const Player = ({
    playerObj,
    playerProgress,
    currUser,
    isPlaceholder,
    running,
    gameOver,
    isPrivateGame,
    privateGameHost,
    setShowInvitesModal = null }) => {


    console.log(`Test: currUser === ${currUser} && privateGameHost === ${privateGameHost}`)

    const [username, setUsername] = useState("")

    const [color, setColor] = useState("")

    const [profileImg, setProfileImg] = useState("")

    const [progress, setProgress] = useState(0)

    const [placementString, setPlacementString] = useState("")

    const [placement, setPlacement] = useState(0)

    const playerProgressRef = useRef(null)

    useEffect(() => {

        if (!isPlaceholder) {
            setUsername(playerObj.username)
            setColor(playerObj.color)

            setProfileImg(playerObj.profileImg)

            if (playerObj.finished) {


                if (!placementString) {
                    setPlacementString(
                        getStringPlacement(playerObj.finalResults.position)
                    )
                }

                setPlacement(playerObj.finalResults.position)

            }

        }

        


    }, [playerObj])


    useEffect(() => {

        //if (!isPlaceholder) {
        //    if (playerProgressRef) {
        //        const bgColor = playerProgressRef.current.getAttribute("data-player-color")

        //        console.log(`Player ${playerObj.name} color --> ${bgColor}`)

        //        playerProgressRef.current.style.backgroundColor = bgColor;
        //    }
        //}


    }, [color])


    useEffect(() => {

        if (!isPlaceholder) {

            setProgress(playerProgress * 100)

        }


    }, [playerProgress])


    //console.log("The player object passed to the player component: ", playerObj)

    //utility functions

    const getStringPlacement = (placementValue) => {
        /**
         * Turns the placement number into the correct string
         * Example: if placement is 3, the string will be '3rd'
         * 
         * placement : int -- The placement number
         */

        let result = ""

        switch (placementValue) {

            case 1:
                result = "1st"
                break
            case 2:
                result = "2nd"
                break
            case 3: 
                result = "3rd"
                break
            default: 
                result = `${placementValue}th`
                break

        }

        return result


    }

    const showInvitesModal = () => {

        if (setShowInvitesModal != null) {
            setShowInvitesModal(true)
        }

    }

    return (
        <>

            {
                !isPlaceholder ?
                    <div className='flex align-center mb-4 w-full gap-3 relative'>

                        {/* user icon */}

                        <Avatar
                            avatar={profileImg}
                            color={color}
                            size={60}
                        />


                        {/*container for progress and username*/}
                        <div className="grow">
                         
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2 mt-2"
                                style={{ opacity: `${playerObj.finished ? ".45" : "1"}` }}>
                                <div className={`h-2.5 rounded-full`} style={{
                                    width: `${progress}%`,
                                    
                                    backgroundColor: `${color}`,
                                    //opacity: `${playerObj.finished ? ".45" : "1"}`
                                    
                                }}></div>

                            </div>

                            {/*finished placement container */}

                            {
                               playerObj.finished &&
                                <div
                                    className="h-4 absolute top-0 flex items-center gap-x-2 left-1/2 mt-1"
                                    style={{transform: "translateX(-50%)"}}
                                    >

                                        {
                                            placement == 1 &&
                                            <svg className="w-4 h-4 text-yellow-400 w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                                                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                                            </svg>
                                        }
                                    <p className="p-0 m-0 font-semibold text-lg">{placementString}</p>
                                    <p className="p-0 m-0 font-semibold text-lg opacity-75">{`(${playerObj.finalResults ? playerObj.finalResults.finalWpm : playerObj.wpm} WPM)`}</p>
                                </div>
                            }


                            {/* username */}
                            <div
                                className="flex items-center gap-1.5"
                            >
                                <p className="font-bold m-0 p-0">{username} {currUser === username && "(You)"}</p>

                                <span>&#9679;</span>

                                <p className="m-0 p-0">WPM: {playerObj.wpm}</p>

                            </div>

                        </div>

                    </div>

                    :

                    <div role="status" className={`${running || gameOver ? "opacity-0" : (isPrivateGame ? "" : "animate-pulse")} flex align-center mb-4 w-full gap-3`}>


                        <svg className="w-14 h-14 me-3 text-gray-200 dark:text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                        </svg>

                        {
                            isPrivateGame && currUser === privateGameHost ? 
                                <>
                                    <div className="border w-full">

                                        <button
                                            className="w-full h-full text-left font-semibold"
                                            onClick={showInvitesModal}
                                        >
                                        Invite other players
                                        </button>

                                    </div>

                                </>
                                :
                                <>
                                    <div className="grow flex flex-col align-center justify-items-center">
                                        <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full mb-3 mt-3"></div>
                                        <div className="w-48 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                                    </div>
                                </>
                        }

                    </div>
                  

                    
            }

        </>
    )
}

const Progress = ({ playerObjects, currUser, running, gameOver, isPreviewMode, previewPlayerObject, isPrivateGame, privateGameHost, setShowInvitesModal }) => {


    // TODO: The players progress should come from the server and progress
    // * should be associated with individual players.


    // *******************
    // * UTILITY FUNCTIONS

    const [playerObjectsArray, setPlayerObjectsArray] = useState([])

    //console.log("Player objects PROGRESS Component: ", playerObjects)


    //console.log("Player array: ", playerObjectsArray)

    useEffect(() => {

        fillPlayerObjectsArray()

    }, [playerObjects])

    const fillPlayerObjectsArray = () => {

        const newArr = [...Object.values(playerObjects)]

        if (!isPreviewMode) {
            if (newArr.length < 5) {
                newArr.push(null)
            }
        }

        setPlayerObjectsArray(newArr)

        


    }


    return (
        <>


            <div>
                {/* TODO: Map over the playerObjects array */}


                {
                    !isPreviewMode ? 
                    
                        //Object.values(playerObjects).map((player, index) =>
                        playerObjectsArray.map((player, index) =>
                            player ? 
                                <Player
                                    playerObj={player}
                                    currUser={currUser}
                                    // TODO: Set a boolean: If the name of this player object matches currUsername
                                    //       the set isCurrUser to true.
                                    //IsCurrUser={}
                                    key={index}
                                    playerProgress={player.progress}
                                />  
                                :
                                <Player
                                    isPlaceholder={true}
                                    currUser={currUser}
                                    running={running}
                                    gameOver={gameOver}
                                    key={index}

                                    privateGameHost={privateGameHost}
                                    isPrivateGame={isPrivateGame}
                                    setShowInvitesModal={setShowInvitesModal}
                                /> 
                        )
                        

                        :          

                        <Player
                            playerObj={previewPlayerObject}
                            currUser={currUser}
                            playerProgress={previewPlayerObject.progress}
                        /> 
                }



                

            </div>

            
        </>
    )

}

export default Progress