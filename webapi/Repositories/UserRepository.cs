//namespace webapi.Repositories
//{
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks.Dataflow;
using webapi.Data;
using webapi.Migrations;
using webapi.Models.DatabaseModels;

/**
 * UserRepository.cs
 * 
 * This class is responsible for handling all database operations related to users, friends, and friend requests.
 * It provides methods to retrieve user information, manage friends and friend requests, and update user statistics.
 * 
 * SIMPLE TERMS: This class is like a helper that talks to the database for anything related to users. 
 * It can get user info, manage friends, handle friend requests, and update user stats.
 * 
 * It utilizes the database models I created, such as User, Friend, and FriendRequest.
 *
 *  Another important side note: The repositories define the methods for interacting
 *  with the databse. The services, i.e. UserService.cs, actually call these methods
 *  Its a "service". 
 **/

public class UserRepository
{
    private readonly TypeRacerContext _context;

    public UserRepository(TypeRacerContext context)
    {
        _context = context;
    }

    public async Task<User> GetUser(string userId)
    {
        // Use LINQ to query for a user based on the user ID
        return await _context.Users
            .Where(u => u.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task<User> GetPublicUser(string username)
    {
        return await _context.Users
            .Where(u => u.Username == username)
            .FirstOrDefaultAsync();
    }

    /***********************
     * Friends and Friend Requests
     * */

    public async Task<List<Friend>> GetFriends(string userId)
    {

        IEnumerable<Friend> friends = _context.Friends
                                                .Where(friend => friend.UserId1 == userId || friend.UserId2 == userId)
                                                .OrderBy(request => request.DateAccepted);

        return friends.ToList();

    }

    public async Task<List<User>> GetFriendUsers(List<string> userIds)
    {
        //IEnumerable<User> users = _context.Users.FindAsync(userIds);
        IEnumerable<User> users = _context.Users
                                            .Where(user => userIds.Contains(user.UserId));

        return users.ToList();

    }

    public async Task<List<FriendRequest>> GetFriendRequests(string userId1)
    {

        





        IEnumerable<FriendRequest> requests = _context.FriendRequests
                                                        .Where(request => request.ToUserId == userId1 || request.FromUserId == userId1)
                                                        .OrderByDescending(request => request.DateSent);

        return requests.ToList();

    }

    public async Task<FriendRequest> GetSingleFriendRequest(string userId1, string userId2)
    {

        /**
         * Returns a list of the friend requests both sent and receieved by the user
         * 
         * Parameters:
         * userId1 : string -- The user id to use to acquire the friend requests
         * - userId2 : string -- The second user id to match the friend request.
         * */

        return await _context.FriendRequests
                                        .Where(request => (request.ToUserId == userId1 || request.FromUserId == userId1) &&
                                                            (request.ToUserId == userId2 || request.FromUserId == userId2))
                                        .FirstOrDefaultAsync();

    }

    public async Task<Friend> GetSingleFriend(string userId1, string userId2)
    {

        /**
         * Returns a list of the friend requests both sent and receieved by the user
         * 
         * Parameters:
         * userId1 : string -- The user id to use to acquire the friend requests
         * - userId2 : string -- The second user id to match the friend request.
         * */

        return await _context.Friends
                                .Where(friend => (friend.UserId1 == userId1 || friend.UserId2 == userId1) &&
                                    (friend.UserId1 == userId2 || friend.UserId2 == userId2))
                                    .FirstOrDefaultAsync();
                         

    }

    public async Task AddFriendRequest(FriendRequestUser fromUser, FriendRequestUser toUser)
    {
        // * First ensure that a request hasn't already been sent.

        //List<FriendRequest> requests = await GetFriendRequests(fromUser.UserId);

        List<FriendRequest> requests = _context.FriendRequests
                                        .Where(request => fromUser.UserId == request.FromUserId || fromUser.UserId == request.ToUserId)
                                        .ToList();

        if (requests.Count == 0)
        {
            Console.WriteLine("Friend request hasn't been sent. Its null");
            FriendRequest friendRequest = new FriendRequest
                {
                    FromUserId = fromUser.UserId,
                    FromProfilePicturePath = fromUser.ProfilePicturePath,
                    FromUsername = fromUser.Username,
                    ToUserId = toUser.UserId,
                    ToProfilePicturePath = toUser.ProfilePicturePath,
                    ToUsername = toUser.Username,
                    DateSent = DateTime.Now.ToString()
                };

                _context.FriendRequests.Add(friendRequest);

                await _context.SaveChangesAsync();
        }
        else
        {

            Console.WriteLine("This method doesn't work for determining if a requests was sent");
        }



    }

    public async Task AddFriend(int requestId)
    {
        FriendRequest? request = _context.FriendRequests
                                        .Where(request => requestId == request.RequestId)
                                        .FirstOrDefault();

        if (request != null)
        {

            Friend newFriend = new Friend()
            {
                UserId1 = request.FromUserId,
                UserId2 = request.ToUserId,
                DateAccepted = DateTime.Now.ToString()
            };

            _context.Friends.Add(newFriend);

            Console.WriteLine("\nnew friend added, saving to database...\n");

            await RemoveFriendRequest(requestId, request);

            await _context.SaveChangesAsync();
        }

    }



    public async Task RemoveFriendRequest(int requestId, FriendRequest? requestObject=null)
    {


        FriendRequest? request = requestObject != null ?
            requestObject
            :
            _context.FriendRequests
            .Where(request => requestId == request.RequestId)
            .FirstOrDefault();
            


        if (request != null)
        {
            _context.Remove(request);
            await _context.SaveChangesAsync();
        }




    }



    public async Task RemoveFriend(int friendId)
    {

        Friend? friend = _context.Friends
                                .Where(friend => friend.FriendId == friendId)
                                .FirstOrDefault();      

        if (friend != null)
        {
            _context.Remove(friend);
            await _context.SaveChangesAsync();
        }

    }

    /***********************
     * Game Stats and User Info
     * */

    public async Task UpdateStats(string userId, int newAverageWpm, int newAverageAccuracy, int recentWpm)
    {

        /**
         * Update the user's overall statistics and upload to the database.
         * */

        var user = _context.Users.First(u => u.UserId == userId);

        // 1. Update the average WPM and average Accuracy.
        user.AverageWpm = newAverageWpm;
        user.AverageAccuracy = newAverageAccuracy;


        // 2. Increment their games played
        user.GamesPlayed += 1;

        // 3. Add their new best WPM if applicable
        if (user.BestWpm == null || recentWpm > user.BestWpm)
        {
            user.BestWpm = recentWpm;
        }

        await _context.SaveChangesAsync();

    }



    public async Task UpdateUser(User newUserData)
    {
        var user = _context.Users.First(u => u.UserId == newUserData.UserId);

        // * Update the new information IF not null

        if (newUserData.Bio != null)
        {
            user.Bio = newUserData.Bio;
        }

        if (newUserData.ProfilePicturePath != null)
        {
            user.ProfilePicturePath = newUserData.ProfilePicturePath;
        }

        if (newUserData.Color != null)
        {
            user.Color = newUserData.Color;
        }

        await _context.SaveChangesAsync();
    }

}
//}
