
import NavBarMain from "./navigation/NavBarMain"
//import Container from 'react-bootstrap/Container';


const PageLayout = ({
    children,
    friendRequests = null,
    friends = null,
    updateFriendRequest = null,
    invitesReceived,

    showInviteAlert,
    setShowInviteAlert }) => {



    return (

        <>
            <NavBarMain
                friendRequests={friendRequests}
                updateFriendRequest={updateFriendRequest}
                invitesReceived={invitesReceived}

                showInviteAlert={showInviteAlert}
                setShowInviteAlert={setShowInviteAlert}
            />
            
            
            <div className="container sm:px-16 max-w-5xl mx-auto">
                {children}


            </div>
        </>

    )
}

export default PageLayout