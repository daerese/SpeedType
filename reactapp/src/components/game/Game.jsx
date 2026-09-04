import { useState, useEffect } from 'react'

import Typer from './Typer'
import Progress from './Progress'
import Timer from './Timer'

//import NavBarMain from '../navigation/NavBarMain'

import PreviewImg from '../../assets/default-profile-picture.png'
import PlayerInvitesModal from './privateGame/PlayerInvitesModal'

import { updateUserMetadata, getUser } from '../../services/user.service'

//import { players as playerData } from '../../data/players.json'

const Game = ({ gameRoom,
    currUsername,
    currUserId,
    startMatchmaking,
    connection,
    previewMode,
    isPrivateGame,
    currProfileImg,

    // * The parent state of inGame will be set to true while the the game is running. False if otherwise

    newPrivateGame,
    setNewPrivateGame,
    onlineFriends,
    invitesSent }) => {

    // * Previe mode and Practice Mode states
    // ? Determines whether the game component will be in preview or practice
    //const [isPreviewMode, setIsPreviewMode] = useState(previewMode ? previewMode : false)
    const [isPreviewMode, setIsPreviewMode] = useState(false)

    const [clientTimeInterval, setClientTimeInterval] = useState(null)

    //* a preview mode state for the user
    const [previewUser, setPreviewUser] = useState("")
    const [previewUserObj, setPreviewUserObj] = useState({})

    const [players, setPlayers] = useState([])


    const [paragraph, setParagraph] = useState("")

    // ? This state will help with the WPM calculation that runs at a time interval
    // ? This refers to the number characters typed so far that are correct
    const [charProgress, setCharProgress] = useState(0)

    // * Overall Game States 
    const [time, setTime] = useState(0)
    const [timePassed, setTimePassed] = useState(0)

    const [preGameTime, setPreGameTime] = useState(0)

    const [running, setRunning] = useState(false)
    const [gameOver, setGameOver] = useState(false)


    // * Individual player states
    const [finished, setFinished] = useState(false)

    // * For cacluating accuracy
    const [charsTyped, setCharsTyped] = useState(0)
    const [incorrectChars, setIncorrectChars] = useState(0)

    // * Player invites modal
    const [showInvitesModal, setShowInvitesModal] = useState(false)


    console.log("CURRENT USER: ", currUsername)


    console.log(gameRoom)


    /****************************
     * Preview mode effects and methods
     *********************************/

    useEffect(() => {
        if (previewMode) {

            if (!isPreviewMode) {
                setIsPreviewMode(previewMode)
            }
        }
        //else if (isPrivateGame) {

        //    if (!isPrivate) {
        //        setIsPrivate(true)
        //    }
        //}

    }, [])

    useEffect(() => {


        // 1. Set the paragraph

        if (isPreviewMode) {
            setParagraph("Welcome to SpeedType. Can you type fast? Well let's put that to the test. If you want to test your speed against others, please login or create an account.")

            setTime(90)

            setPreviewUser("Random Player")

            const newUserObj = {
                username: "Random Player",
                color: "#1A8FDD",
                profileImg: PreviewImg,
                progress: 0,
                wpm: 0,
                finished: false 
            }
            
            setPreviewUserObj(newUserObj)

            setPlayers([newUserObj])

        }


    }, [isPreviewMode])

    useEffect(() => {

        // * set a time interval, and startPreviewGame calculating wpm



        let interval = null

        if (isPreviewMode && running) {

            interval = setInterval(() => {
                updateTime()
            }, 1000)


            setClientTimeInterval(interval)
        }

        if (running) {

        }

        return () => clearInterval(interval)

    }, [running])

    useEffect(() => {

        // * Check progress and see if finished needs to be set or not
        if (Object.keys(previewUserObj).length > 0) {
            if (previewUserObj.progress >= 1) {
                setFinished(true)
                setGameOver(true)
                setRunning(false)


                if (clientTimeInterval) {
                    clearInterval(clientTimeInterval)
                }
            }
        }

    }, [previewUserObj])

    // ******************
    // * useEffects
    // TODO: Figure out how to send updates to player's stats/progress to the server
    // TODO: Also, figure out a way to update all players progress/stats on the frontend.
    // ? Each progress bar, even the individual player's bar, will update via the server.

    // * SIDE EFFECT: Setting the states of things on the initial render of this component
    
    // * SIDE EFFECT: gameRoom --> Each time a new player joins the room
    useEffect(() => {

        if (gameRoom) {

     

            if (!gameRoom.running) {

                setParagraph(gameRoom.paragraph)

                

            }


            // IF the game is running, set/update the necessary game states
            // * Setting the Overall game states
            setPlayers(gameRoom.users)

            setRunning(gameRoom.running)
            setGameOver(gameRoom.gameOver)

            setTime(gameRoom.time.currentTime)
            setTimePassed(gameRoom.time.timePassed)


            if (gameRoom.isPreGame) {

                setPreGameTime(gameRoom.preGameTimer.currentTime)
            }

            // * Setting states for individual players/clients

            //const currUserFinished = gameRoom.users[currUsername].finished

            if (currUsername) {
                setFinished(gameRoom.users[currUsername].finished)
            }


        }

    }, [gameRoom])

    useEffect(() => {

        if (newPrivateGame) {

            reset()
            setNewPrivateGame(false)

        }

    }, [newPrivateGame])

    

    useEffect(() => {

        //console.log("Time useEffect")

        if (running && !finished && !gameOver) {

            //console.log("Time useEffect --> Updating WPM")

            const elapsedTime = timePassed / 60

            const wpm = Math.floor((charProgress / 5) / elapsedTime)

            console.log(`charProgress (0): ${charProgress}\n new wpm: ${wpm}`)

            updateWpm(wpm)



        }

        if (isPreviewMode) {
            if (time <= 0) {


                if (clientTimeInterval) {
                    clearInterval(clientTimeInterval)
                }

                setRunning(false)
                setGameOver(true)

            }
        }

    }, [time])


    // *******************
    // * UTILITY FUNCTIONS - Updating Game State
    //*************************** */
    const updateProgress = async (newProgress) => {
        // TODO: Send Progress to server:

        //console.log("CURRENT PROGRESS: ", progress)

        await updateAccuracy()


        !isPreviewMode ? 
            await connection.invoke("UpdateProgress", newProgress, gameRoom.roomId)
            :
            setPreviewUserObj(prevObj => {

                return {
                    ...prevObj,
                    progress: newProgress
                }
            })


    }

    const updateWpm = async (newWpm) => {

        console.log("Test updateWpm")
        console.log("Testing Current WPM: ", newWpm)

        if (isPreviewMode) {
            console.log("preview mode is active for some reason")
            setPreviewUserObj(prevObj => {
            
                return {
                    ...prevObj,
                    wpm: newWpm
                }

            })

            return
        }

        
        await connection.invoke("UpdateWpm", newWpm, gameRoom.roomId)
    }

    const updateAccuracy = async () => {


        const correctChars = charsTyped - incorrectChars

        const newAccuracy = Math.round((correctChars / charsTyped) * 100)


        if (!isPreviewMode) {
            await connection.invoke("UpdateAccuracy", newAccuracy, gameRoom.roomId)
        }
    }

    const updateTime = async (time) => {

        //await connection.invoke("UpdateTime", time, gameRoom.roomId)
        setTime(prevTime => prevTime - 1)
        setTimePassed(prevTime => prevTime + 1)
    }

    const updateCharProgress = (correctChars) => {
         
        setCharProgress(correctChars)
    }

    // Accuracy updates
    const incrementCharsTyped = () => {

        setCharsTyped(charsTyped + 1)

        //setCharsTyped(prev => prev + 1)
    }

    const incrementIncorrectChars = () => {

        setIncorrectChars(incorrectChars + 1)
        //setIncorrectChars(prev => prev + 1)

    }

    const reset = () => {

        setCharProgress(0)
        setCharsTyped(0)
        setIncorrectChars(0)
        setParagraph("")


    }

    // *******************
    // * UTILITY FUNCTIONS - Starting/Ending the game
    //*************************** */

    const startPreviewGame = async () => {


        //await connection.invoke("StartGameTimer", gameRoom.roomId)

        if (isPreviewMode) {
            // TODO: Set the state that starts the game.
            setRunning(true)
        }
        else {
            await connection.invoke("StartGame", gameRoom.roomId, null);
        }

    }

    const startPrivateGame = async (restartGame = false) => {

        if (gameRoom) {

            const roomId = gameRoom.roomId

            // * Reset the states that assist with calculating WPM, then restart the game
            if (restartGame) {

                
                //reset()
                

                await connection.invoke("RestartPrivateGame", roomId)

            } else {

                console.log("Private test: HOST IS STARTING THE PRIVATE GAME")

                await connection.invoke("StartPreGame", roomId)

            }

        }



    }

    const findNewGame = () => {
        /**
         * Resets the in-game states and starts matchmaking to find a new game
         * - charProgress
         * - charsTyped
         * - incorrectChars
         */

        setCharProgress(0)
        setCharsTyped(0)
        setIncorrectChars(0)
        setParagraph("")

        startMatchmaking()

    }

    return (
        <>

            <main className={`relative ${isPreviewMode && "p-3 rounded-xl"}`}
                style={{ backgroundColor: `${isPreviewMode ? "rgba(244, 244, 244, .8)" : ""}`}}>

                

                {
                    !isPreviewMode ? 
                    <Timer
                        isMainTimer={true}
                        time={time}
                        running={running}
                        gameOver={gameOver}
                        />
                        :
                    <p className="text-center text-xl">Game Preview</p>
                }

                <Progress
                    
                    playerObjects={players}

                    currUser={currUsername || previewUser}
                    isPrivateGame={isPrivateGame}

                    isPreviewMode={isPreviewMode}
                    previewPlayerObject={previewUserObj}

                    running={running}
                    gameOver={gameOver}

                    setShowInvitesModal={setShowInvitesModal}

                    privateGameHost={gameRoom ? gameRoom.privateGameHostUsername : null}

                />

                <Typer
                    paragraphState={paragraph}

                    finished={finished}
                    
                    running={running}

                    updateProgress={updateProgress}
                    updateCorrectChars={updateCharProgress}

                    incrementCharsTyped={incrementCharsTyped}
                    incrementIncorrectChars={incrementIncorrectChars}
                />

                {/*Preview mode start button*/}
                {
                    isPreviewMode &&
                    <div className="flex items-center">
                        <button
                                disabled={running || gameOver}
                                onClick={startPreviewGame}
                                className="text-white bg-blue-700 hover:bg-blue-800 disabled:hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 focus:outline-none disabled:opacity-70"
                        >Start Preview</button>

                        <Timer
                                time={time}
                                running={running}
                                gameOver={gameOver}
                                classString="font-semibold text-lg"
                            />
                    
                    </div>
                }


                {/*Container for the leave game/find a new game/start game buttons*/}
                <div className="flex justify-between">

                    {/*Leave game button that is present in both private and public games*/}
                    {
                        !previewMode &&
                        <a href="/" className="inline-block text-white duration-200 bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            Leave game
                        </a>

                    }
  

                    {/*Find new game button that appears at the end of a public game*/}
                    {

                        gameRoom && 
                        <>
                            {/*If its a private game, and this client is the host, the start game button should be displayed*/}
                            {/*If not a private game, then display the find new game button*/}
                            
                            {
                                isPrivateGame ? 
                                    <>

                                        {

                                            gameRoom.privateGameHostUsername === currUsername &&
                                            <>

                                                {/*If the game has started and is over display the restart button.*/}
                                                {
                                                    gameRoom.gameOver ? 
                                                    <button className="inline-block cursor-pointer text-white bg-sky-500 hover:bg-sky-600 font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:ring-sky-300"
                                                        onClick={() => startPrivateGame(true)}
                                                        >Restart Game</button>
                                                        :
                                                        <button className="inline-block cursor-pointer text-white bg-sky-500 hover:bg-sky-600 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-50 disabled:hover:bg-sky-500 disabled:hover:cursor-default  focus:ring-4 focus:ring-sky-300"
                                                            onClick={startPrivateGame}
                                                            disabled={gameRoom.running || gameRoom.isPreGame}
                                                        >Start Game</button>
                                                }

                                                
                                            
                                                
                                            
                                            </>

                                        }

                                    </>
                                    :
                                    <>
                                        {
                                            gameRoom.gameOver || finished ?
                                
                                                <button className="inline-block cursor-pointer ml-4 text-white bg-sky-500 hover:bg-sky-600 font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:ring-sky-300"
                                                    onClick={findNewGame}>Find a new game</button>

                                                :

                                                <></>

                                        }
                                    </>

                            }
                        </>
                    
                    }
                    

                </div>

                

                {/*Display message at the top that shows the state of the game. Directly in front of the timer*/}
                {

                    
                    gameRoom && !gameRoom.running && !gameRoom.gameOver &&
                    <>
                        <div className="absolute bg-white top-0 left-1/2 flex items-center gap-2"
                            style={{transform: "translateX(-50%)"}}>

                                {
                                    gameRoom.isPreGame ? 
                                    <p className="text-2xl">
                                        Starting in <span className="font-semibold">{preGameTime}</span>
                                    </p>
                                    :
                                    <>
                                        <div className="w-4 h-4 bg-black rounded-full bg-sky-300 animate-pulse"></div>

                                        {
                                            isPrivateGame ? 
                                                <p className="text-2xl">Waiting for the host to start...</p>
                                                :
                                                <p className="text-2xl">Waiting for players to join...</p>
                                        }
                                        
                                        
                                    </>
                                    
                                }
                        </div>
                    </>
                }


                {/*Modal for inviting online friends. Only available to the host*/}

                {
                    
                    isPrivateGame && gameRoom &&
                    <>

                        {
                            gameRoom.privateGameHostUsername === currUsername &&
                            <PlayerInvitesModal
                                showModal={showInvitesModal}
                                setShowModal={setShowInvitesModal}
                                inviteUrl={`https://localhost:5173/game/private/${gameRoom.roomId}`}
                                onlineFriends={onlineFriends}

                                connection={connection}

                                invitesSent={invitesSent}

                                roomId={gameRoom.roomId}
                                currUsername={currUsername}
                                currUserId={currUserId}
                                currProfileImg={currProfileImg}
                            />
                        }

                    </>
                }



                {/*invite url for testing purposes*/}
                {
                    isPrivateGame && gameRoom ? 
                        <p>https://localhost:5173/game/private/{gameRoom.roomId}</p>
                        :
                        <></>
                    

                }

                

            </main>
        </>
    )
}

export default Game