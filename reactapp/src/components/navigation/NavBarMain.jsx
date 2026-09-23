import { useState, useEffect, useRef } from 'react';

import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom"

//import Nav from 'react-bootstrap/Nav';
//import Navbar from 'react-bootstrap/Navbar';
//import NavDropdown from 'react-bootstrap/NavDropdown';
//import Container from 'react-bootstrap/Container';

import LoginButton from '../buttons/LoginButton';
import SignupButton from '../buttons/SignupButton'
import LogoutButton from '../buttons/LogoutButton';

import NavProfileIcon from '../svgIcons/NavProfileIcon';
import NavFriendRequestsIcon from '../svgIcons/NavFriendRequestsIcon';
import NavInvitesIcon from '../svgIcons/NavInvitesIcon';

import InviteAlert from './InviteAlert';

import { useAuth0 } from "@auth0/auth0-react";

import Avatar from "../profile/Avatar"
import AddFriendIcon from '../svgIcons/AddFriendIcon';
import RemoveFriendIcon from '../svgIcons/RemoveFriendIcon'

const NavBarMain = ({ friendRequests, updateFriendRequest, invitesReceived = [], showInviteAlert, setShowInviteAlert }) => {

    // * Refs for the nav menus and menu toggle buttons
    const navMenuRef = useRef(null)

    const navMenuProfileRef = useRef(null)
    const navMenuRequestsRef = useRef(null)
    const navMenuInvitesRef = useRef(null)

    const navMenuProfileButtonRef = useRef(null)
    const navMenuRequestsButtonRef = useRef(null)
    const navMenuInvitesButtonRef = useRef(null)

    // * Dropdowns
    const [profileDropdownActive, setProfileDropdownActive] = useState(false)
    const [requestsDropdownActive, setRequestsDropdownActive] = useState(false)
    const [invitesDropdownActive, setInvitesDropdownActive] = useState(false)

    // * Amount of pending friend requests waiting to be accepted or declined
    const [unviewedFriendRequests, setUnviewedFriendRequests] = useState(0)

    const [sentFriendRequests, setSentFriendRequests] = useState([])

    const [receivedFriendRequests, setReceivedFriendRequests] = useState([])


    //console.log("The friend requests FROM THE NAVBAR: ", friendRequests)

    // AUth0
    const { user, isAuthenticated } = useAuth0();

    //const { isAuthenticated } = useAuth0();

    //console.log(isAuthenticated)

    //* Utility functions

    // * For closing the nav menu when clicking outside of it
    const handleOutsideClick = (event) => {
        if (

            (navMenuRequestsRef.current &&
                !navMenuRequestsRef.current.contains(event.target)) &&
            (navMenuProfileRef.current &&
                !navMenuProfileRef.current.contains(event.target)) &&
            (navMenuInvitesRef.current &&
                !navMenuInvitesRef.current.contains(event.target)) &&
            
            event.target !== navMenuRequestsButtonRef.current &&
            event.target !== navMenuProfileButtonRef.current &&
            event.target !== navMenuInvitesButtonRef.current 
        ) {
            setProfileDropdownActive(false);
            setRequestsDropdownActive(false);
            setInvitesDropdownActive(false);
        }
        //else if (

        //    navMenuRef.current &&
        //    // navMenu was not clicked
        //    !navMenuRef.current.contains(event.target) &&
        //    // the profile button was not clicked
        //    event.target !== navMenuRequestsButtonRef.current
        //) {
        //    //setProfileDropdownActive(false);
        //    setRequestsDropdownActive(false);
        //}
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    useEffect(() => {

        if (friendRequests) {

            //console.log("Friend requests EFFECT TRIGGERED IN NAVBAR")

            let unviewedCount = 0

            const sentArray = []

            const receivedArray = []

            for (let request of friendRequests) {

                // * Populate the arrays for both sent and received requests
                // * For the received requests --> Check if they've been viewed
                //  * If they have been viewed increment the view count

                if (request.fromUserId === user.sub) {

                    sentArray.push(request)
                }
                else {

                    receivedArray.push(request)

                    if (!request.viewed) {
                        unviewedCount += 1
                    }


                }


            }

            setSentFriendRequests([...sentArray])
            setReceivedFriendRequests([...receivedArray])

            setUnviewedFriendRequests(unviewedCount)

        }

    }, [friendRequests])

    useEffect(() => {



    }, [invitesReceived])

    const toggleProfileDropdown = () => {
        setProfileDropdownActive(prev => !prev)
    }

    const toggleRequestsDropdown = () => {

        setRequestsDropdownActive(prev => !prev)
    }

    const toggleInvitesDropdown = () => {
        setInvitesDropdownActive(prev => !prev)
    }

    

    return (
        
        <nav className="py-6 border-b mb-5">

                <InviteAlert
                invite={invitesReceived.length > 0 ? invitesReceived[invitesReceived.length - 1] : null}
                showAlert={showInviteAlert}
                setShowAlert={setShowInviteAlert}
                />

            <div className="flex justify-between container mx-auto">


                <a href="/" className="font-semibold">SpeedType</a>

                
                <div className="relative text-center">
                    <div className="flex gap-2">


                        <button ref={navMenuInvitesButtonRef} onClick={toggleInvitesDropdown} className="flex-none rounded-full p-1 hover:bg-gray-200">

                            <NavInvitesIcon />


                            {/*The number of game invites that shows on the icon button*/}
                            {
                                invitesReceived.length > 0 &&
                                <>

                                    <div className="absolute rounded-full bg-red-600 text-xs w-5 h-5 font-semibold text-white flex items-center align-center justify-center"
                                        style={{
                                            bottom: "-4px",
                                            left: "-4px"
                                        }}
                                    >


                                        <p
                                            className="p-0 m-0"
                                        >{invitesReceived.length}</p>

                                    </div>



                                </>




                            }

                        </button>

                        <button ref={navMenuRequestsButtonRef} onClick={toggleRequestsDropdown} className="flex-none relative rounded-full p-1  hover:bg-gray-200">

                            <NavFriendRequestsIcon />

                            {
                                unviewedFriendRequests > 0 &&

                                <>

                                    <div className="absolute rounded-full bg-red-600 text-xs w-5 h-5 font-semibold text-white flex items-center align-center justify-center"
                                        style={{
                                            bottom: "-4px",
                                            left: "-4px"
                                        }}
                                    >

                          
                                        <p
                                            className="p-0 m-0"
                                        >{unviewedFriendRequests}</p>
                                          
                                    </div>
                                   


                                </>


                            

                            }


                        </button>


                        

                        <button ref={navMenuProfileButtonRef} onClick={toggleProfileDropdown} className="flex-none rounded-full p-1 hover:bg-gray-200">

                            <NavProfileIcon />

                        </button>


                    </div>

                    {/*friend requests dropdown*/}
                    <div ref={navMenuRequestsRef} className={`${!requestsDropdownActive && "hidden"} absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5`}>
                        <div className="py-1">


                            <p className="font-semibold py-2">Friend requests</p>

                            

                            {/*friend requests list*/}
                            <>
                                {
                                    receivedFriendRequests.length > 0 ?

                                        <>
                                            {
                                                receivedFriendRequests.map((request, index) => 
                                                    <div className="flex border-t-2 justify-between p-2" key={index}>
                                                        <a href={`/profile/${request.fromUsername}`}
                                                            className="block hover:text-sky-500 duration-200"
                                                        >
                                                            <div className="flex gap-2 items-center">

                                        
                                                                <Avatar
                                                                    src={request.fromProfilePicturePath}
                                                                    size={45}
                                            
                                                                />

                                                                <p className="font-semibold text-sm">{request.fromUsername}</p>

                                        

                                                            </div>
                                                        </a>

                                                        {/*Accept/reject icons*/}

                                                        <div className="flex gap-15">

                                                            {/*Accept friend invite button*/}
                                                            <button
                                                                style={{ borderRadius: "50%" }}
                                                                className="flex-none p-3 hover:bg-gray-200"
                                                                onClick={() => updateFriendRequest(request, true)}
                                                            >
                                                                <AddFriendIcon
                                                                    tailwindSize={6}
                                                                />
                                                            </button>

                                                            {/*Reject friend invite button */}
                                                            <button
                                                                style={{ borderRadius: "50%" }}
                                                                className="flex-none p-3 hover:bg-gray-200"
                                                                onClick={() => updateFriendRequest(request, false)}
                                                            >
                                                
                                                                <RemoveFriendIcon
                                                                    tailwindSize={6}
                                                                />
                                                            </button>

                                                        </div>
                                                    </div>
                                
                                                )
                                            }

                                        </>
                                        :
                                        <>
                                            <p className=" p-2 border-t-2">No friend requests</p>
                                        </>


                                }

                            </>

                        </div>
                    </div>

                    {/*game invites dropdown*/}
                    <div ref={navMenuInvitesRef}
                        className={`${!invitesDropdownActive && "hidden"} absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5`}
                        style={{width: "21rem"}}

                    >

                        <div className="py-1">


                            <p className="font-semibold py-2">Game Invites</p>

                            {/*game invites list*/}
                            <>
                                {
                                    invitesReceived.length > 0 ?

                                        <>
                                            {
                                                invitesReceived.map((invite, index) =>
                                                    <div className="flex border-t-2 justify-between items-center p-2 gap-2" key={index}>
                                                        {/*<a href={`/profile/${invite.senderUsername}`}*/}
                                                        {/*    className="block hover:text-sky-500 duration-200"*/}
                                                        {/*>*/}

                                                        <div className="">
                                                            <div className="flex gap-2 items-center">


                                                                <Avatar
                                                                    src={invite.senderProfilePicturePath}
                                                                    size={45}

                                                                />

                                                                <p className="font-semibold text-sm">{invite.senderUsername}</p>



                                                            </div>

                                                        </div>
                                                        {/*</a>*/}

                                                        {/*Accept/reject icons*/}

                                                        <div className="flex gap-2">

                                                            {/*Accept game invite button*/}
                                                            {/*<a*/}
                                                            {/*    href={`/game/private/${invite.roomId}`}*/}
                                                            {/*    className="py-2.5 px-5 bg-green-500 text-white text-sm rounded-md duration-200 hover:bg-green-600"*/}
                                                            {/*>*/}
                                                            {/*    Join*/}
                                                            {/*</a>*/}

                                                            {/*Reject friend invite button */}
                                                            {/*<button*/}
                                                                
                                                            {/*    type="button"*/}
                                                            {/*    className="py-2.5 px-5 bg-green-500 text-white text-sm rounded-md duration-200 hover:bg-green-600"*/}
                                                            {/*>*/}
                                                            {/*    Decline*/}
                                                            {/*</button>*/}

                                                            <div>
                                                                <a href={`game/private/${invite.roomId}`}
                                                                    className="duration-200 rounded-md block bg-green-500 hover:bg-green-600 font-semibold text-white py-1 px-4">Join</a>
                                                            </div>
                                                            {/*<div>*/}
                                                            {/*    <button className="rounded-md block bg-red-500 font-semibold text-white py-1 px-4">Decline</button>*/}
                                                            {/*</div>*/}

                                                        </div>
                                                    </div>

                                                )
                                            }

                                        </>
                                        :
                                        <>
                                            <p className=" p-2 border-t-2">No game invites</p>
                                        </>


                                }

                            </>

                        </div>

                    </div>



                    {/*profile dropdown*/}
                    <div ref={navMenuProfileRef} className={`${!profileDropdownActive && "hidden"} absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
                        <div className="py-1">


                            {
                                isAuthenticated ?
                                    <>
                                        <a href="/profile" className="text-gray-700 font-semibold block px-4 py-2 text-sm hover:bg-gray-50" tabIndex="-1">Profile</a>
                                        <LogoutButton />
                                    </>
                                    :
                                    <>
                                        <LoginButton />
                                        <SignupButton />
                                    </>
                            }



                        </div>
                    </div>

                    

                   



                </div>

            </div>

            
            

            
        </nav>
        
    )
}

export default NavBarMain