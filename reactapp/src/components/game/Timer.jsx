const Timer = ({ time, isMainTimer, running, gameOver, classString, isPrivateGame }) => {



    const translateTime = (currTime) => {
        /**
         * Translates the time in seconds to a 
         * readable minute : second format.
         */

        const minutes = Math.floor(currTime / 60);

        const seconds = currTime % 60;

        let newTime = `${minutes < 10 ? 0 : ''}${minutes} : ${seconds < 10 ? 0 : ''}${seconds}`

        return newTime

    }

    return (
        <>

            {

            }


            {
                isMainTimer ? 
                    <div className="text-center text-2xl mb-4">
                        <p className="">{translateTime(time)}</p>
                    </div>
                    :
                    <p className={classString ? classString : ""}>{translateTime(time)}</p>
            }

        </>
    )
}

export default Timer