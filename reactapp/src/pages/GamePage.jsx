import { useState, useEffect } from 'react'

import { useAuth0 } from "@auth0/auth0-react";


import Game from '../components/game/Game';
import RoomFinder from '../components/game/RoomFinder';


import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import NavBarMain from '../components/navigation/NavBarMain';
import PageLayout from "../components/PageLayout.jsx"

import { useLocation } from 'react-router-dom'
import PrivateGameLoading from '../components/game/PrivateGameLoading';

const GamePage = ({ isPrivateGame = false,
    parentConnection,
    gameRoom,
    user,

    // * Parent private game states
    privateRoomId = null,
    privateGameFound = null,
    newPrivateGame = null,
    setNewPrivateGame = null,

    // * Parent private game INVITE states
    onlineFriends,
    invitesSent,
    invitesReceived,

    // * Parent friend request states
    friendRequests,
    updateFriendRequest

    }) => {


    // React router location to access state variables from the previous link
    //const location = useLocation()

    //const { user, getAccessTokenSilently } = useAuth0()

    const [connection, setConnection] = useState(null);

    //const [gameRoom, setGameRoom] = useState();

    const [currUsername, setCurrUsername] = useState();

    const [currUserId, setCurrUserId] = useState()

    const [profileImg, setProfileImg] = useState();

    // Condition that determines whether the user wants to 
    // immedietaly find a game upon rendering this component (navigating to this link)
    const [matchmaking, setMatchmaking] = useState(false)

    // * Determines whether the game that the user is in is running or not. 
    // * If the game is running, any invites and friend requests received won't show an alert.
    //const [inGame, setInGame] = useState(false)

    const [privateGame, setPrivateGame] = useState(false)

    const [privateGameJoining, setPrivateGameJoining] = useState(false)

    const [hostLeft, setHostLeft] = useState(false)

    //const [activeGames, setActiveGames] = useState([])


    useEffect(() => {

        setCurrUsername(user.username)
        setProfileImg(user.picture_url)

        setCurrUserId(user.sub)

        
        setConnection(parentConnection)
        

        // TODO: CREATE A FUNCTION TO ACQUIRE THE CURRENT RUNNING GAMES

        //const initConnection = async () => {

        //    setMatchmaking(true)

        //}

        //initConnection()

        if (isPrivateGame) {

            console.log("Starting the private game...")

            setPrivateGame(isPrivateGame)

            // * If there is a private room id, then the user is trying to join a private game
            if (privateRoomId) {

                setPrivateGameJoining(true)

            }

        }
        else {
            
            setMatchmaking(true)

        }


        

        return () => {

            console.log("Cleanup function")
            //setCurrUsername("")
            //setProfileImg("")

            if (connection) {
                connection.stop()
                //setConnection()
            }

            setMatchmaking(false)

            setPrivateGame(false)

        }


    }, [])

    useEffect(() => {



        if (matchmaking && !privateGame) {

            const executeFindRoom = async () => {
                await findRoom(parentConnection)
            }

            executeFindRoom()

        }


    }, [matchmaking])

    useEffect(() => {

        

        if (privateGame) {

            // ** execute a function that creates a private game.

            if (!privateRoomId) {
                //* If its a private game and there is no roomId, then create a private game

                console.log("Private test: creating a private room")
                createPrivateRoom()

            }
            else {
                // * if there is a roomID, the user is joining a private game
                // * invoke a method to pass that roomId and acquire a gameRoom.

                console.log("Private test: Joining a private room")
                joinPrivateRoom(privateRoomId)

            }



        }

    }, [privateGame])

    useEffect(() => {


        // ? If the game is private, this always checks to see if the
        // ? host has left or not. If the host as left, the game must be ended
        // ? and the other users must be forced to leave.
        if (isPrivateGame) {

            
            if (gameRoom) {

                const hostUsername = gameRoom.privateGameHostUsername

                // If the host username is not shown in the connected users
                // then they have left the game
                if (!gameRoom.users[hostUsername]) {
                    setHostLeft(true)
                }
            }

        }

    }, [gameRoom])


    // * Effect for the state that determines whether the private roomId is a valid private game or not
    useEffect(() => {

        console.log("Private test: Was a private game found")

        if (privateGameFound != null) {

            

            if (privateGameFound) {
                // * if the user can't join, display the modal that notifies the user and sends them
                // * to the home screen

                console.log("Private test: A PRIVATE GAME HAS BEEN FOUND")
                setPrivateGameJoining(false)

            }

        }

    }, [privateGameFound])

    useEffect(() => {

        // Ivoke the method to remove the from the server on the view of the receiver

        //parentConnection.invoke("Update")

    }, [privateGameJoining])

    const startMatchmaking = () => {


        if (!matchmaking && !privateGame) {
            setMatchmaking(true)
        }
    }

    //const joinRoom = async (roomName) => {

    //    //Creates a connection 

    //    try {

    //        const username = user.username;
    //        const userId = user.sub;

    //        const currConnection = !connection ? await createConnection() : connection

    //        console.log("Starting connection...")



    //        // 3. Start the connection
    //        //await currConnection.start().catch(err => console.error(err))


    //        //console.log("Connection started...")
    //        // 4. Invoke the method in C# (server), "JoinRoom()"
    //        //      - Pass the "user" and "roomName" to the method
    //        await currConnection.invoke("JoinRoom", { username, userId, currProfileImg })

    //        setCurrUsername(username)

    //        setInGame(true)


    //    } catch (e) {
    //        console.log(e)
    //    }


    //}

    //const createRoom = async (roomName) => {

    //    const username = user.username;
    //    const userId = user.sub;

    //    const color = user.preferred_color

    //    const averageWpm = user.stats ? user.stats.averageWpm : null

    //    console.log("FROM CREATROOM: ", username)

    //    const currConnection = !connection ? await createConnection() : connection

    //    // Start a connection
    //    //await currConnection.start().catch(err => console.error(err))


    //    await currConnection.invoke("CreateRoom", { username, roomName, userId, currProfileImg, color, averageWpm })


    //    setCurrUsername(username)
    //    setInGame(true)
    //}

    const findRoom = async (initialConnection) => {
        /**
         * A function for matchmaking: Finds a game for the user to join.
         * 
         * - initialConnection - The connection created when the component is first rendered
         */

        const userId = user.sub;
        

        //await currConnection.invoke("FindRoom", { username, userId, color, currProfileImg, averageWpm })
        await parentConnection.invoke("FindRoom", { userId })


        setMatchmaking(false)
        
    }

    const createPrivateRoom = async () => {

        console.log("Test: THe connection being used in Private Room", parentConnection)

        if (parentConnection) {

            console.log("Test: Invoking CreatePrivateRoom on the server")
            await parentConnection.invoke("CreatePrivateRoom")

            //setInGame(true)

        }
    }

    const joinPrivateRoom = async (roomId) => {

        if (parentConnection) {

            console.log("Test: Ivoking JoinPrivateRoom on the server...")
            await parentConnection.invoke("JoinPrivateRoom", roomId)



        }

    }

    const leaveRoom = async () => {
        /**
            * WHat needs to be done when a user leaves a game
            * - DON'T stop the connection. They'll need to see other games available
            * - Call a function that does the following
            *      - Remove the user from the game room.
            *          - Before this, check if game has started or not. 
            *              a. if not, simply remove from the game, re send the gameroom
            *              b. if yes, mark as DNF
            */

        try {


            //await connection.stop()

            await connection.invoke("LeaveRoom")

            setMatchmaking(false)


        }
        catch (e) {
            console.log(e)
        }
    }


    return (
        <PageLayout
            friendRequests={friendRequests}
            updateFriendRequest={updateFriendRequest}
            invitesReceived={invitesReceived}
        >

            {
                
                isPrivateGame && privateGameJoining ?

                    //* If the game is private and the user is joining a private game, 
                    //* this laoding component will be displayed
                    <PrivateGameLoading />
                    :
                    <Game
                        gameRoom={gameRoom}

                        currUsername={currUsername}
                        currUserId={currUserId}

                        currProfileImg={profileImg}

                        startMatchmaking={startMatchmaking}

                        invitesSent={invitesSent}

                        connection={connection}

                        isPrivateGame={isPrivateGame}
                        onlineFriends={onlineFriends}

                        newPrivateGame={newPrivateGame}
                        setNewPrivateGame={setNewPrivateGame}
                        

                    />
                    
            }

            
            {/*private game not found modal*/}
            {
                // * Display the game not found modal here
                isPrivateGame && privateGameFound != null &&
                <>

                    {

                        !privateGameFound && !hostLeft &&
                        <>

                            <div id="static-modal" tabindex="-1" aria-hidden="true"
                                class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
                                style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                            >
                                <div class="relative p-4 w-full max-w-2xl max-h-full">
                                    {/*<!-- Modal content -->*/}
                                    <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                                        {/*<!-- Modal header -->*/}
                                        <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                                Unable to join game
                                            </h3>
                                        </div>
                                        {/*<!-- Modal body -->*/}
                                        <div class="p-4 md:p-5 space-y-4">
                                            <p class="text-base leading-relaxed text-gray-500">
                                                The private game that you are trying to join is not available or does not exist.
                                            </p>

                                        </div>
                                        {/*<!-- Modal footer -->*/}
                                        <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                                            <a href="/">
                                                <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Home page</button>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </>

                    }

                </>


               
            }


            {/*Modal that notifies players that the host has left the private game*/}
            {
                isPrivateGame && hostLeft &&
                <>

                    <div tabindex="-1" aria-hidden="true"
                        class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
                        style={{
                            backgroundColor: "rgba(0,0,0,0.3)",
                            
                        }}
                    >
                        <div class="absolute p-4 w-full max-w-2xl max-h-full"
                            style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)"
                            }}
                        >
                            {/*<!-- Modal content -->*/}
                            <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                                {/*<!-- Modal header -->*/}
                                <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                        The host has left
                                    </h3>
                                </div>
                                {/*<!-- Modal body -->*/}
                                <div class="p-4 md:p-5 space-y-4">
                                    <p class="text-base leading-relaxed text-gray-500">
                                        This game will be disbanded because the host has left the game.
                                    </p>

                                </div>
                                {/*<!-- Modal footer -->*/}
                                <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                                    <a href="/">
                                        <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Home page</button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                </>
            }

            

        </PageLayout>
    )
}

export default GamePage
