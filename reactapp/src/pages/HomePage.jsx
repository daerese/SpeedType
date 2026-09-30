import { useState, useEffect } from 'react'

import { useAuth0, User } from "@auth0/auth0-react";

//import Container from 'react-bootstrap/Container';

//import NavBarMain from '../components/navigation/NavBarMain'

//import Image from 'react-bootstrap/Image';

import PageLayout from "../components/PageLayout.jsx"

import { Link } from "react-router-dom"

import Avatar from '../components/profile/Avatar.jsx';

import Game from '../components/game/Game.jsx';

import RecentGames from '../components/profile/RecentGames.jsx';

import StatsGrid from '../components/profile/StatsGrid.jsx';

import { getRecentGames } from '../services/user.service.jsx'

import { useDbUser } from '../context/DbUserContext.jsx'

import LoginButton from '../components/buttons/LoginButton.jsx';
import SignupButton from '../components/buttons/SignupButton.jsx';



const HomePage = ({ user, friendRequests, updateFriendRequest, invitesReceived, showInviteAlert, setShowInviteAlert }) => {


    /**
     * HomePage
     * 
     * Displays the user's home page before/after logging in.
     * 
     * User authentication is handled by Auth0. 
     * User is provided by the state 'db_user'
     */

    const { isAuthenticated, getAccessTokenSilently} = useAuth0();

    //const [profilePic, setProfilePic] = useState("https://i.pinimg.com/564x/88/31/6f/88316fdc2baabfccc92e4763c88ba1d8.jpg")

    //const [profilePic, setProfilePic] = useState(`${user.picture}`)

    const [userRecentGames, setUserRecentGames] = useState([])
    const [userGamesLoading, setUserGamesLoading] = useState(true)

    const [statStyle, setStatStyle] = useState("")

    const [testState, setTestState] = useState(false)

    /**
     * 2026: The user's info from OUR database (username, stats, color, profile picture, etc.)
     * comes from the shared DbUserContext, which asks the backend (/api/user/me) for the latest data.
     * This replaced the Auth0 custom claim, which only updated when the user logged in again.
     * */
    const { dbUser } = useDbUser()

    //console.log(user)



    //useEffect(() => {

    //    //if (isAuthenticated) {
    //    //    console.log("The user property now: ", user)
    //    //}

    //    if (isAuthenticated) {


    //        if (user && userRecentGames.length <= 0) {


    //            const getGames = async () => {


    //                const accessToken = await getAccessTokenSilently()

    //                const data = await getRecentGames(accessToken, user.sub)

    //                const recentGames = data.data ? data.data : null

    //                if (recentGames) {
    //                    setUserRecentGames([...recentGames.gameResults])
    //                }

    //                setUserGamesLoading(false)


    //                console.log("Acquired object from Server: ", data.data)

    //            }

    //            getGames()





    //        }

    //        else {
    //            console.log(" No user object or games already filled")
    //            console.log(" recent games --> ", userRecentGames)
    //        }
    //    }

    //    else {
    //        console.log(" Not authenticated??")
    //    }

    //}, [user])


    /***********
     * 2026: Get the user's recent games from the database (re-enabled after the new Auth0 setup).
     * user.sub is the Auth0 user id, which is also the UserId in our database.
     *************/
    useEffect(() => {

        if (!isAuthenticated || !user) return;

        const getGames = async () => {

            try {
                const accessToken = await getAccessTokenSilently()

                const data = await getRecentGames(accessToken, user.sub)

                const recentGames = data.data ? data.data : null

                if (recentGames) {
                    setUserRecentGames([...recentGames.gameResults])
                }
            }
            catch (e) {
                console.error("Could not load recent games: ", e)
            }
            finally {
                setUserGamesLoading(false)
            }

        }

        getGames()

    }, [isAuthenticated, user])


    const testGameResult = (gameResult) => {

        console.log("Game clicked. Result id: ", gameResult.resultId)

    }


    const testAccessToken = () => {


        
    }


    return (
        <>
            <PageLayout
                friendRequests={friendRequests}
                updateFriendRequest={updateFriendRequest}
                invitesReceived={invitesReceived}

                showInviteAlert={showInviteAlert}
                setShowInviteAlert={setShowInviteAlert}
            >


                <div className="inline-block">

                    <p
                        className="animate-text text-3xl font-bold mb-5"
                  
                    >Welcome{dbUser ? ", " + dbUser.username : ", to SpeedType"}</p>

                </div>
                

                {
                    isAuthenticated ?

                    <>

                        {/*parent container for stats and user card*/}

                        <div className="grid grid-cols-9 gap-8">
                            
                            {/*left side elements (User Stat card and Game Choices)*/}
                            <div className="col-span-4 max-[900px]:col-span-full">


                                {/*user card container*/}

                                    <a className="block cursor-pointer hover:shadow-lg rounded-xl duration-200 mb-8"
                                       href="/profile">

                                    {/* The card is tinted with the user's preferred color (if they picked one) */}
                                    <div className={`border rounded-xl p-4 ${dbUser?.color ? "" : "bg-gray-50"}`}
                                        style={dbUser?.color ? { backgroundColor: `${dbUser.color}20` } : {}}
                                    >

                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar
                                                src={dbUser?.profilePicturePath}
                                                size={56}
                                                noRing={true}
                                            />

                                            <div>
                                                <p className="font-semibold text-lg leading-tight">{dbUser?.username}</p>
                                                <p className="text-sm text-gray-500">View profile →</p>
                                            </div>
                                        </div>

                                        <StatsGrid
                                            stats={dbUser}
                                            emptyMessage="Your stats will show here after your first game."
                                        />

                                    </div>

                                </a>

                                {/*links for finding a game*/}
                                <div className="flex flex-col gap-3">

                                    <a
                                        href="/game"
                                        className="block rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 duration-200"
                                    >
                                        <p className="font-semibold">Quick Play</p>
                                        <p className="text-sm text-blue-100">Race other players online</p>
                                    </a>

                                    <a
                                        href="/game/private"
                                        className="block rounded-xl border border-gray-300 hover:bg-gray-100 px-4 py-3 duration-200"
                                    >
                                        <p className="font-semibold">Practice / Private Game</p>
                                        <p className="text-sm text-gray-500">Practice alone or invite friends</p>
                                    </a>

                                </div>

                            </div>

                            {/*Right side elmeent (Recent games container)*/}

                                <RecentGames
                                    userRecentGames={userRecentGames}
                                    userGamesLoading={userGamesLoading}
                                    getAccessToken={getAccessTokenSilently}
                                    currentUsername={dbUser?.username}
                                />


                            {/*<div className="border text-center p-3 rounded-lg col-span-5 max-[900px]:col-span-full">*/}

                            {/*    <p className="font-semibold mb-4">Recent games</p>*/}

                            {/*    <div className="border border-b-black mx-5 mb-4"></div>*/}


                            {/*    {*/}
                            {/*        userGamesLoading ? */}

                            {/*            <div className="animate-pulse space-y-4">*/}
                            {/*                <div className="h-5 w-full bg-gray-200 rounded-full"></div>*/}
                            {/*                <div className="h-5 w-full bg-gray-200 rounded-full"></div>*/}
                            {/*                <div className="h-5 w-full bg-gray-200 rounded-full"></div>*/}
                            {/*                <div className="h-5 w-full bg-gray-200 rounded-full"></div>*/}
                            {/*                <div className="h-5 w-full bg-gray-200 rounded-full"></div>*/}
                                        
                            {/*            </div>*/}
                            {/*            :*/}
                            {/*            <>*/}
                            {/*            {*/}

                            {/*                userRecentGames.length > 0 ?*/}

                            {/*                    <>*/}
                            {/*                        <div className="grid grid-cols-4 mb-2">*/}


                            {/*                            <p className="font-semibold">WPM</p>*/}
                            {/*                            <p className="font-semibold">Accuracy (%)</p>*/}
                            {/*                            <p className="font-semibold">Position</p>*/}
                            {/*                            <p className="font-semibold">Date</p>*/}


                            {/*                        </div>*/}


                            {/*                                {*/}
                            {/*                                    userRecentGames.map((gameResult, index) =>*/}

                            {/*                                <div key={index} onClick={() => testGameResult(gameResult)} className="grid grid-cols-4 mb-1 border border-l-black bg-gray-100 py-1 hover:bg-gray-300 duration-200 cursor-pointer">*/}
                            {/*                                    <p className="font-semibold">{gameResult.wpm}</p>*/}
                            {/*                                    <p className="font-semibold">{gameResult.accuracy}</p>*/}
                            {/*                                    <p className="font-semibold">{gameResult.position} / {gameResult.playerCount}</p>*/}
                            {/*                                    <p className="font-semibold">{gameResult.startDate.split(" ")[0]}</p>*/}

                            {/*                                </div>*/}
                            {/*                            )*/}

                            {/*                        }*/}

                            {/*                    </>*/}

                            {/*                    :*/}
                            {/*                    <p>No recent games</p>*/}


                            {/*            }*/}

                            {/*            </>*/}

                            {/*    }*/}

                                


                                
                                


                            {/*</div>*/}


                        </div>


                        

                     </>

                        :

                        <>
                        
                            <Game
                                previewMode={true}
                            />
                            <div className="mb-6"></div>

                            {/*login/signup container*/}
                            <div
                                className="p-2.5 rounded-xl"
                                style={{ backgroundColor: "#E0F2FD" }}>

                                <p
                                    className="text-sky-600 font-semibold mb-3">To play against other typers</p>

                                <LoginButton
                                    customStyle="inline-block cursor-pointer mr-3 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:ring-blue-300"
                                />
                                <SignupButton
                                    customStyle="inline-block cursor-pointer text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5"
                                />

                            </div>
                        
                        </>


                }

            
               
                
                

            </PageLayout>


        </>
    )
}

export default HomePage