import PageLayout from "../PageLayout"

const PrivateGameLoading = () => {




    return (
        <>

            <p className="font-bold font-lg">Private game Loading...</p>
        
            <div role="status" className={`animate-pulse flex align-center mb-4 w-full gap-3`}>


                <svg className="w-14 h-14 me-3 text-gray-200 dark:text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                </svg>
                    
                <div className="grow flex flex-col align-center justify-items-center">
                    <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full mb-3 mt-3"></div>
                    <div className="w-48 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                    
            </div>
        
        </>


    )
}

export default PrivateGameLoading