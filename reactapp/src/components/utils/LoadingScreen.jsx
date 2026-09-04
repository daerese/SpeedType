import { useState, useEffect } from 'react';


const LoadingScreen = () => {


    return (

        <div
            className="loading-text-container absolute top-1/2 left-1/2"
        >
            <div className="inline-block">
                <p
                    className="animate-loading-text text-xl font-semibold"

                >Loading...</p>

            </div>
        </div>

    )
}

export default LoadingScreen