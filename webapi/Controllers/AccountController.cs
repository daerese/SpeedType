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

    // * 2026: Used to call Auth0's /userinfo endpoint when creating a new user
    private readonly IHttpClientFactory _httpClientFactory;

    private readonly IConfiguration _configuration;

    // * 2026: The live game data. Used to tell which friends are online right now.
    private readonly GameState _gameState;

    public AccountController(UserService userService, IHttpClientFactory httpClientFactory, IConfiguration configuration, GameState gameState)
    {
        _userService = userService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _gameState = gameState;
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

    /**
     * 2026: Creates the logged-in user's database row if they don't have one yet.
     * The frontend calls this when GET /me says "not found" (the user's first login).
     *
     * SIMPLE TERMS: "I just signed up. Please set up my TypeRacer profile."
     * - The user id comes from the login token (can't be faked).
     * - The username comes from Auth0 itself (the /userinfo endpoint), NOT from
     *   the browser, so users can't send whatever they want.
     *
     * This replaced the Auth0 "Post User Registration" Action, so Auth0 no longer
     * needs our database password.
     * */
    [HttpPost("me")]
    [Authorize]
    public async Task<IActionResult> CreateCurrentUser()
    {
        string? userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // * 1. Ask Auth0 who this user is, using the same login token they sent us
        string? desiredUsername = null;

        try
        {
            string domain = _configuration["Auth0:Domain"]!.Replace("https://", "").TrimEnd('/');

            HttpClient client = _httpClientFactory.CreateClient();

            var request = new HttpRequestMessage(HttpMethod.Get, $"https://{domain}/userinfo");
            request.Headers.TryAddWithoutValidation("Authorization", Request.Headers.Authorization.ToString());

            HttpResponseMessage response = await client.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                using var userInfo = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());

                // * nickname is the username they signed up with. Fall back to the start of their email.
                if (userInfo.RootElement.TryGetProperty("nickname", out var nickname))
                {
                    desiredUsername = nickname.GetString();
                }
                else if (userInfo.RootElement.TryGetProperty("email", out var email))
                {
                    desiredUsername = email.GetString()?.Split('@')[0];
                }
            }
            else
            {
                Console.WriteLine($"Auth0 /userinfo failed: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            // * If Auth0 can't be reached, CreateUser still works and uses a default username
            Console.WriteLine($"Auth0 /userinfo error: {ex.Message}");
        }

        // * 2. Create the row (or return the existing one if it was already created)
        User user = await _userService.CreateUser(userId, desiredUsername);

        return Ok(user);
    }

    /**
     * 2026: Searches for players by username (for adding friends).
     * EX: /api/user/search?query=yu  --> yuna, yuji
     *
     * - Needs at least 2 characters, and returns at most 10 players.
     * - Only returns what the search results show (username, avatar, color).
     * */
    [HttpGet("search")]
    [Authorize]
    public async Task<IActionResult> SearchUsers([FromQuery] string? query)
    {
        string? myUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(myUserId))
        {
            return Unauthorized();
        }

        query = query?.Trim();

        if (string.IsNullOrEmpty(query) || query.Length < 2)
        {
            return Ok(new List<object>());
        }

        List<User> users = await _userService.SearchUsers(query, myUserId);

        return Ok(users.Select(u => new
        {
            u.Username,
            u.ProfilePicturePath,
            u.Color
        }));
    }

    /**
     * 2026: Returns the logged-in user's friends, with whether each one is online right now.
     * Online friends come first. Used by the friends menu in the navbar.
     * */
    [HttpGet("friends")]
    [Authorize]
    public async Task<IActionResult> GetMyFriends()
    {
        string? myUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(myUserId))
        {
            return Unauthorized();
        }

        // * Each friendship stores two user ids. The one that isn't mine is my friend.
        List<string> friendIds = (await _userService.GetFriends(myUserId))
            .Select(friend => friend.UserId1 == myUserId ? friend.UserId2 : friend.UserId1)
            .ToList();

        List<User> friends = await _userService.GetFriendUsers(friendIds);

        return Ok(friends
            .Select(u => new
            {
                // * Needed to invite a friend to a private game
                u.UserId,
                u.Username,
                u.ProfilePicturePath,
                u.Color,
                // * "Online" = they currently have the game server connection open
                IsOnline = _gameState.ConnectionsByUserId.ContainsKey(u.UserId)
            })
            .OrderByDescending(friend => friend.IsOnline)
            .ThenBy(friend => friend.Username));
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
