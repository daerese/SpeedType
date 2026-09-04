

using Microsoft.EntityFrameworkCore;
using webapi.Models.DatabaseModels;

/**
 * UserService.cs
 * 
 * This class is responsible for handling all user-related operations, including retrieving user information,
 * managing friends and friend requests, and updating user statistics. It acts as a service layer that interacts
 * with the UserRepository and GameResultRepository to perform these operations.
 * 
 * SIMPLE TERMS: This class is like a helper that directly talks to the database for anything related to users. 
 * It can get user info, manage friends, handle friend requests, and update user stats.
 *
 * It utilizes the methods defined in the repositories, i.e. UserReposiory.cs. 
 * 
 * Repository vs. Service: 
 * - Repository: Defines methods for interacting with the database (e.g., fetching user data, adding friends).
 * - Service: Calls these repository methods to perform higher-level operations (e.g., updating user stats after a game).
 *
 **/

public class UserService
{

    private readonly UserRepository _userRepository;

    private readonly GameResultRepository _gameResultRepository;

    public UserService(UserRepository userRepository, GameResultRepository gameResultRepository)
    {
        _userRepository = userRepository;
        _gameResultRepository = gameResultRepository;
    }

    // * Methods for getting the users
    public async Task<User> GetUserAsync(string userId)
    {
        /**
         * Returns a user object from the database
         * */ 

        return await _userRepository.GetUser(userId);
    }

    public async Task<User> GetPublicUser(string username)
    {
        return await _userRepository.GetPublicUser(username);
    }

    public async Task<List<GameResult>> GetGameResults(string userId, int? limit = null, int? offset = null)
    {
        /**
         * Returns the user's recent game results which includes 
         * individual stats from those games.
         * */

        return await _gameResultRepository.GetGameResults(userId, limit, offset);
    }

    public async Task<List<GameResult>> GetGameUsers(string gameId)
    {
        return await _gameResultRepository.GetGamePlayers(gameId);
    }

    public async Task AddGameResult(UserConnection currUser, DateTime startDate, string gameId)
    {
        /**
         * Adds a game result and update the user's statistics
         * */


        await _gameResultRepository.AddGameResult(currUser, startDate, gameId);

        await UpdateStats(currUser);
    }

    public async Task UpdateStats(UserConnection currUser)
    {

        /**
         * Update the user's overall statistics and upload to the database.
         * */

        List<GameResult> recentGames = await GetGameResults(currUser.UserId);

        // Update the user's average WPM and average Accuracy
        int wpmSum = 0;
        int accuracySum = 0;

        foreach (GameResult gameResult in recentGames)
        {
            wpmSum += gameResult.Wpm;
            accuracySum += gameResult.Accuracy;
        }

        int averageWpm = wpmSum / recentGames.Count;
        int averageAccuracy = accuracySum / recentGames.Count;

        await _userRepository.UpdateStats(currUser.UserId, averageWpm, averageAccuracy, currUser.FinalResults.FinalWpm);



    }

    public async Task UpdateUser(User updatedUserData)
    {
        /**
         * Updates the user's information, such as their bio and 
         * other information.
         * */

        await _userRepository.UpdateUser(updatedUserData);
    }

    /***********************
     * Friends and Friend Requests
     * */

    public async Task AddFriendRequest(FriendRequestUser fromUser, FriendRequestUser toUser)
    {
        await _userRepository.AddFriendRequest(fromUser, toUser);
    }

    public async Task UpdateFriendRequestStatus(int requestId, bool accepted)
    {
        /**
         * Determines whether the friend request should be accepted or rejected.
         * If accepted is true, they will be added as a friend. 
         * Either way, the friendRequest will be removed from the database
         * 
         * Params:
         * - requestId : str -- The id of the friend request in the database
         * - accepted : bool -- Determines if the friend request was accepted or 
         *                      rejected by the receiver
         * */

        if (accepted)
        {
            await _userRepository.AddFriend(requestId);
        }
        else
        {
            await _userRepository.RemoveFriendRequest(requestId);
        }



    }

    public async Task<List<Friend>> GetFriends(string userId)
    {
      
        List<Friend> friendsList = await _userRepository.GetFriends(userId);

        return friendsList;
    }

    public async Task<List<User>> GetFriendUsers(List<string> userIds)
    {
        /**
         * Returns a list of user objects from a users Friends list
         * */
       
        List<User> users = await _userRepository.GetFriendUsers(userIds);

        return users;

    }

    public async Task<List<FriendRequest>> GetFriendRequests(string userId)
    {

        List<FriendRequest> friendRequests = await _userRepository.GetFriendRequests(userId);

        return friendRequests;

    }

    public async Task<Friend> GetSingleFriend(string userId1, string userId2)
    {
        Friend newFriend = await _userRepository.GetSingleFriend(userId1, userId2);

        return newFriend;
    }
    
    public async Task<FriendRequest> GetSingleFriendRequest(string userId1, string userId2)
    {
        FriendRequest newRequest = await _userRepository.GetSingleFriendRequest(userId1, userId2);

        return newRequest;
    }
}
