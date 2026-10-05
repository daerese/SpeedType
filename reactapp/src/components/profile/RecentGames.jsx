import { useState, useEffect } from 'react'

import { getGamePlayers } from '../../services/user.service'

import Avatar from './Avatar'


const RecentGames = ({ userRecentGames, userGamesLoading, getAccessToken, currentUsername }) => {

    const [currentGameId, setCurrentGameId] = useState("")

    const [currentResultPlayers, setCurrentResultPlayers] = useState([])

    const [currentResultPlayerCount, setCurrentResultPlayerCount] = useState(0)

    const [currentResultLoading, setCurrentResultLoading] = useState(false)

    const [currentResultError, setCurrentResultError] = useState(false)

    const [showModal, setShowModal] = useState(false)


    const testGameResult = (gameResult) => {

        // 1. The game result modal should be set to loading until the
        //      players information are loaded into the modal

        if (currentGameId != gameResult.gameId) {
            console.log("Game clicked. Result id: ", gameResult.resultId)

            setCurrentGameId(gameResult.gameId)
            setCurrentResultLoading(true)
            setCurrentResultPlayers([])
        }
        setShowModal(true)

    }

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

    useEffect(() => {

        // 1. Call an asynchronous function using the current result id

        // 2. set the currentResultDetails state to an array containing the players
        // that played in that specific game

        // 3. Make sure to order the users by placement (ascending order)

        const getResultDetails = async (gameId) => {

            
            const accessToken = await getAccessToken()

            const players = await getGamePlayers(accessToken, gameId)

            console.log("Players in this game: ", players)

            if (players.data) {

                const playersArray = [...players.data.gamePlayers]

                const playerCount = players.data.gamePlayers.length > 0 ?
                    players.data.gamePlayers[0].playerCount
                    :
                    0

                // ? Accounting for the players that left early because their 
                // ? results are not saved in the database.
                if (playerCount > playersArray.length) {


                    const loopCount = playerCount - playersArray.length

                    for (let i = 0; i < loopCount; i++) {
                        playersArray.push(null)
                    }

                }

                console.log("THE CURRENT PLAYER COUNT: ", playerCount)

                setCurrentResultPlayers(playersArray)

            }

            setCurrentResultLoading(false)
            

        }


        if (currentGameId) {

            getResultDetails(currentGameId)

        }



    }, [currentGameId])


    return (

        <>
            <div className="border text-center p-3 rounded-lg col-span-5 max-[900px]:col-span-full">

                <p className="font-semibold mb-4">Recent games</p>

                <div className="border border-b-black mx-5 mb-4"></div>


                {
                    userGamesLoading ?

                        <div className="animate-pulse space-y-4">
                            <div className="h-5 w-full bg-gray-200 rounded-full"></div>
                            <div className="h-5 w-full bg-gray-200 rounded-full"></div>
                            <div className="h-5 w-full bg-gray-200 rounded-full"></div>
                            <div className="h-5 w-full bg-gray-200 rounded-full"></div>
                            <div className="h-5 w-full bg-gray-200 rounded-full"></div>

                        </div>
                        :
                        <>
                            {

                                userRecentGames.length > 0 ?

                                    <>
                                        <div className="grid grid-cols-4 mb-2">


                                            <p className="font-semibold">WPM</p>
                                            <p className="font-semibold">Accuracy (%)</p>
                                            <p className="font-semibold">Position</p>
                                            <p className="font-semibold">Date</p>


                                        </div>


                                        {
                                            userRecentGames.map((gameResult, index) =>

                                                <div key={index} onClick={() => testGameResult(gameResult)} className="grid grid-cols-4 mb-1 border border-l-black bg-gray-100 py-1 duration-200 cursor-pointer hover:bg-gray-300">
                                                    <p className="font-semibold">{gameResult.wpm}</p>
                                                    <p className="font-semibold">{gameResult.accuracy}</p>
                                                    <p className="font-semibold">{gameResult.position} / {gameResult.playerCount}</p>
                                                    <p className="font-semibold">{gameResult.startDate.split(" ")[0]}</p>

                                                </div>
                                            )

                                        }

                                    </>

                                    :
                                    <p>No recent games</p>


                            }

                        </>

                }



            </div>

            
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
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">

                        {/*Modal header*/}
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h4 className="text-lg font-semibold">
                                Results
                            </h4>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>

                        {/*modal body*/}
                        {
                            !currentResultLoading ?
                            <>
                            
                            
                                <div className="p-4 space-y-4">
                            

                                    {
                                        currentResultPlayers.map((player, index) =>
                                        player ? 

                                                <div key={index} className="">


                                                    {/*Profile name and picture*/}

                                                    <a href={player.username === currentUsername ? "/profile" : `/profile/${player.username}`} className="block flex items-center gap-2 cursor-pointer border p-2 duration-200 hover:bg-gray-200">

                                                        <Avatar
                                                            avatar={player.profilePicturePath}
                                                            size={50}
                                                    
                                                        />

                                                        <p className="font-semibold">
                                                            {player.username}
                                                            <span className="font-normal ml-1">({getStringPlacement(player.position)})</span>
                                                        </p>

                                                    </a>

                                                    {/*results*/}
                                                    <div className="bg-gray-100 grid grid-cols-2 py-4">

                                                        <div className="flex border-r border-r-black px-4 gap-2">

                                                            <p className="font-semibold">WPM: </p>
                                                            <p>{player.wpm}</p>

                                                        </div>

                                                        <div className="flex px-4 gap-2">

                                                            <p className="font-semibold">Accuracy (%): </p>
                                                            <p>{player.accuracy}</p>

                                                        </div>


                                                    </div>

                                                </div>
                                                :

                                                //some container to show that the player left before finishing

                                                <div className="flex items-center gap-2 border p-2">

                                                    <div className="bg-gray-200 rounded-full" style={{width: 40, height: 40}}>

                                                    </div>

                                                    <p className="font-semibold">
                                                        Player did not finish
                                                    </p>

                                                </div>

                                        )
                                    }

                            


                                </div>

                                </>
                                :
                                <>

                                    <div className="p-4 space-y-4 animate-pulse">

                                        <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
                                        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
                                        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                                        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                                        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                                        <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                                        <span className="sr-only">Loading...</span>


                                    </div>

                                </>

                        }
                        {/*modal body (end)*/}
                        
                    </div>
                </div>

                {/*Modal container Wrapper end*/}
            </div>


        
        </>

        
    )
}

export default RecentGames