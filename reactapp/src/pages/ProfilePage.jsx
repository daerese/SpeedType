

import Avatar from "../components/profile/Avatar"

import { useState, useEffect } from 'react'

import { Link } from "react-router-dom"

import { useAuth0, User,  } from "@auth0/auth0-react";

import { getRecentGames, getPublicUser, getFriendObjects } from '../services/user.service';

import PageLayout from "../components/PageLayout.jsx"
import RecentGames from '../components/profile/RecentGames';


import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";

// Firebase 
import { storage } from '../firebase.config';

// Importing ref from firebase package
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

import UserCard from "../components/profile/UserCard";

import AddFriendIcon from "../components/svgIcons/AddFriendIcon";
import RemoveFriendIcon from "../components/svgIcons/RemoveFriendIcon";
import Spinner from "../components/utils/Spinner";

const ProfilePage = ({
    user,
    isPublic = false,
    publicUsername = null,
    connection,

    friendsList,
    friendRequests,
    updateFriendRequest,

    invitesReceived,

    showInviteAlert,
    setShowInviteAlert
    
}) => {

    const [userRecentGames, setUserRecentGames] = useState([])
    const [userGamesLoading, setUserGamesLoading] = useState(true)

    const [isLoadingPublic, setIsLoadingPublic] = useState(true)

    const [preferredColor, setPreferredColor] = useState(null)
    const [bio, setBio] = useState("")
    const [stats, setStats] = useState(null)

    const [publicUserObject, setPublicUserObject] = useState(null)

    // NOTE: This variable is used to determine if the user displayed on this 
    // profile page is a friend of the logged in user
    const [isFriend, setIsFriend] = useState(false)

    const [friendRequestSending, setFriendRequestSending] = useState(false)

    // Is the friend request waiting to be accepted?
    const [friendRequestWaiting, setFriendRequestWaiting] = useState(false)

    // Did the user displayed on this page send logged in user a friend request
    // Or did they receive a request from the logged in user?
    const [isFriendRequestSender, setIsFriendRequestSender] = useState(false)

    const [friendObjects, setFriendObjects] = useState([])
    const [friendsLoading, setFriendsLoading] = useState(false)

    // * If a friend request was sent or received by this profile, 
    // * that request object will be stored in this state.
    const [friendRequestObject, setFriendRequestObject] = useState({})

    const [scrolledBottom, setScrolledBottom] = useState(false)
    const [scrolledTo, setScrolledTo] = useState(0)

    //const [tabProfile, setTabProfile] = useState(true)
    //const [tabFriends, setTabProfile] = useState(true)

    // * States related to the tabs and Friends Tab
    const [activeTab, setActiveTab] = useState(0)

    const [tabs, setTabs] = useState(["Profile", "Friends"])

    const [friendsTabClicked, setFriendsTabClicked] = useState(false)

    // The amount of times we looped through the friends list to acurire user ids
    const [friendLoopCount, setFriendLoopCount] = useState(0)

    const [friendsListEnd, setFriendsListEnd] = useState(false)

    /** 
     * User information stored in the database but not in auth0 is now on the user object.
     * It's accessed under what Auth0 calls a "custom claim" (https://speedtype.app/db_user)
     * This includes static information such as username, stats, color, profile picture, etc.
     * */
    const [dbUser, setDbUser] = useState(user ? user["https://speedtype.app/db_user"] : null)


    const { isAuthenticated, getAccessTokenSilently } = useAuth0();


    console.log("Friends list on the PROFILE PAGE: ", friendsList)

    //console.log("Friend objects passed to the profile page: ", friendObjects)

    /*****************************************
    * useEffects
    *****************************************/

    // useEfect to get user infomration from the database
    useEffect(() => {


        if (isPublic) {
            // Set the necessary values for the public profile, such as acquring the user.
            // Also, maybe load until the public user is fully loaded

            console.log("IT WORKED! The user that we need to get: ", publicUsername)

            getUser()


            // ? Determine if a friend request was sent
            for (let request of friendRequests) {

                if (request.fromUsername === publicUsername) {

                    setFriendRequestWaiting(true)

                    setIsFriendRequestSender(true)

                    setFriendRequestObject(request)
                    break
                    

                }
                else if (request.toUsername === publicUsername) {

                    setFriendRequestWaiting(true)

                    setFriendRequestObject(request)
                    // leave isFriendRequestSender as false

                    break

                }

            }

            

        }
        else {
            //set the user profile picture
            //setProfileImg(user.picture_url)

            setPreferredColor(dbUser.preferred_color)
            setBio(dbUser.bio)

            if (dbUser.stats) {
                setStats(dbUser.stats)
            }

            getGames()

        }

        console.log("Friends list received (user ids): ", friendsList)

        console.log("Profile page initial render")

        //setIsProfilePage(true)

        //console.log("INit: Has friends been clicked: ", friendsTabClicked)

        const onscroll = () => {
            const newScrolledTo = window.scrollY + window.innerHeight;
            

            setScrolledTo(newScrolledTo)

            
        };

        
        
        window.addEventListener("scroll", onscroll);
        return () => {
            window.removeEventListener("scroll", onscroll);
        };
        


    }, [])


    useEffect(() => {

        // * Call for more friendObjects here
        if (scrolledBottom) {
            console.log("Scrolled to the bottom (OCCURS ONCE?)")

            initGetFriendObjects()
        }

    }, [scrolledBottom])

    useEffect(() => {

        const threshold = 100

        const isReachBottom = document.body.scrollHeight - threshold <= scrolledTo;
        if (isReachBottom) {
            //handleScrollFriendsTab()

            //console.log("SCROLL: 1. Bottom reached. Active tab: ", activeTab)
            if (activeTab === 1) {

                //console.log("SCROLL: 2. Friends tab is active")

                if (!scrolledBottom) {

                    console.log("SCROLL: 3. Setting the scrolledBottom state")
                    setScrolledBottom(true)
                }
            }

        }


    }, [scrolledTo])

    useEffect(() => {

        if (publicUserObject) {

            // ? Determine if they are friends with the user
            for (let friend of friendsList) {

                // If the user id of this friend matches the user id of the profile on this page
                // then they are a friend

                console.log("Public user object in friends loop: ", publicUserObject)
                console.log("Public user FRIEND object: ", friend)

                if (friend.userId1 === publicUserObject.userId ||
                    friend.userId2 === publicUserObject.userId) {

                    console.log("Public user id matches")

                    setIsFriend(true)

                }


            }

        }


    }, [publicUserObject])



    useEffect(() => {

        if (friendRequestSending) {


            sendFriendRequest(publicUserObject.userId, publicUsername, publicUserObject.profilePicturePath)

            //setFriendRequestSending(false)
        }


    }, [friendRequestSending])


    useEffect(() => {

        /**
         * If the active tab is the friends tab (tab index 0), then 
         * We need to acquire the User objects from the users friends list.
         * 
         * ? user.sub == userId
         */



        if (activeTab == 1) {

            console.log("Friends page activated")

            if (!friendsTabClicked) {
                console.log("Friends tab hasn't been clicked")
                setFriendsTabClicked(true)
                //getFriendObjects(friendsList)

                initGetFriendObjects()
                
            }



        }


    }, [activeTab])

    useEffect(() => {

        console.log("The friend objects state has changed: ", friendObjects)

        /**
         * 
         * If the friendObjects length becomes >= (but ideally equal to) the length of the
         * friendsList, we no longer need to call for more friendObjects
         */

        if (friendObjects.length >= friendsList.length) {
            console.log("We have reached the end of the friends list.")

            setFriendsListEnd(true)
        }


    }, [friendObjects])


    //* Friend requests useEffect
    useEffect(() => {


        /**
         * If the friend requests array changes, its possible that the user accepted this
         * profile's friend request:
         * 
         * 1. Check if there is a friend request waiting first (friendRequestWaiting : bool)
         * 2. Check either the bottom (or the top after changing the structure of the array)
         *      of the friendsList array and see if this profile has been added (Based on userId)
         *      2b. If they're not there, loop through the friendRequests. If still there, change no states
         * 3. If either accetped or rejected, change the isFriend state and other necessary states
         * 
         * 
         * OR (Safer but less efficient):
         * 2. Loop through BOTH friendRequests and FriendsList
         * 
         */

        

        if (publicUserObject) {

            // ? Determine if they are friends with the user
            for (let friend of friendsList) {

                // If the user id of this friend matches the user id of the profile on this page
                // then they are a friend

                console.log("Public user object in friends loop: ", publicUserObject)
                console.log("Public user FRIEND object: ", friend)

                if (friend.userId1 === publicUserObject.userId ||
                    friend.userId2 === publicUserObject.userId) {

                    console.log("Public user id matches")

                    setIsFriend(true)

                    if (friendRequestWaiting) {
                        setFriendRequestWaiting(false)

                    }

                    break

                }


            }

        }


    }, [friendsList])

    useEffect(() => {

        if (publicUserObject) {

            if (friendRequestWaiting && isFriendRequestSender) {

                let rejected = true
                // ? Determine if a friend request was sent
                for (let request of friendRequests) {

                    if (request.fromUsername === publicUsername) {

                        //setFriendRequestWaiting(true)

                        rejected = false

                        break


                    }
                    

                } 

                if (rejected) {
                    setFriendRequestWaiting(false)
                    setIsFriendRequestSender(false)

                }
                

            }

            
        }

    }, [friendRequests])


    /*****************************************
     * Utility functions
     *****************************************/

    const getGames = async (publicUserId = null, page=null) => {

        const userId = publicUserId ? publicUserId : user.sub

        const accessToken = await getAccessTokenSilently()

        const data = page ? 
            await getRecentGames(accessToken, userId, page)
            :
            await getRecentGames(accessToken, userId)

        const recentGames = data.data ? data.data : null

        if (recentGames) {
            setUserRecentGames([...recentGames.gameResults])
        }

        setUserGamesLoading(false)


        console.log("Acquired object from Server: ", data.data)

    }

    const getUser = async (returnObject = false) => {
        /**
         * Used for getting the user information for a public profile
         */

        if (isPublic) {
            const accessToken = await getAccessTokenSilently()

            const data = await getPublicUser(accessToken, publicUsername)

            const userObj = data.data ? data.data.user : null

            if (userObj) {
                console.log("USER OBJECT RECEIVED? ", userObj)
                setPublicUserObject(userObj)

                setPreferredColor(userObj.preferred_color)
                setBio(userObj.bio)

                if (userObj.gamesPlayed > 0) {
                    setStats({
                        averageAccuracy: userObj.averageAccuracy,
                        averageWpm: userObj.averageWpm,
                        bestWpm: userObj.bestWpm,
                        gamesPlayed: userObj.gamesPlayed
                    })
                }

                // TODO: Call the getRecentGames for the public user BEFORE stopping the loading

                setIsLoadingPublic(false)

                getGames(userObj.userId)

                if (returnObject) {
                    return userObj
                }
            }

            else {
                console.log("USER OBJECT NOT RECEIVED")
            }
        }


    }

    /* Utilty functions --> Friends and Friend requests ***************************/

    //const addFriendObjects = (newFriendObjects) => {

    //    console.log("Friend objects received in the addFriendObjects function: ", newFriendObjects)

    //    setFriendObjects(prev => [...prev, ...newFriendObjects])

    //}

    const initFriendRequest = () => {


        setFriendRequestSending(true)


    }


    const sendFriendRequest = async (toUserId, toUsername, toProfilePicture) => {

        if (connection) {
            console.log(`Friend request sending to --> ${toUserId}`)

            const fromUserId = user.sub
            const fromUsername = user.username
            const fromProfilePicturePath = user.picture_url

            //await connection.invoke("SendFriendRequest", senderUserId, receiverUserId)
            await connection.invoke("SendFriendRequest",
                fromUserId, fromUsername, fromProfilePicturePath,
                toUserId, toUsername, toProfilePicture)
            //await connection.invoke("SendFriendRequest", senderUserId)

        }

        if (friendRequestSending) {
            setFriendRequestSending(false)
            setFriendRequestWaiting(true)
        }



    }

    const initGetFriendObjects = async () => {

        let loopIndex = friendLoopCount

        const friendsListSection = []

        const threshold = 8

        for (let i = friendLoopCount; i < friendLoopCount + threshold; i++) {

            // * We have looped through the entire friendsList, so break
            if (i >= friendsList.length) {
                break
            }
            else {
                friendsListSection.push(friendsList[i])

                loopIndex += 1

            }

        }

        setFriendLoopCount(loopIndex)

        await invokeGetFriendObjects(friendsListSection)

        if (loopIndex < friendsList.length) {
            setScrolledBottom(false)
        }

    }

    const invokeGetFriendObjects = async (prevFriendsList) => {

        setFriendsLoading(true)

        const friendUserIds = []

        const userId = user.sub

        const accessToken = await getAccessTokenSilently()



        for (let friend of prevFriendsList) {

            if (friend.userId1 != userId) {
                friendUserIds.push(friend.userId1)
            }
            else {
                friendUserIds.push(friend.userId2)
            }

        }

        //console.log("THE LIST OF FRIEND IDS BEING SENT: ", friendUserIds)

        

        const newFriendObjects = await getFriendObjects(accessToken, friendUserIds)

        console.log("Friend user objects received ", newFriendObjects)

        setFriendObjects(prev => [...prev, ...newFriendObjects.data.friendUserObjects])

        setFriendsLoading(false)

    }

    const toggleTab = (tabIndex) => {

        //if (activeTab != tabIndex) {
        //    setActiveTab(tabIndex)
        //}

        setActiveTab(tabIndex)


    }

    

    

    return (

        <>

            {
                isPublic && isLoadingPublic ? 
                    <div>Loading...</div>
                    :
                    <PageLayout
                        friendRequests={friendRequests}
                        updateFriendRequest={updateFriendRequest}
                        invitesReceived={invitesReceived}

                        showInviteAlert={showInviteAlert}
                        setShowInviteAlert={setShowInviteAlert}
                    >

                        <div className="inline-block mb-3">
                            <p className="font-medium text-2xl animate-text">{publicUserObject ? publicUserObject.username : user.username}</p>

                        </div>

                        {/*top part*/}
                        <div className="flex items-center gap-3">

                            <Avatar
                                size={125}
                                src={isPublic && publicUserObject ?
                                    publicUserObject.profilePicturePath
                                    :
                                    user.picture_url}
                            />

                            {/*<div className="inline-block">*/}
                            {/*    <p className="font-medium text-2xl animate-text">{publicUserObject ? publicUserObject.username : user.username}</p>*/}

                            {/*</div>*/}

                            <div className="flex justify-center items-center gap-1">



                               

                                

                            </div>

                            <>
                            {
                                    isPublic ?

                                        <>


                                            {
                                                isFriend ?
                                                    <>

                                                        <button

                                                            className="flex-none mb-0 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"

                                                        >
                                                            Remove Friend
                                                        </button>   
                                                        
                                                    </>

                                                    :

                                                    <>
                                                        {
                                                            friendRequestWaiting ? 
                                                                <>
                                                                    {
                                                                        isFriendRequestSender ? 
                                                                            <>

                                                                                <div className="flex gap-15">

                                                                                    {/*Accept friend request button*/}
                                                                                    <button
                                                                                        style={{ borderRadius: "50%" }}
                                                                                        className="flex-none p-3 hover:bg-gray-200"
                                                                                        onClick={() => updateFriendRequest(friendRequestObject, true)}
                                                                                    >
                                                                                        <AddFriendIcon
                                                                                            tailwindSize={6}
                                                                                        />
                                                                                    </button>

                                                                                    {/*Reject friend request button */}
                                                                                    <button
                                                                                        style={{ borderRadius: "50%" }}
                                                                                        className="flex-none p-3 hover:bg-gray-200"
                                                                                        onClick={() => updateFriendRequest(friendRequestObject, false)}
                                                                                    >

                                                                                        <RemoveFriendIcon
                                                                                            tailwindSize={6}
                                                                                        />
                                                                                    </button>

                                                                                </div>

                                                                            </>
                                                                            :
                                                                            <>

                                                                                <button
                                                                                    disabled={true}
                                                                                    className="disabled:opacity-6 flex-none mb-0 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
                                                                                >
                                                                                    Friend request sent
                                                                                </button> 
                                                                            </>

                                                                    }

                                                                </>
                                                                :
                                                                <>

                                                                    <button

                                                                        className={`flex-none ${friendRequestSending ? "animate-pulse" : ""} mb-0 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 disabled:hover:bg-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2`}
                                                                        onClick={initFriendRequest}
                                                                        disabled={friendRequestSending || friendRequestWaiting}
                                                                       

                                                                    >
                                                                        Add as Friend
                                                                    </button>

                                                                </>

                                                        }

                                                        
                                                    </>
                                                    

                                            }
                                    
                                        </>

                                    :
                                    <Link
                                        to="/profile/account"
                                        className="flex-none mb-0 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
                                    >
                                        Edit Profile
                                    </Link>
                            }

                            </>

                            {/*<div*/}
                            {/*    className={`w-4 h-4 rounded-full mt-1`}*/}
                            {/*    style={{ backgroundColor: preferredColor ? preferredColor : "black" }}*/}
                            {/*></div>*/}

                        </div>


                        {

                            isPublic ? 
                                
                                <hr className="h-0.5 rounded-lg my-8 bg-gray-200"></hr>
                                :
                                <ul class="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 my-8 dark:text-gray-400">

                                    {
                                        tabs.map((tab, index) => 

                                            <li class="me-2">
                                                <button
                                                    className={`inline-block p-4 rounded-t-lg 
                                                                ${activeTab == index ? "text-blue-500 bg-gray-100" : "hover:text-gray-600 hover:bg-gray-50" }`}
                                                    onClick={() => toggleTab(index)}
                                                >{tab === "Friends" ? `${tab} (${friendsList.length})` : tab}</button>
                                                {/*<a href="#" aria-current="page" class="inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500">{tab}</a>*/}
                                            </li>
                                    
                                        )
                                    }
                                    {/*<li class="me-2">*/}
                                    {/*    <a href="#" aria-current="page" class="inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500">Profile</a>*/}
                                    {/*</li>*/}
                                    {/*<li class="me-2">*/}
                                    {/*    <button className="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50">Friends</button>*/}
                                    {/*    */}{/*<a href="#" class="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300">Friends</a>*/}
                                    {/*</li>*/}
                                </ul>


                        }





                        {
                            activeTab == 1 ?

                                <>
                                    
                                    <div className="min-[890px]:grid-cols-2 max-sm:w-full max-[889px]:w-[80%] max-[889px]:mx-auto grid gap-x-24 gap-y-8">
                                        {
                                            friendsList.length > 0 ?


                                                friendObjects.map((user, index) =>

                                                    <UserCard user={user} key={index} />

                                                )
                                                :
                                                <p className="text-center font-semibold">You don't have any friends yet</p>
                                        }

                                        {

                                            friendsLoading &&
                                            <>

                                                <div role="status" className="flex justify-center col-span-full">


                                                    {/*<svg aria-hidden="true" className="margin-auto w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
                                                    {/*    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />*/}
                                                    {/*    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />*/}
                                                    {/*</svg>*/}
                                                    {/*<span className="sr-only">Loading...</span>*/}

                                                    <Spinner />
                                                    
                                                </div>
                                            </>

                                        }
                                    </div>
                                </>
                                :
                                <>

                                    {/*bio and stats container*/}
                                    <div className="grid grid-cols-5 gap-6 mb-6">

                                        {/*bio*/}
                                        <div
                                            className="border px-3 rounded-lg py-4 col-span-full md:col-span-3 pr-10"
                                        >
                                            <p className="text-xl font-bold">Bio</p>
                                            <p className="">
                                                {bio ? bio : "No bio"}
                                            </p>

                                        </div>

                                        {/*stats*/}
                                        <div className="bg-gray-200 rounded-lg py-4 px-2 col-span-full md:col-span-2">

                                            <p className="font-bold text-xl">Stats</p>

                                            <div className="flex flex-col gap-y-2">


                                                {stats ?

                                                    <>
                                                        <div className="flex justify-between">
                                                            <p className="font-semibold">Average WPM: </p>
                                                            <p className="font-semibold">{stats.averageWpm}</p>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <p className="font-semibold">Average Accuracy: </p>
                                                            <p className="font-semibold">{stats.averageAccuracy}</p>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <p className="font-semibold">Best WPM: </p>
                                                            <p className="font-semibold">{stats.bestWpm}</p>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <p className="font-semibold">Games Played: </p>
                                                            <p className="font-semibold">{stats.gamesPlayed}</p>
                                                        </div>
                                                    </>
                                                    :
                                                    <p className="font-semibold">Hey, this looks empty. Play your first game to view your stats.</p>

                                                }


                                            </div>



                                        </div>

                                    </div>


                                    <hr className="h-0.5 rounded-lg my-8 bg-gray-200"></hr>

                                    <RecentGames
                                        userGamesLoading={userGamesLoading}
                                        userRecentGames={userRecentGames}
                                        getAccessToken={getAccessTokenSilently}
                                        currentUsername={user.username}
                                    />

                                </>
                        }

                        



                    </PageLayout>
            }

        
        </>

        

        
            
            

        
    )

}

export default ProfilePage;