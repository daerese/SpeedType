import { useState, useEffect } from 'react';
//import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css'
// * Pages
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
//import TestApi from './pages/TestApi';
import ProfilePage from './pages/ProfilePage';
import GeneralSettings from './components/profile/edit-profile/GeneralSettings';
//import AccountSettings from './components/profile/edit-profile/AccountSettings';
//import AuthenticationGuard from './components/navigation/AuthenticationGuard';
import ConnectionWrapper from './components/navigation/ConnectionWrapper';

import { BrowserRouter as Router, Route, Link, Routes, createBrowserRouter, createRoutesFromElements } from "react-router-dom"

import { useAuth0 } from "@auth0/auth0-react";

function App() {

    const [userData, setUserData] = useState(null)

    const [connection, setConnection] = useState(null)

    const { isLoading, user, isAuthenticated } = useAuth0()



    return (

        <>

            {/*<ConnectionWrapper authLoading={isLoading} user={user} />*/}

            <Router>

                <Routes>

                    <Route
                        exact path="/" element={
                            <ConnectionWrapper
                                page="home"
                                authLoading={isLoading}
                                user={user}
                                component={HomePage}
                            />
                        }
                    />
                    <Route
                        exact path="/game" element={
                            <ConnectionWrapper
                                page="game"
                                authLoading={isLoading}
                                user={user}
                                component={GamePage}
                            />
                        }
                    />
                    <Route
                        exact path="/game/private" element={
                            <ConnectionWrapper
                                page="gamePrivate"
                                authLoading={isLoading}
                                user={user}
                                component={GamePage}
                            />
                        }
                    />
                    <Route
                        exact path="/game/private/:roomId" element={
                            <ConnectionWrapper
                                page="gamePrivateJoin"
                                authLoading={isLoading}
                                user={user}
                                component={GamePage}
                            />
                        }
                    />
                    <Route
                        exact path="/game/private/notFound" element={
                            <ConnectionWrapper
                                page="gamePrivateNotFound"
                                authLoading={isLoading}
                                user={user}
                                component={GamePage}
                            />
                        }
                    />
                    <Route
                        exact path="*" element={
                            <ConnectionWrapper
                                page="pageNotFound"
                                authLoading={isLoading}
                                user={user}
                                component={GamePage}
                            />
                        }
                    />

                    <Route
                        exact path="/profile" element={
                            <ConnectionWrapper
                                page="profile"
                                authLoading={isLoading}
                                user={user}
                                component={ProfilePage}
                            />
                        }
                    />
                    <Route
                        exact path="/profile/:username" element={
                            <ConnectionWrapper
                                page="profilePublic"
                                authLoading={isLoading}
                                user={user}
                                component={ProfilePage}
                            />
                        }
                    />

                    <Route
                        exact path="/profile/account" element={
                            <ConnectionWrapper
                                page="account"
                                authLoading={isLoading}
                                user={user}
                                component={GeneralSettings}
                            />
                        }
                    />
                    

                </Routes>

            </Router>

          

           


        </>


    )
}

export default App;