import { useState, useEffect } from 'react'

import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom"

import PageLayout from '../../PageLayout';


const AccountSettings = () => {

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    return (

        <PageLayout>

            <div className="grid grid-cols-7 gap-10 max-w-6xl mx-auto">

                {/*TODO: Programmatically show the correct component in this div:*/}
                <div className="col-span-5 lg:col-span-4">

                    <p className="text-2xl font-semibold">Account</p>
                    <p className="text-gray-400 mb-5">Manage your account settings</p>

                    <hr className="mb-5"></hr>




                    <form>

                        <p className="text-lg font-medium text-gray-900 mb-5">Change Password</p>

                        <div className="mb-5">

                            <label
                                htmlFor="old-password"
                                className="block mb-2 text-md font-medium text-gray-900"
                            >Old Password</label>

                            <input
                                id="old-password"
                                name="oldPassword"
                                className="block p-2.5 w-3/4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />

                        </div>

                        <div className="mb-5">

                            <label
                                htmlFor="new-password"
                                className=" block mb-2 text-md font-medium text-gray-900"
                            >New Password</label>

                            <input
                                id="new-password"
                                name="newPassword"
                                className="block p-2.5 w-3/4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />

                        </div>



                        

                    </form>

                    <p className="text-lg font-medium text-gray-900 mb-5">Deactivate Account</p>

                    <button type="button" className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5">Delete</button>


                </div>

                {/*Edit profile side navigation*/}
                <div className="lg:col-start-6">

                    <nav className="">

                        <ul className="flex flex-col gap-1">
                            <li>
                                <Link
                                    to="/account/general"
                                    className=""
                                >General</Link>
                            </li>

                            <li>
                                <Link
                                    to="/account"
                                    className="font-semibold underline"
                                >Account</Link>
                            </li>

                        </ul>
                    </nav>


                </div>

            </div>

        </PageLayout>

    )

}

export default AccountSettings