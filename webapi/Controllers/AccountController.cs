using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Auth0.AspNetCore.Authentication;
using System.Diagnostics.Metrics;
using System.Net;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.OpenApi.Any;
using System.Text.Json.Serialization;
using Newtonsoft.Json;

/**
 * AccountController.cs
 * 
 * Controllers provide traditional HTTP REST API endpoints for the frontend to interact with. 
 * They handle incoming HTTP requests, process them, and return appropriate HTTP responses.
 * 
 * This class is responsible for handling all user-related API endpoints, including retrieving user information,
 * managing friends and friend requests, and updating user statistics. It acts as a controller layer that interacts
 * with the UserService to perform these operations.
 * 
 * SIMPLE TERMS: This class is like a helper that directly talks to the UserService
 * for anything related to users. It can get user info, manage friends, handle 
 * friend requests, and update user stats.
 * 
 * *****
 * What does [Authorize] mean?
 * It means the user must be logged in (authenticated) to access this route. 
 * If the user is not logged in, they will receive a 401 Unauthorized response.
 * 
 * HttpGet vs. HttpPost vs. HttpPut vs. HttpDelete:
 * - HttpGet: Used to retrieve data from the server. It should not change any data on the server.
 * - HttpPost: Used to send data to the server to create a new resource.
 * - HttpPut: Used to update an existing resource on the server.
 * - HttpDelete: Used to delete a resource from the server.
 *
 *
 *  What is an endpoint?
 *  An endpoint is a specific URL where an API can be accessed by a client application.
 **/

[ApiController]
[Route("api/user")]
public class AccountController : Controller
{

    private readonly UserService _userService;

    public AccountController(UserService userService)
    {
        _userService = userService;
    }

    /******************************
     * Test Routes for debugging and development
     * */

    [HttpGet("test")]
    public IActionResult Test()
    {
        var responseObject = new
        {
            Message = "This is a test route! NOT Authenticated",
            Status = "Success"
        };

        return Ok(responseObject);
    }

    [HttpGet("test-auth")]
    [Authorize]
    public IActionResult TestAuth()
    {

        var responseObject = new
        {
            Message = "This is a test route! You're Authenticated!",
            Status = "Success"
        };

        return Ok(responseObject);

    }


    /******************************
     * User Routes
     * */

    /**
     * 2026: Returns the CURRENT logged-in user's info from the database.
     *
     * SIMPLE TERMS: "Who am I, and what's my latest data?"
     * The frontend doesn't send a userId. The server reads it from the user's
     * Auth0 login token (the "sub" value), so a user can only ever get their own data.
     * This replaces reading stats/username/picture from the Auth0 custom claim,
     * which only updates when the user logs in again.
     * */
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        // * ASP.NET turns the token's "sub" (the Auth0 user id) into the NameIdentifier claim
        string? userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        User user = await _userService.GetUserAsync(userId);

        if (user == null)
        {
            return NotFound(new { Message = "No database user found for this account" });
        }

        return Ok(user);
    }

    [HttpGet("get-user")]
    [Authorize]
    public async Task<IActionResult> GetUser([FromQuery] string userId)
    {


        User user = await _userService.GetUserAsync(userId);


        var responseObject = new
        {
            Message = "Received userId: " + userId,
            Status = "Success",
            User = user
        };

        return Ok(responseObject);

    }

    [HttpGet("get-public-user")]
    [Authorize]
    public async Task<IActionResult> GetPublicUser([FromQuery] string username)
    {


        User user = await _userService.GetPublicUser(username);

        var responseObject = new
        {
            Message = "Received Username: " + username,
            Status = "Success",
            User = user
        };

        return Ok(responseObject);

    }


    [HttpPut("update-user")]
    [Authorize]
    public async Task<IActionResult> UpdateUser([FromQuery] string userId, 
                                                [FromBody] User updatedUser)
    {

        //User user = await _userService.GetUserAsync(userId);

        // * 2026 SECURITY FIX: Always update the LOGGED-IN user (from their token),
        // * never whatever userId the request sends. Otherwise anyone could edit anyone's profile.
        string? tokenUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(tokenUserId))
        {
            return Unauthorized();
        }

        updatedUser.UserId = tokenUserId;

        Console.WriteLine($"User bio: \n{updatedUser.Bio}");
        Console.WriteLine($"User color: \n{updatedUser.Color}");
        Console.WriteLine($"User picture: \n{updatedUser.ProfilePicturePath}");

        await _userService.UpdateUser(updatedUser);

        var responseObject = new
        {
            Message = "Received userId: " + userId,
            Status = "Success",
            //User = user
        };

        return Ok(responseObject);
    }

    /******************************
     * Game Results routes
     * */

    [HttpGet("get-recent-games")]
    [Authorize]
    public async Task<IActionResult> GetRecentGames([FromQuery] string userId,
                                                    [FromQuery] int page)
    {


        int limit = 10;

        int offset = page * 10;

        List<GameResult> recentGames = await _userService.GetGameResults(userId, limit, offset);

        var responseObject = new
        {
            GameResults = recentGames
        };

        return Ok(responseObject);


    }

    [HttpGet("get-game-players")]
    [Authorize]
    public async Task<IActionResult> GetGamePlayers([FromQuery] string gameId)
    {

        List<GameResult> gamePlayers = await _userService.GetGameUsers(gameId);

        foreach(var gamePlayer in gamePlayers)
        {
            Console.WriteLine($"Player name: {gamePlayer.Username}");
        }

        var responseObject = new
        {
            GamePlayers = gamePlayers
        };

        return Ok(responseObject);

    }

    /******************************
     * Friends routes
     * */

    [HttpGet("get-friend-objects")]
    [Authorize]
    public async Task<IActionResult> GetFriendObjects([FromQuery] string userIds)
    {

        List<string> userIdsList = JsonConvert.DeserializeObject<List<string>>(userIds);

        Console.WriteLine("List received: " + userIds);

        foreach (string userId in userIdsList)
        {
            Console.WriteLine($"The user id: {userId}");
        }


        List<User> userObjects = await _userService.GetFriendUsers(userIdsList);
        

        var responseObject = new
        {
            FriendUserObjects = userObjects,
        };

        return Ok(responseObject);
    }

    //[HttpGet("get-friend-objects")]
    //[Authorize]
    //public async Task<IActionResult> GetFriendObjects([FromQuery] List<string> )
    //{
    //    //List<User> friendUserObjs = await _userService.GetFriendUsers(friendUserIds);

    //    //foreach (string id in friendUserIds)
    //    //{

    //    //    Console.WriteLine($"The id sent: {id}");

    //    //}

    //    //Console.WriteLine("Friends list received: ", friendUserIds);

    //    //Console.WriteLine("User id received: ", userId);

    //    //Console.WriteLine(friendUserIds[0]);


    //    //Console.WriteLine("List received: " + friendUserIds);

    //    Console.WriteLine("\nFriend object function called");
    //    var responseObject = new
    //    {
    //        //FriendUserObjects = friendUserObjs
    //        FriendUserObjects = ""
    //    };

    //    return Ok(responseObject);
    //}

    //[HttpGet("get-friends")]
    //[Authorize]
    //public async Task<IActionResult> GetFriends([FromQuery] string userId)
    //{

    //}

    //[HttpGet("get-friend-requests")]
    //[Authorize]
    //public async Task<IActionResult> GetFriendRequests([FromQuery] string userId)
    //{

    //}

}
