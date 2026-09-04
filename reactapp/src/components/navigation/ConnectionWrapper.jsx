import { useState, useEffect } from 'react';


//import { BrowserRouter as Router, Route, Link, Routes, createBrowserRouter, createRoutesFromElements } from "react-router-dom"

import { useParams } from 'react-router-dom';

// * Pages
import GamePage from '../../pages/GamePage';
import HomePage from '../../pages/HomePage';
import ProfilePage from '../../pages/ProfilePage';
import GeneralSettings from '../profile/edit-profile/GeneralSettings';
import AuthenticationGuard from './AuthenticationGuard';
import GamePageNotFound from '../../pages/GamePageNotFound';

import LoadingScreen from '../utils/LoadingScreen'

import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import Game from '../game/Game';

import { useAuth0 } from "@auth0/auth0-react";

const ConnectionWrapper = ({ authLoading, user, component, page }) => {

    /**
     * The purpose of this component should be to maintain the connection to the GameHub.
     * 
     * OPTION 1: Wrap it around the Routes in App
     * OPTION 2: (Which might not work) Use it like Authentication Guard
     * 
     */

    const urlParams = useParams()

    const { isAuthenticated, getAccessTokenSilently } = useAuth0()

    const [connectionLoading, setConnectionLoading] = useState(true)

    const [userLoading, setUserLoading] = useState(true)

    const [connection, setConnection] = useState(null)

    const [connectionState, setConnectionState] = useState("")

    // Game room states
    const [gameRoom, setGameRoom] = useState(null)

    // * Friend states
    const [friendsList, setFriendsList] = useState([])

    const [friendRequests, setFriendRequests] = useState([])

    const [onlineFriends, setOnlineFriends] = useState([])

    //const [friendObjects, setFriendObjects] = useState([])

    // The current friend request that user wants to accept or reject
    const [friendRequestUpdating, setFriendRequestUpdating] = useState(null)


    // * Should store an object --> {"privateGameFound": true or false}
    const [privateGameFound, setPrivateGameFound] = useState(null)

    const [newPrivateGame, setNewPrivateGame] = useState(false)

    //const [isProfilePage, setIsProfilePage] = useState(false)

    //const [componentParams, setComponentParams] = useState({})

    // * Private game room invite states
    const [invitesSent, setInvitesSent] = useState({})

    const [invitesReceived, setInvitesReceived] = useState([])

    const [showInviteAlert, setShowInviteAlert] = useState(false)

    //console.log("USER OBJECT: ", user)

    const createConnection = async () => {

        /**********
         * 2026: The purpose of this function is to create a connection to the GameHub 
         * and establish the methods that will be used to send and receive messages 
         * from the server. This is what allows real time communcation with SignalR in the backend.
         */

        try {
            console.log("Creating connection")

            // 1. Create the connection (use the URL of the development port (: )
            const connection = new HubConnectionBuilder()
                .withUrl("https://localhost:7229/game", {

                    // * 2026: The accessTokenFactory is used to get the access token from
                    // * Auth0 and send it to the server (SignalR) for authentication.
                    accessTokenFactory: async () => {
                        return await getAccessTokenSilently({
                            authorizationParams: {
                                audience: "https://localhost:7229"
                            }
                        });
                    },

                    skipNegotiation: true,
                    transport: HttpTransportType.WebSockets
                })
                .configureLogging(LogLevel.Debug)
                .build();

            // 2. Create a method that receives a message from the server.
            connection.on("ReceiveMessage", (message) => {
                console.log(`Message received: ${message}`)

            })

            connection.on("UsersInGame", (users) => {


                console.log("USERS FROM THE SIGNALr METHOD ", users)
                //setUsers(users)

            })

            connection.on("ReceiveGameRoom", (gameRoom) => {

                /**
                 * The real time updates to the game occur here. The server will send the updated 
                 * gameRoom object to the client and the client will update its state.
                 */

                console.log("NEW GAME Room: ", gameRoom)

                setGameRoom(gameRoom)

            })

            connection.on("ReceiveActiveGames", (allActiveGames) => {

                console.log("All active games", allActiveGames)

                //setActiveGames([...allActiveGames])

            })

            // Friends list
            connection.on("ReceiveFriendsList", (newFriendsList) => {

                /**
                 * The initial method that is invoked to fill the friendsList array   
                 */


                console.log("Friends List Received: ", newFriendsList)

                setFriendsList([...newFriendsList])

            })

            connection.on("ReceiveOnlineFriends", (newOnlineFriends) => {

                console.log("Online friends received: ", newOnlineFriends)

                setOnlineFriends([...newOnlineFriends])


            })

            // Friend Requests
            connection.on("ReceiveFriendRequests", (newFriendRequests) => {

                /**
                 * The initial method that is invoked to fill the friendRequests array 
                 */

                console.log("Friend Requests Received: ", newFriendRequests)

                setFriendRequests([...newFriendRequests])

            })

            connection.on("UpdateFriendsList", (newFriend) => {

                console.log("UpdateFriendsList single friend called: ", newFriend)

                setFriendsList(prevList => [newFriend, ...prevList])

            })

            connection.on("UpdateFriendRequests", (newRequest) => {
                /**
                 * This method is for receiving/sending a new friend request and updating
                 * the front end of both the sender and receiver
                 */

                console.log("UpdateFriendsRequests single request called: ", newRequest)

                setFriendRequests(prevRequests => [newRequest, ...prevRequests])

                //setComponentParams(prev => {
                //    return {
                //        ...prev,

                //    }

                //})

            })

            /******
             * Private Game updates
             ************/
            connection.on("PrivateGameFound", (status) => {

                console.log("The status of the private game you're trying to join: ", status)

                setPrivateGameFound(status)

            })

            connection.on("PrivateGameRestarting", () => {

                console.log("The server wants to restart the private game...")

                setNewPrivateGame(true)

            })



            connection.onclose(e => {
                setConnection()
                setGameRoom()
                //setCurrUser()
            })

            /*****
             * Private game invites
             */

            connection.on("GetInvitesSent", (invitesSentDict) => {
                /**
                 * Receives a dictionary 
                 */

                console.log("New inviteSent added: ", invitesSentDict)

                setInvitesSent(invitesSentDict)


            })

            connection.on("GetInvitesReceived", (invitesReceivedList) => {

                console.log("You received a new invite. New invites list: ", invitesReceivedList)

                setInvitesReceived(invitesReceivedList)

                setShowInviteAlert(true)

            })

            connection.on("InitInvitesReceived", (invitesReceivedList) => {

                // * Display the invites without showing an alert

                console.log("InitInvitesReceived triggered. Showing alert", invitesReceivedList)

                setInvitesReceived(invitesReceivedList)

                

            })

            return connection
        }
        catch (e) {
            console.log(e)
        }

    }

    const startConection = async () => {

        /**
         * The purpose of this function is to start the connection to the GameHub and 
         * invoke the InitConnection method on the server.
         */

        if (connection) {

            if (connection.state === "Disconnected") {

                //await connection.start().catch(err => console.error(err))

                //await connection.invoke("InitConnection", { userId })

                /**
                 * 2026 Modified startConnection: With this change, if the connection
                 * fails, it won't try to call InitConnection on a disconnected connection.
                 */
                try {
                    const userId = user.sub

                    console.log("disconnected, STARTING THE CONNECTION")

                    await connection.start();

                    await connection.invoke("InitConnection", { userId });

                    setConnectionState(connection.state);
                }
                catch (err) {
                    console.error("SignalR connection failed:", err);
                }

            }


        }

    }

    const updateFriendRequest = async (friendRequestObject) => {

        /**
         * The purpose of this function is to update the status of a friend request. 
         * It will be called when the user accepts or rejects a friend request.
         */

        const friendRequestId = friendRequestObject.requestId
        const fromUserId = friendRequestObject.fromUserId
        const toUserId = friendRequestObject.toUserId
        const accepted = friendRequestObject.accepted



        await connection.invoke("UpdateFriendRequestStatus", friendRequestId, fromUserId, toUserId, accepted)

        setFriendRequestUpdating(null)


    }

    const initUpdateFriendRequest = (friendRequestObject, accepted) => {

        friendRequestObject.accepted = accepted

        setFriendRequestUpdating({ ...friendRequestObject })

    }

    const getOnlineFriends = async () => {

        // 1. Loop through the friendsList and acqurie the user ids

        // 2. store them in an array.

        // 3. Use the connection to send it to the hub method GetOnlineFriends

        // 4. Wait for the hub to update the state of onlineFriends


        if (friendsList.length > 0) {

            console.log("Online: Friends list is greater than 0")

            const userId = user.sub

            const friendUserIds = []

            for (let friend of friendsList) {

                // ? The userId that isn't equal to the current user is the friend's userId
                if (friend.userId1 !== userId) {
                    friendUserIds.push(friend.userId1)
                }
                else {
                    friendUserIds.push(friend.userId2)
                }

            }

            await connection.invoke("GetOnlineFriends", friendUserIds)

        }

    }

    //const initConnection = async (customServerListener = "", customClientFunction = null, initialConnection=null) => {
    const initConnection = async (initialConnection = null) => {

        /**
         * The purpose of this function is to initialize the connection to the GameHub.
         *
         */
        if (!connection) {


            // ? If on the profile page, the profile page should have its own connection instance,
            // ? with custom events for that page/component
            const newConnection = initialConnection ? initialConnection : await createConnection()

            //if (customServerListener && customClientFunction) {


            //    // ? If there is another listener event that needs to be added to the connection,
            //    // ? It will be added on to the current connection here.
            //    newConnection.on(customServerListener, (serverResponse) => {

            //        customClientFunction(serverResponse)

            //    })

            //}

            console.log(" THE CONNECTION BEING CREATED: ", newConnection)

            if (initialConnection) {
                console.log("THe profile connection passed to the wrapper: ", newConnection)
                console.log("The state of connection passed to the wrapper: ", newConnection.state)
            }

            setConnection(newConnection)
            setConnectionState(newConnection.state)

        }
    }

    useEffect(() => {

        if (friendRequestUpdating) {
            updateFriendRequest(friendRequestUpdating)
        }

    }, [friendRequestUpdating])

    useEffect(() => {

        /**
         * This useEffect will use the friends list find out 
         * which friends are online.
         */

        getOnlineFriends()

    }, [friendsList])


    // 1. Wait for auth0 to load the user
    useEffect(() => {

        if (authLoading) {


            if (!userLoading) {
                setUserLoading(true)

            }

        }

        else {

            if (userLoading) {
                setUserLoading(false)

            }

        }


    }, [authLoading])

    // 2. After the user is loaded, we can than start the connection
    useEffect(() => {

        

        // Auth0 is done loading

        if (isAuthenticated) {

            if (!userLoading) {
                if (!connection) {

                    initConnection()
                    //if (!connectionStarting) {
                    //    setConnectionStarting(true)
                    //}

                }
            }

        }
        else {
            setConnectionLoading(false)
        }

    }, [userLoading])


    useEffect(() => {



        
        
        console.log(" the connection: ", connection)

        if (connection) {

            if (connection.state === "Disconnected") {

                startConection()
            }

        }

    }, [connection])

    useEffect(() => {

        if (connectionState === "Disconnected") {

            if (!connectionLoading) {
                setConnectionLoading(true)
            }

        }
        else if (connectionState === "Connected") {

            if (connectionLoading) {
                setConnectionLoading(false)
            }

        }

    }, [connectionState])

    return (

        <>

            {
                //userLoading || connectionLoading ?
                //    <div>Loading...</div>
                //    :
                //    <Router>
                //        <Routes>
                //            <Route exact path="/" element={<HomePage friendRequests={friendRequests} updateFriendRequest={initUpdateFriendRequest} />} />
                //            <Route exact path="/game" element={<GamePage parentConnection={connection} gameRoom={gameRoom} user={user} />} />
                //            <Route
                //                exact path="/profile"
                //                element={<AuthenticationGuard
                //                    component={ProfilePage}
                //                    componentParams={{
                //                        page: "profile",
                //                        props: {
                //                            isPublic: false,
                //                            connection: connection,
                //                            friendsList: friendsList,
                //                            //setIsProfilePage: setIsProfilePage,
                //                            //friendObjects: friendObjects,
                //                            //connectionStarting: connectionStarting,
                //                            //initConnection: initConnection,
                //                            friendRequests: friendRequests,
                //                            updateFriendRequest: initUpdateFriendRequest

                //                        }
                //                    }}

                //                />}
                //            />
                //            <Route
                //                exact path="/profile/:username"
                //                element={
                //                    <AuthenticationGuard
                //                        component={ProfilePage}
                //                        componentParams={{
                //                            page: "profilePublic",
                //                            props: {
                //                                isPublic: true,
                //                                connection: connection,
                //                                friendsList: friendsList,
                //                                friendRequests: friendRequests,
                //                                updateFriendRequest: initUpdateFriendRequest
                //                                //sendFriendRequest: initFriendRequest
                //                            }
                //                        }}
                //                    />
                //                }
                //            />
                //            <Route
                //                exact path="/account/general"
                //                element={<AuthenticationGuard component={GeneralSettings} />}
                //            />
                //            {/*<Route*/}
                //            {/*    exact path="/account"*/}
                //            {/*    element={<AuthenticationGuard component={AccountSettings} />}*/}
                //            {/*/>*/}

                //        </Routes>
                //    </Router>


                userLoading || connectionLoading ?
                    <LoadingScreen />
                    :
                    (() => {

                        switch (page) {
                            case "home":
                                return <HomePage
                                    friendRequests={friendRequests}
                                    updateFriendRequest={initUpdateFriendRequest}

                                    invitesReceived={invitesReceived}

                                    showInviteAlert={showInviteAlert}
                                    setShowInviteAlert={setShowInviteAlert}
                                />
                            case "game":
                                return <GamePage
                                    parentConnection={connection}
                                    gameRoom={gameRoom}
                                    user={user}

                                    friendRequests={friendRequests}
                                    updateFriendRequest={updateFriendRequest}

                                    invitesReceived={invitesReceived}
                                />
                            case "gamePrivate":
                                return <GamePage
                                    parentConnection={connection}
                                    gameRoom={gameRoom}
                                    user={user}

                                    invitesReceived={invitesReceived}

                                    invitesSent={invitesSent}
                                    onlineFriends={onlineFriends}

                                    isPrivateGame={true}
                                    newPrivateGame={newPrivateGame}
                                    setNewPrivateGame={setNewPrivateGame}

                                    friendRequests={friendRequests}
                                    updateFriendRequest={updateFriendRequest}



                                />

                            case "gamePrivateJoin":
                                return <GamePage
                                    parentConnection={connection}
                                    gameRoom={gameRoom}
                                    user={user}

                                    isPrivateGame={true}
                                    privateRoomId={urlParams.roomId ? urlParams.roomId : null}
                                    privateGameFound={privateGameFound}
                                    newPrivateGame={newPrivateGame}
                                    setNewPrivateGame={setNewPrivateGame}

                                    invitesReceived={invitesReceived}
                                    friendRequests={friendRequests}
                                    updateFriendRequest={updateFriendRequest}
                                />

                            case "gamePrivateNotFound":
                                return <GamePageNotFound />

                            case "pageNotFound":
                                return <GamePageNotFound />
                                

                            case "profile":
                                return <AuthenticationGuard
                                    component={ProfilePage}
                                    componentParams={{
                                        page: "profile",
                                        props: {
                                            isPublic: false,
                                            connection: connection,
                                            friendsList: friendsList,
                                            friendRequests: friendRequests,
                                            updateFriendRequest: initUpdateFriendRequest,

                                            invitesReceived: invitesReceived,
                                            showInviteAlert: showInviteAlert,
                                            setShowInviteAlert: setShowInviteAlert
                                        }
                                    }}
                                    isAuthenticated={isAuthenticated}
                                />

                                
                            case "profilePublic":
                                return <AuthenticationGuard
                                    component={ProfilePage}
                                    componentParams={{
                                        page: "profilePublic",
                                        props: {
                                            isPublic: true,
                                            connection: connection,
                                            friendsList: friendsList,
                                            friendRequests: friendRequests,
                                            updateFriendRequest: initUpdateFriendRequest,

                                            invitesReceived: invitesReceived,
                                            showInviteAlert: showInviteAlert,
                                            setShowInviteAlert: setShowInviteAlert
                                        }
                                    }}
                                    publicUsername={urlParams.username ? urlParams.username : null}
                                    isAuthenticated={isAuthenticated}
                                />

                            case "account":
                                return <AuthenticationGuard
                                    component={GeneralSettings}
                                    isAuthenticated={isAuthenticated}

                                />
                            }

                        })()
            }
            




        </>


    )
}

export default ConnectionWrapper