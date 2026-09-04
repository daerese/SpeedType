import { useState, useEffect } from 'react'



const RoomFinder = ({ joinRoom, createRoom, isMatchmaking }) => {


    const [formData, setFormData] = useState({
        //name: "",
        room: ""
    })

    const handleChange = (event) => {

        setFormData(prevFormData => {

            const { value, name } = event.target

            return {
                ...prevFormData,
                [name]: value
            }

        })

    }

    const handleJoinRoom = (event) => {
        event.preventDefault();

        console.log("Form submitted");

        joinRoom(formData.room)
    }

    const handleCreateRoom = (event) => {
        event.preventDefault()
        createRoom(formData.room)
    }





    console.log(formData)
    
    return (

        
        <>

            <div>

                {/* Form for joining a room */}
                <h3>Join a game</h3>
                <form onSubmit={handleJoinRoom}>

                    <input
                        type="text"
                        placeholder="Room"
                        onChange={handleChange}
                        name="room"
                        value={formData.room}
                    />

                    <button type="submit">Join Game</button>

                </form>
                <hr />

                <h3>Create a game</h3>
                <form onSubmit={handleCreateRoom}>

                    <input
                        type="text"
                        placeholder="Room"
                        onChange={handleChange}
                        name="room"
                        value={formData.room}
                    />

                    <button type="submit">Create a Game</button>

                </form>

            </div>

            <div id="searchingModal" tabIndex="-1" className={`${isMatchmaking ? "" : "hidden"} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full`}>
                <div className="relative p-4 w-full max-w-2xl max-h-full">
                    {/*MOdal Content*/}
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        {/*Modal Header*/}
                        
                        <p>Finding a game</p>
                        
                    </div>
                </div>
            </div>
            


        </>
    )
}

export default RoomFinder;