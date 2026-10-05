import { useState, useEffect } from 'react'

import Avatar from './Avatar'

const UserCard = ({ user }) => {

    const [statStyle, setStatStyle] = useState("flex justify-between font-semibold")

    return (


        <a className="block cursor-pointer hover:shadow-lg rounded-xl duration-200"
            href={`/profile/${user.username}`}

        >



            <div className="border p-3 rounded-xl"
                style={{
                    backgroundColor: `${user.color}30`
                }}
            >

                <p className="font-semibold ml-3 text-lg">{user.username}</p>


                <div className="flex items-center gap-3">

                    {/*Image goes here*/}
                    <Avatar
                        avatar={user.profilePicturePath}
                        color={user.color}
                        size={100}
                        noRing={true}
                    />

                    {/*Stats go here*/}
                    <div className="grow flex flex-col gap-2">


                   
                        <div className={statStyle}>
                            <p>Average WPM: </p>
                            <p>{user.averageWpm ? user.averageWpm : "N/A"}</p>
                        </div>
                        <div className={statStyle}>
                            <p>Average Accuracy (%): </p>
                            <p>{user.averageAccuracy ? user.averageAccuracy : "N/A"}</p>
                        </div>
                        <div className={statStyle}>
                            <p>Best WPM: </p>
                            <p>{user.bestWpm ? user.bestWpm : "N/A"}</p>
                        </div>
                        <div className={statStyle}>
                            <p>Games Played: </p>
                            <p>{user.gamesPlayed}</p>
                        </div>

                    </div>

                </div>

            </div>


        </a>
    )
}

export default UserCard