import { useEffect, useState } from "react"

//Importing the default profile picture to use if the
// user has nothing set. 
import defaultProfilePicture from "../../assets/default-profile-picture.png"

const Avatar = ({ size, src, noRing }) => {

    const [hasRing, setHasRing] = useState(true)

    useEffect(() => {

        if (noRing) {
            setHasRing(false)
        }

    }, [])


    return (

        //<img className={`w-${size} h-${size} rounded-full p-1 ring-2 ring-gray-300`} src={src} alt="Rounded avatar" />
        <img className={`rounded-full p-1 ${hasRing &&  "ring-2 ring-gray-300"}`}
            src={src || defaultProfilePicture}
            alt="Rounded avatar"
            style={{width: size, height: size} }
        />


    )
}


export default Avatar