import { callExternalApi } from "./external-api.service";
import axios from "axios"

//const apiServerUrl = process.env.REACT_APP_API_SERVER_URL;

const apiServerUrl = "https://localhost:7229"

//export const getPublicResource = async () => {
//    const config = {
//        url: `${apiServerUrl}/`,
//        method: "GET",
//        headers: {
//            "content-type": "application/json",
//        },
//    };

//    const { data, error } = await callExternalApi({ config });

//    return {
//        data: data || null,
//        error,
//    }; 
//};

export const testRoute = async () => {
    const config = {
        url: `${apiServerUrl}/api/user/test`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            //Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
}

export const testAuth = async (accessToken) => {

    const config = {
        url: `${apiServerUrl}/api/user/test-auth`,
        method: "GET",                                                                                                          
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };

}

/********************
 * Users
 */

/**
 * 2026: Gets the CURRENT logged-in user's latest data from the database.
 * The backend figures out who the user is from the access token, so no userId is sent.
 */
export const getCurrentUser = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/api/user/me`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};

/**
 * 2026: Creates the logged-in user's database profile on their first login.
 * The backend gets the user id and username from Auth0, so nothing is sent in the body.
 */
export const createCurrentUser = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/api/user/me`,
        method: "POST",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};

/**
 * 2026: Searches for players whose username starts with `query` (at least 2 characters).
 * Returns up to 10 players: [{ username, profilePicturePath, color }]
 */
export const searchUsers = async (accessToken, query) => {
    const config = {
        // * encodeURIComponent keeps spaces/symbols in the search text from breaking the URL
        url: `${apiServerUrl}/api/user/search?query=${encodeURIComponent(query)}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};

/**
 * 2026: Gets the logged-in user's friends, with who's online right now (online friends first).
 * Returns: [{ username, profilePicturePath, color, isOnline }]
 */
export const getMyFriends = async (accessToken) => {
    const config = {
        url: `${apiServerUrl}/api/user/friends`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};

export const getUser = async (accessToken, userId) => {
    const config = {
        url: `${apiServerUrl}/api/user/get-user?userId=${userId}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};

export const getPublicUser = async (accessToken, username) => {
    const config = {
        url: `${apiServerUrl}/api/user/get-public-user?username=${username}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};




/********************
 * Games and Game Results
 */

export const getRecentGames = async (accessToken, userId, page = 0) => {

    const config = {
        url: `${apiServerUrl}/api/user/get-recent-games?userId=${userId}&page=${page}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };


}

export const getGamePlayers = async (accessToken, gameId) => {

    const config = {
        url: `${apiServerUrl}/api/user/get-game-players?gameId=${gameId}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };


}


/********************
 * Friends and friend requests
 */
export const getFriendRequests = async (accessToken, userId) => {


    const config = {
        url: `${apiServerUrl}/api/user/get-recent-games?userId=${userId}&page=${page}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };

}

export const getFriends = async (accessToken, userId) => {

    const config = {
        url: `${apiServerUrl}/api/user/get-recent-games?userId=${userId}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };

}

export const getFriendObjects = async (accessToken, friendUserIds) => {

    //const dataToSend = {
    //    friendUserIds: friendUserIds
    //}

    //const userId = "12345678"

    console.log("User ids in getFriendObjects function: ", friendUserIds)

    const dataToSend = JSON.stringify(friendUserIds)

    console.log("User ids in JSON format: ", dataToSend)

    const config = {
        url: `${apiServerUrl}/api/user/get-friend-objects?userIds=${dataToSend}`,
        method: "GET",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };

}



export const updateUser = async (accessToken, updatedUserData) => {
    const config = {
        url: `${apiServerUrl}/api/user/update-user?userId=${updatedUserData.userId}`,
        method: "PUT",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        data: updatedUserData
    };

    const { data, error } = await callExternalApi({ config });

    return {
        data: data || null,
        error,
    };
};

export const updateUserMetadata = async (accessToken, userId, data) => {
    /**
     * Use the Auth0 Management API to change the user's metadata
     * @param {String} accessToken - The accessToken for the Auth0 Management API
     * @param {String} userId - The id of the user
     * @param {Object[String, any]} - An object with the data to be changed.
     */

    const dataToSend = JSON.stringify({
        "user_metadata": data
    });

    const config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: `https://dev-w5kn5y38eszy14v4.us.auth0.com/api/v2/users/${userId}`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        data: dataToSend
    }

    try {
        await axios.request(config)
    }
    catch (err) {
        console.log("Axios error: ", err)
    }
        

}

