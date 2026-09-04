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

import { getRecentGames } from '../services/user.service.jsx'

import LoginButton from '../components/buttons/LoginButton.jsx';
import SignupButton from '../components/buttons/SignupButton.jsx';



const HomePage = ({friendRequests, updateFriendRequest, invitesReceived, showInviteAlert, setShowInviteAlert }) => {

    const { user, isAuthenticated, getAccessTokenSilently, getAccessTokenWithPopup, } = useAuth0();

    //const [profilePic, setProfilePic] = useState("https://i.pinimg.com/564x/88/31/6f/88316fdc2baabfccc92e4763c88ba1d8.jpg")

    //const [profilePic, setProfilePic] = useState(`${user.picture}`)

    const [userRecentGames, setUserRecentGames] = useState([])
    const [userGamesLoading, setUserGamesLoading] = useState(true)

    const [statStyle, setStatStyle] = useState("")

    const [testState, setTestState] = useState(false)

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
     * THIS FUNCTION IS COMMENTED OUT TEMPORARILY FOR TESTING THE NEW AUTH0 CONFIGURATION (2026)
     *************/
    //useEffect(() => {


    //    setStatStyle(
    //        "flex justify-between font-semibold"
    //    )

    //     //* Get the user's recent games from the database.

    //    const getGames = async () => {


    //        const accessToken = await getAccessTokenSilently()

    //        console.log("Access Token: ", accessToken)

    //        const data = await getRecentGames(accessToken, user.sub)

    //        const recentGames = data.data ? data.data : null

    //        if (recentGames) {
    //            setUserRecentGames([...recentGames.gameResults])
    //        }

    //        setUserGamesLoading(false)
            

    //        console.log("Acquired object from Server: ", data.data)

    //    }

    //    getGames()



    //}, [])


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
                  
                    >Welcome{user ? ", " + user.username : ", to SpeedType"}</p>

                </div>
                

                {
                    isAuthenticated ?

                    <>

                        {/*parent container for stats and user card*/}

                        <div className="grid grid-cols-9 gap-8">
                            
                            {/*left side elements (User Stat card and Game Choices)*/}
                            <div className="col-span-4 max-[900px]:col-span-full">


                                {/*user card container*/}

                                    <a className="block cursor-pointer hover:shadow-lg rounded-xl duration-200"
                                       href="/profile">

                                    <div className="border flex mb-8 items-center gap-3 p-3 rounded-xl"
                                        style={{
                                            backgroundColor: `${user.preferred_color}30`
                                        }}
                                    >

                                        {/*Image goes here*/}


                                        <Avatar
                                            src={user.picture_url}
                                            size={100}
                                            noRing={true}
                                        />

                                        {/*Stats go here*/}
                                        <div className="grow flex flex-col gap-2">

                                            {user.stats ?

                                                <>
                                                    <div className={statStyle}>
                                                        <p>Average WPM: </p>
                                                        <p>{user.stats.averageWpm ? user.stats.averageWpm : "N/A"}</p>
                                                    </div>
                                                    <div className={statStyle}>
                                                        <p>Average Accuracy (%): </p>
                                                            <p>{user.stats.averageAccuracy ? user.stats.averageAccuracy : "N/A"}</p>
                                                    </div>
                                                    <div className={statStyle}>
                                                        <p>Best WPM: </p>
                                                            <p>{user.stats.bestWpm ? user.stats.bestWpm : "N/A"}</p>
                                                    </div>
                                                    <div className={statStyle}>
                                                        <p>Games Played: </p>
                                                        <p>{user.stats.gamesPlayed}</p>
                                                    </div>

                                                </>
                                                :
                                                <p>Your stats will show here after your first game</p>

                                            }


                                        </div>

                                    </div>


                                </a>

                                {/*links for finding a game*/}
                                <div className="">

                                    <ul className="space-y-4 font-semibold block">

                                        <li className="relative block w-full duration-200 before:content-[''] before:duration-200 before:block before:w-0 before:hover:w-full before:h-full before:bg-gray-300 before:absolute">
                                            <a
                                                    
                                                    href="/game"
                                                className="block relative border-l border-black pl-4 py-1 h-full w-full cursor"
                                            >Quick Play</a>
                                            
                                        </li>
                                        <li className="relative block w-full duration-200 before:content-[''] before:duration-200 before:block before:w-0 before:hover:w-full before:h-full before:bg-gray-300 before:absolute">
                                            <a

                                                href="/game/private"
                                                className="block relative border-l border-black pl-4 py-1 h-full w-full cursor"
                                            >Practice / Private Game</a>

                                        </li>
                                        

                                    </ul>

                                </div>

                            </div>

                            {/*Right side elmeent (Recent games container)*/}

                                <RecentGames
                                    userRecentGames={userRecentGames}
                                    userGamesLoading={userGamesLoading}
                                    getAccessToken={getAccessTokenSilently}
                                    currentUsername={user.username}
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


                        

                            <hr className="h-0.5 rounded-lg my-8 bg-gray-200">

                            </hr>




                            {/*other player stats*/}



                            

                            {/*Temporary Friend Requests Test*/}

                            <div>

                                

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