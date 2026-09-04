// Importing ref from firebase package
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

import { useState, useEffect } from 'react'

import Avatar from "../Avatar";

const GeneralSettings = () => {

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    return (
        <div className="grid grid-cols-7">

            {/*TODO: Programmatically show the correct component in this div:*/}
            <div className="col-span-5">

                <p>General</p>
                <p>Manage your public profile settings</p>

                <hr></hr>


                {/*profile picture*/}
                <div>

                    <Avatar
                        src={""}
                    />

                </div>

            </div>

            {/*Edit profile side navigation*/}
            <div className="col-span-2">



            </div>

        </div>
    )

}

const AccountSettings = () => {

    

}

//TODO: Figure out if you want the Edit Profile to be it's own page
// or a conditional part of the profile component
const EditProfile = () => {

    return (

    )
}


export default EditProfile 