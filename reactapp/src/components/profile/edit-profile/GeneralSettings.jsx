
import { useState, useEffect } from 'react'

import Avatar from "../Avatar";

import { Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react";

import { updateUserMetadata, updateUser } from "../../../services/user.service";

import PageLayout from "../../PageLayout";

// Firebase 
import { storage } from '../../../firebase.config';

// Importing ref from firebase package
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";


const GeneralSettings = () => {

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();


    // * States:

    // For the user's recent games
    const [userRecentGames, setUserRecentGames] = useState([])
    const [userGamesLoading, setUserGamesLoading] = useState(true)

    // Editing profile picture
    const [profileImg, setProfileImg] = useState(null);


    ////TODO: SET THE IMG FILE TO EXTRACT INFO FOR FIREBASE UPLOAD.
    //const [tempImgFile, setTempImgFile] = useState(null)

    // * Blob to be used for the new image preview
    const [tempImg, setTempImg] = useState(null)

    // * Determines if the user hasn't inputted anything to be submitted
    // * Sets the submit button to active or disabled
    const [isSubmittable, setIsSubmittable] = useState(false)

    const [accountDeletable, setAccountDeletable] = useState(false)

    const [deleteAccount, setDeleteAccount] = useState(false)

    //* form information
    const [formData, setFormData] = useState(
        { bioInput: "", fileInput: null, colorInput: "", }
    )

    console.log(formData)

    useEffect(() => {

        if (formData.bioInput || formData.fileInput || formData.colorInput) {

            if (!isSubmittable) {
                setIsSubmittable(true)
            }
        }
        else {
            if (isSubmittable) {
                setIsSubmittable(false)
            }
        }


    }, [formData])

    useEffect(() => {

        setProfileImg(user.picture_url)

    }, [user])

    useEffect(() => {

        const initDeleteAccount = async () => {

            


            if (deleteAccount) {

                console.log("Deleting account")

                const accessToken = await getAccessTokenSilently()

                await deleteCurrUser(accessToken, user.sub)

                setDeleteAccount(false)
            }

        }

        initDeleteAccount()


    }, [deleteAccount])

    /********************
     * Utility functions
     */

    function handleFormChange(event) {

        setFormData(prevFormData => {

            if (event.target.name === "fileInput") {
                // Create an object url.
                //* Change the preview of the image after changing it

                console.log("File has been inputted")

                if (event.target.files.length > 0) {

                    const imgObject = URL.createObjectURL(event.target.files[0])

                    console.log("The file being used: ", event.target.files[0])

                    setTempImg(imgObject)


                    return {
                        ...prevFormData,
                        [event.target.name]: event.target.files[0]
                    }
                }

            }

            return {
                ...prevFormData,
                [event.target.name]: event.target.value
            }
        })

    }




    const handleFormSubmit = async (e) => {

        e.preventDefault()

        //* Change metadata here...

        const accessToken = await getAccessTokenSilently()

        //* Before submitting the data, upload the picture to firebase under
        // * the correct profile name

        //* Use a modal to change the picture. Only close the modal after a s
        //* successful upload.

        const data = {
            "username": user.username,
            "userId": user.sub
        }

        // 1. bio

        if (formData.bioInput) {

            data["bio"] = formData.bioInput

        }

        // 2. color

        if (formData.colorInput) {

            //data["preferred_color"] = formData.colorInput
            data["color"] = formData.colorInput

        }

        // 3. image input (upload to firebase)

        if (formData.fileInput) {

            
            const url = await getFirebaseImgUrl(formData.fileInput)

            //data["picture"] = url
            data["ProfilePicturePath"] = url


        }

        console.log("NEW DATA: ", data)

        //await updateUserMetadata(accessToken, user.sub, data)

        await updateUser(accessToken, data)

        // * reset the form
        setFormData(
            {
                bioInput: "",
                fileInput: "",
                colorInput: ""
            }
        )

        //setTempImg(null);

    }

    const getFirebaseImgUrl = async (file) => {

        try {

            // 1. Upload new picture to firebase 

            const picturePath = `profile-pictures/${user.username}`

            const newImageRef = ref(storage, picturePath)
            

            await uploadBytes(newImageRef, file)

            // ? Retrieve the download url of the updated user profile picture
            // ? from firebase
            const pictureUrl = await getDownloadURL(ref(storage, picturePath))

            return pictureUrl

        }
        catch (err) {
            console.log(err)
        }
    }


    const handleFormCancel = (e) => {

        // * Reset the form states

        // * Set the the values of the user properties back to the original

        e.preventDefault()

        resetForm()




    }

    const resetForm = () => {

        setFormData(
            {
                bioInput: "",
                fileInput: "",
                colorInput: ""
            }
        )

        setTempImg(null);
    }

    const showImage = (e) => {
        console.log(e.target.value)
    }

    

    return (

        <PageLayout>

            <div className="grid grid-cols-7 gap-10 max-w-6xl mx-auto">

                {/*TODO: Programmatically show the correct component in this div:*/}
                <div className="col-span-5 lg:col-span-4">

                    <p className="text-2xl font-semibold">General</p>
                    <p className="text-gray-400 mb-5">Manage your public profile settings</p>

                    <hr></hr>


                   
                    <form onSubmit={handleFormSubmit}>

                        {/*profile picture*/}
                        <div className="my-5">

                            <label className="block mb-2 text-md font-medium text-gray-900 dark:text-white" htmlFor="file_input">Change Profile Picture</label>

                            <div className="flex gap-5 items-center">
                                <Avatar
                                    src={tempImg ? tempImg : user.picture_url}
                                    size={125}
                                />

                                <input onChange={handleFormChange}
                                    className=" block w-full text-sm text-blue-900 p-2 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
                                    id="file_input"
                                    name="fileInput"
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    
                                />
                            </div>


                            {/*<button type="button" className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">*/}
                            {/*    Change Profile Picture</button>*/}



                        </div>


                        {/*bio input*/}
                        <div className="mb-5">

                            <label htmlFor="bio-input" className="block mb-2 text-md font-medium text-gray-900">Bio</label>
                            <textarea
                                id="bio-input"
                                style={{ "resize": "none" }}
                                name="bioInput"
                                onChange={handleFormChange}
                                value={formData.bioInput}
                                rows="5"
                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {/*<input id="bioInput" type="text" className="border"/>*/}

                        </div>

                        {/*preferred color*/}
                        <div className="my-5">

                            <label htmlFor="color-input" className="block mb-2 text-md font-medium text-gray-900">Preferred Color</label>
                            <input
                                type="color"
                                id="color-input"
                                name="colorInput"
                                value={formData.colorInput ? formData.colorInput : user.preferred_color}
                                onChange={handleFormChange}
                            />

                        </div>

                        <hr></hr>

                        <div className="my-5 flex gap-4">

                            <button disabled={!isSubmittable} type="submit" className="border border-sky-400 hover:bg-sky-400 hover:text-white disabled:hover:bg-white disabled:hover:text-gray-900 disabled:opacity-70 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5">Save Changes</button>
                            <button disabled={!isSubmittable} onClick={handleFormCancel} type="button" className="focus:outline-none text-white bg-red-700 hover:bg-red-800 disabled:hover:bg-red-700 disabled:opacity-70 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5">Cancel Changes</button>


                        </div>

                    </form>


                </div>

                {/*Edit profile side navigation*/}
                <div className="lg:col-start-6">

                    <nav className="">

                        <ul className="flex flex-col gap-1">
                            <li>
                                <Link
                                    to="/account/general"
                                    className="font-semibold underline"
                                >General</Link>
                            </li>

                            {/*<li>*/}
                            {/*    <Link*/}
                            {/*        to="/account"*/}
                            {/*        className=""*/}
                            {/*    >Account</Link>*/}
                            {/*</li>*/}

                        </ul>
                    </nav>


                </div>

            </div>


            
        
        </PageLayout>
        
    )

}

export default GeneralSettings