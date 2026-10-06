//namespace webapi.Hubs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Timers;
using webapi.Models;
using webapi.Models.DatabaseModels;
using webapi.Utils;

/**
 * GameHub.cs
 * 
 * This class is responsible for handling all real-time game-related operations, including managing game rooms,
 * user connections, and game state updates. It acts as a hub layer that interacts with the UserService to perform these operations.
 * 
 * SIMPLE TERMS: This class is like a helper that directly talks to the UserService
 * for anything related to real-time games. It can manage game rooms, user connections, and game state updates.
 *
 * [Authorize] means the user must be logged in (authenticated) to access this hub. 
 * If the user is not logged in, they will receive a 401 Unauthorized response.
 * 
 * THE TYPICAL GAME FLOW:
 * 1. User authenticates through Auth0 and receives a JWT token.
 * 2. React (the frontend) establishes a connection to the GameHub using SignalR, 
 *      passing the JWT token for authentication.
 * 3. InitConnection --> The client calls InitConnection to initialize the user's 
 * connection and retrieve their information. Including their friends, friend requests, and game invites.
 * 4. Find/Create a room --> The player can then find or create a game room (GameRoom model).
 * Players are added to the room and to the appropriate SignalR group (roomId)
 * 5. Pre-game timer --> Once enough players have joined (minimum of 2), the pre-game timer starts. 
 * 6. Game Start --> Once the pre-game timer ends, the game officially starts. And
 * the game timer starts. The hub begins broadcasting game-state information to the 
 * connected players.
 * 7. Players type --> As players type, React frontend sends updates here to the hub.
 *      - EX: UpdateProgress, UpdateWpm, UpdateAccuracy, etc.
 * 8. Player finishes --> When a player finishes, the GameHub calculates their final results. 
 *      - Those results are added to the database via UserService.cs (UserService.AddGameResult(gameResult object))
 * 9. Game Ends --> The hub determines when the race is finished and broadcasts the 
 * final results to all players. The game room is then disposed of and removed from memory.
 **/

[Authorize]
public class GameHub : Hub
{


    
    // Stores --> Context.ConnectionId: userConnection object 
    private readonly IDictionary<string, UserConnection> _connections;

    // Stores --> UserId: userConnection object
    private readonly IDictionary<string, UserConnection> _connectionsUserId;
    
    // Stores --> roomId: gameRoom object
    private readonly IDictionary<string, GameRoom> _gameRooms;

    // Stores --> roomId: timer object for the game
    private IDictionary<string, System.Timers.Timer> _gameTimers;

    // Stores --> roomId: timer object for the game
    private IDictionary<string, System.Timers.Timer> _preGameTimers;

    // Stores --> UserIdSender: InviteSender
    private IDictionary<string, InviteSender> _gameInviteSenders;

    // Stores --> UserIdReceiver: Dict(SenderUserId, InviteReceived object)
    private IDictionary<string, Dictionary<string, InviteReceived>> _gameInviteReceivers;

    private readonly IHubContext<GameHub> _hubContext;

    private string[] paragraphs;

    private readonly UserService _userService;

    



    // Class instatiation method
    // * 2026: All the live game data now comes from one shared GameState object (see GameState.cs)
    public GameHub(GameState gameState,
                    IHubContext<GameHub> hubContext,
                    UserService userService)
    {
        _connections = gameState.Connections;
        _connectionsUserId = gameState.ConnectionsByUserId;
        _gameRooms = gameState.GameRooms;

        _gameTimers = gameState.GameTimers;
        _preGameTimers = gameState.PreGameTimers;

        _gameInviteSenders = gameState.InviteSenders;
        _gameInviteReceivers = gameState.InviteReceivers;

        paragraphs = new string[] {
            //"Cats, with their regal charm and independent spirit, should rule over humans. Their graceful presence and soothing purrs would create a peaceful, utopian world.",
            //"This is a temporary paragraph. Now, why is that exactly? Well the truth is, I am too lazy to make a full one. So buzz off chump.",
            "sheet cause shave straw terrible cut value new shoe feet jump wound",
            "a very short paragraph"
        };

        _hubContext = hubContext;
        _userService = userService;
    }


    //public async Task InitConnection(UserConnection userConnection)
    //{
    //    /**
    //     * The purpose of this function is to initialize the connection of a user when they first connect to the hub.
    //     */

    //    try
    //    {
    //        if (!_connections.ContainsKey(Context.ConnectionId))
    //        {

    //            var user = await _userService.GetUserAsync(userConnection.UserId);

    //            userConnection.AverageWpm = user.AverageWpm;
    //            userConnection.Color = user.Color;
    //            userConnection.Username = user.Username;
    //            userConnection.ProfileImg = user.ProfilePicturePath;
    //            userConnection.ConnectionId = Context.ConnectionId;


    //            _connections[Context.ConnectionId] = userConnection;
    //            _connectionsUserId[userConnection.UserId] = userConnection;
    //        }

    //        await GetFriendRequests(userConnection.UserId);
    //        await GetFriends(userConnection.UserId);

    //        // * Get games this player was invited to if applicable
    //        await GetInvitesReceived(userConnection.UserId);

    //        Console.WriteLine("The new/existing user connection : " + userConnection.Username);

    //    }
    //    catch (Exception ex)
    //    {
    //        Console.WriteLine($"ERROR in InitConnection: {ex.Message}");
    //        Console.WriteLine($"STACK: {ex.StackTrace}");
    //        throw;
    //    }

    //}

    /****************
     * 2026 SECURITY: Helpers for knowing WHO is calling the hub.
     *
     * SIMPLE TERMS: Never trust a user id that the browser sends us. Anyone can edit
     * what their browser sends. Instead, we use the id from their Auth0 login token,
     * which can't be faked.
     *
     * NOTE: Only PUBLIC methods can be called by browsers. Everything the browser
     * shouldn't call directly (creating rooms, ending games, etc.) is PRIVATE.
     * *******************/

    // The Auth0 user id ("sub") from the caller's login token
    private string? CurrentUserId => Context.UserIdentifier;

    // Highest WPM we accept. Anything faster is treated as cheating.
    private const int MaxWpm = 250;

    // 2026: Most players allowed in one room (the game screen has space for 5)
    private const int MaxPlayersPerRoom = 5;

    // The caller's UserConnection (created in InitConnection), or null if they haven't initialized
    private UserConnection? GetCurrentConnection()
    {
        return _connections.TryGetValue(Context.ConnectionId, out UserConnection? userConnection) ? userConnection : null;
    }

    // The room the caller is playing in, but ONLY if they're actually in it
    private GameRoom? GetCallersRoom(string roomId)
    {
        if (roomId != null &&
            _gameRooms.TryGetValue(roomId, out GameRoom? gameRoom) &&
            gameRoom.Connections.ContainsKey(Context.ConnectionId))
        {
            return gameRoom;
        }

        return null;
    }

    // Is the caller the host of this private game?
    private bool IsCallerHost(GameRoom gameRoom)
    {
        UserConnection? caller = GetCurrentConnection();

        return caller != null &&
            gameRoom.IsPrivateGame &&
            gameRoom.Connections.ContainsKey(Context.ConnectionId) &&
            gameRoom.PrivateGameHostUsername == caller.Username;
    }

    /****************
     * Intializing the connection to the hub
     * *******************/

    public async Task InitConnection(UserConnection userConnection)
    {
        try
        {
            // * 2026 SECURITY: The user id comes from the login token, NOT from what the browser sent
            string? tokenUserId = CurrentUserId;

            if (string.IsNullOrEmpty(tokenUserId))
            {
                throw new HubException("You must be logged in.");
            }

            userConnection ??= new UserConnection();
            userConnection.UserId = tokenUserId;

            if (!_connections.ContainsKey(Context.ConnectionId))
            {
                Console.WriteLine($"DEBUG: Attempting to get user with UserId: {userConnection.UserId}");

                var user = await _userService.GetUserAsync(userConnection.UserId);

                // ✅ ADD THIS: Check if user is null
                if (user == null)
                {
                    Console.WriteLine($"ERROR: User not found for UserId: {userConnection.UserId}");
                    throw new InvalidOperationException($"User with ID '{userConnection.UserId}' was not found in the database");
                }

                Console.WriteLine($"DEBUG: User found - Username: {user.Username}");

                userConnection.AverageWpm = user.AverageWpm;
                userConnection.Color = user.Color;
                userConnection.Username = user.Username;
                userConnection.ProfileImg = user.ProfilePicturePath;
                userConnection.ConnectionId = Context.ConnectionId;

                _connections[Context.ConnectionId] = userConnection;
                _connectionsUserId[userConnection.UserId] = userConnection;
            }

            await GetFriendRequests(userConnection.UserId);
            await GetFriends(userConnection.UserId);
            await GetInvitesReceived(userConnection.UserId);

            Console.WriteLine("The new/existing user connection : " + userConnection.Username);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR in InitConnection: {ex.Message}");
            Console.WriteLine($"STACK: {ex.StackTrace}");
            throw;
        }
    }

    /***************
     * Game Room Related functions (EX: Join, Create, Join private, create private)
     * ***************/

    // * 2026: PRIVATE so browsers can't join any room they want. Only FindRoom uses it.
    private async Task JoinRoom(UserConnection userConnection)
    {

        // When someone joins a room --> Add user to the group (room)

        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.RoomId);

        if (_gameRooms.TryGetValue(userConnection.RoomId, out GameRoom gameRoom))
        {

            // Add the user if they're not already connected
            if (!_connections.ContainsKey(Context.ConnectionId))
            {
                _connections[Context.ConnectionId] = userConnection;
            }

            // * Using [] instead of .Add() so joining twice doesn't crash
            gameRoom.Connections[Context.ConnectionId] = userConnection;

            gameRoom.ClientUserObjects[userConnection.Username] = userConnection;



            // If a player has joined, the pre game timer can be started IF not already started...
            if (gameRoom.Waiting)
            {
                if (gameRoom.Connections.Count > 1)
                {

                    Console.WriteLine("Starting the Pregame");

                    await StartPreGameInternal(gameRoom.RoomId);
                    return;
                    
                }
            }

            await SendGameRoom(gameRoom);

        }
        //else
        //{
        //    // If the room doesn't exist, a new room will be created.
        //    await CreateRoom(userConnection);
        //}

    }



    // Utility --> Select a random paragraph
    private string RandomParagraph()
    {
        Random random = new Random();
        return paragraphs[random.Next(paragraphs.Length)];
        
    }

    private Task SendGameRoom(GameRoom gameRoom, IHubContext<GameHub>? hubContext = null)
    {
        //return Clients.Group(gameRoom.Link).SendAsync("ReceiveGameRoom", gameRoom);

        //Console.WriteLine("Sending the gameRoom...");

        Dictionary<string, object> gameRoomObject = new Dictionary<string, object>()
            {
                {"roomId", gameRoom.RoomId},
                //{"roomName", gameRoom.RoomName},
                {"paragraph", gameRoom.Paragraph},
                {"users", gameRoom.ClientUserObjects},
                {"time", gameRoom.Time},
                {"preGameTimer", gameRoom.PreGameTimer},
                {"running", gameRoom.Running },
                {"gameOver", gameRoom.GameOver },
                {"waiting", gameRoom.Waiting },
                {"isPreGame", gameRoom.IsPreGame },
                {"isPrivateGame", gameRoom.IsPrivateGame }
            };

        if (gameRoom.IsPrivateGame && gameRoom.PrivateGameHostUsername != null)
        {

            //Console.WriteLine("This game is private. Adding the username of the host");

            gameRoomObject.Add("privateGameHostUsername", gameRoom.PrivateGameHostUsername);

        }

        if (hubContext == null)
        {

            return Clients.Group(gameRoom.RoomId).SendAsync("ReceiveGameRoom", gameRoomObject);

            
        }

        else
        {
            return _hubContext.Clients.Group(gameRoom.RoomId).SendAsync("ReceiveGameRoom", gameRoomObject);
        }

    }

    // * 2026: PRIVATE so browsers can't create rooms with made-up player info. Only FindRoom uses it.
    private async Task CreateRoom(UserConnection userConnection)
    {

        // Acquire the user's color from the database
        //var user = await _userService.GetUserAsync(userConnection.UserId);
        //userConnection.Color = user.Color;

        Console.WriteLine($"CREATE ROOM Connection ID: {Context.ConnectionId}");

        // Generate a room Id
        userConnection.RoomId = GenerateUniqueRoomId();

        Console.WriteLine(userConnection);

        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.RoomId);


        // * Create a paragraph for the game session
        ParagraphGenerator paragraphGenerator = new ParagraphGenerator();

        string newParagraph = paragraphGenerator.generate();

        GameRoom currentGameRoom = new GameRoom
        {
            RoomId = userConnection.RoomId,
            //RoomName = userConnection.RoomName,
            //Paragraph = RandomParagraph(),
            Paragraph = newParagraph,
            // * 2026: Thread-safe dictionaries, because timers read these while players join/leave
            Connections = new System.Collections.Concurrent.ConcurrentDictionary<string, UserConnection>()
            {
                [Context.ConnectionId] = userConnection
            },
            ClientUserObjects = new System.Collections.Concurrent.ConcurrentDictionary<string, UserConnection>()
            {
                [userConnection.Username] = userConnection
            },
            Running = false,
            Time = new Time { CurrentTime=90, TimePassed=0, StartTime=0 },
            WpmRange = userConnection.AverageWpm != null ? GetWpmRange((int) userConnection.AverageWpm) : null,
            
            // Two new properties
            Waiting = true,
            PreGameTimer = new Time { CurrentTime = 10, TimePassed=0, StartTime=0 },
            PlayerCount = 0
            
        };

        Console.WriteLine($"The game room being created: \n{currentGameRoom}");


        _gameRooms[userConnection.RoomId] = currentGameRoom;

        if (!_connections.ContainsKey(Context.ConnectionId))
        {
            _connections[Context.ConnectionId] = userConnection;
        }


        //Console.WriteLine("The placements at the start: " + currentGameRoom.Placements);
        
        await SendGameRoom(currentGameRoom);


        await Clients.Group(userConnection.RoomId).SendAsync("ReceiveMessage",
            $"{userConnection.Username} has joined the game (ROOM ID: {userConnection.RoomName})");
    }

    public async Task CreatePrivateRoom()
    {
        /**
         * 1. Get the connection Id
         * 2. Use the connection Id to find the userConnection object
         * 3. Create a gameRoom that's private, be sure to create and store a Link
         * 4. Send the PRIVATE gameRoom
         * */

        Console.WriteLine("Creating private game room");

        // 1. Get the connection id and find the userConnection
        string connectionId = Context.ConnectionId;


        if (_connections.TryGetValue(connectionId, out UserConnection userConnection))
        {
            userConnection.RoomId = GenerateUniqueRoomId();

            // 3. Create a private gameRoom and store it 
            GameRoom currentGameRoom = new GameRoom 
            { 
                RoomId = userConnection.RoomId, 
                Paragraph = new ParagraphGenerator().generate(), 
                // * 2026: Thread-safe dictionaries, because timers read these while players join/leave
                Connections = new System.Collections.Concurrent.ConcurrentDictionary<string, UserConnection>()
                {
                    [connectionId] = userConnection
                },
                ClientUserObjects = new System.Collections.Concurrent.ConcurrentDictionary<string, UserConnection>()
                {
                    [userConnection.Username] = userConnection
                }, 
                Running = false, 
                Time = new Time { CurrentTime = 90, TimePassed = 0, StartTime = 0 },
                Waiting = true, 
                PreGameTimer = new Time { CurrentTime = 10, TimePassed = 0, StartTime = 0 }, 
                PlayerCount = 0,
                IsPrivateGame = true, 
                PrivateGameHostUsername = userConnection.Username,
            };
            
            await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.RoomId);

            //_privateGameRooms[userConnection.Link] = currentGameRoom;
            _gameRooms[userConnection.RoomId] = currentGameRoom;

            // * 2026: New room, so the host starts with an empty "invites sent" list
            _gameInviteSenders.Remove(userConnection.UserId);
            await Clients.Caller.SendAsync("GetInvitesSent", new Dictionary<string, bool>());


            // 3. Send the private gameRoom
            await SendGameRoom(currentGameRoom);


            await Clients.Group(userConnection.RoomId).SendAsync("ReceiveMessage",
                $"{userConnection.Username} has joined the game (ROOM ID: {userConnection.RoomName})");
        }


    } 

    public async Task JoinPrivateRoom(string roomId)
    {
        /**
         * Method that allows a player to join an already existing private game
         * */


        Console.WriteLine("Attempting to join Private game. RoomID: \n" + roomId + "\n");

        bool isJoinable = false;

        // 0. Acquire the current user's information
        UserConnection? userConnection = GetCurrentConnection();

        if (userConnection == null)
        {
            throw new HubException("Connection not initialized.");
        }


        // 0a. Ensure that the private game is joinable
        GameRoom? currentGameRoom = null;

        if (roomId != null && _gameRooms.TryGetValue(roomId, out currentGameRoom))
        {

            // ? Check the state of the gameRoom and ensure that it isn't in progress (or full).
            // * 2026: Already in this room (EX: refreshed the page)? Also fine.
            isJoinable = IsJoinablePrivateRoom(currentGameRoom) ||
                         (currentGameRoom.IsPrivateGame && currentGameRoom.Connections.ContainsKey(Context.ConnectionId));

        }


        if (isJoinable)
        {
            Console.WriteLine("Private game found. Joining... \n");

            // 1. Add the user to the group first
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);


            // 1a. Add the roomId to the user's userConnection object
            userConnection.RoomId = currentGameRoom.RoomId;

            // 1b. Add the user to the game room
            // * 2026: [] instead of .Add() so joining twice doesn't crash
            currentGameRoom.Connections[Context.ConnectionId] = userConnection;

            currentGameRoom.ClientUserObjects[userConnection.Username] = userConnection;

            // 1c. Remove the invite for this room from the receiver's invites (if they had one).
            // * 2026 FIX: invites are stored by the SENDER's user id, not the room id,
            // * and players joining from a link may have no invites at all (that used to crash).
            string userId = userConnection.UserId;

            if (_gameInviteReceivers.TryGetValue(userId, out Dictionary<string, InviteReceived>? invites))
            {
                lock (invites)
                {
                    foreach (string senderId in invites.Where(invite => invite.Value.RoomId == roomId).Select(invite => invite.Key).ToList())
                    {
                        invites.Remove(senderId);
                    }
                }
            }

            // * 2026: Update their invites menu, and if the room is now full, everyone else's invites too
            await PushInvitesToUser(userId);

            if (currentGameRoom.Connections.Count >= MaxPlayersPerRoom)
            {
                await RefreshInvitesForRoom(roomId);
            }


            // 2. Send the gameRoom to the group
            await SendGameRoom(currentGameRoom);


            // 3. Notify the fronend that a game was found
            await Clients.Client(Context.ConnectionId).SendAsync("PrivateGameFound", true);



        }

        else
        {
            Console.WriteLine("Private game NOT found or not joinable");

            // Invoke a method on the frontend that notifies the user that a game wasn't found.
            await Clients.Client(Context.ConnectionId).SendAsync("PrivateGameFound", false);

        }

    }

    public async Task FindRoom(UserConnection userConnection)
    {
        // * 2026 SECURITY: Ignore the player info the browser sent. Use the server's own copy
        // * (created in InitConnection from the login token and the database).
        UserConnection? storedConnection = GetCurrentConnection();

        if (storedConnection == null)
        {
            throw new HubException("Connection not initialized.");
        }

        userConnection = storedConnection;

        Console.WriteLine($"FINDROOM CALLED. User: {userConnection.Username}, Rooms in memory: {_gameRooms.Count}");

        // * Get their LATEST average WPM from the database (it may have changed since they connected)
        var user = await _userService.GetUserAsync(userConnection.UserId);

        userConnection.AverageWpm = user?.AverageWpm;

        // * - Remove the user from their previous game if they're still in it. THEN find a new game
        // * (This also deletes the old room if they were the last one in it.)
        await RemoveFromCurrentRoom(userConnection);

        // * Reset the player's race values before joining a new game
        userConnection.Accuracy = 0;
        userConnection.Finished = false;
        userConnection.Progress = 0;
        userConnection.Wpm = 0;
        userConnection.FinalResults = null;

        bool hasAverageWpm = user?.AverageWpm != null;

        Console.WriteLine($"FINDROOM Connection ID: {Context.ConnectionId}");

        if (_gameRooms.Count > 0)
        {
            // If they don't have an averageWPM yet, (they haven't played their first game)
            // Join them to a random game

            // Loop and find a game within the range if there are games
            foreach (GameRoom gameRoom in _gameRooms.Values)
            {

                Console.WriteLine("FOUND A GAME, CHECKING");

                // Make sure the game hasn't started, isn't private, and isn't full (2026)
                if (!gameRoom.Running && !gameRoom.GameOver && !gameRoom.IsPrivateGame &&
                    gameRoom.Connections.Count < MaxPlayersPerRoom)
                {

                    // Does their average WPM fall in the range of this game?
                    if (hasAverageWpm)
                    {
                        // Inclusive (>= and <=) so a player on the edge of the range can still join.
                        // EX: new players have 0 WPM and the range is (0, 30). With > instead of >=, 0 would be rejected.
                        // A room with no WPM range accepts anyone.
                        if (gameRoom.WpmRange == null ||
                            (userConnection.AverageWpm >= gameRoom.WpmRange.Item1 &&
                             userConnection.AverageWpm <= gameRoom.WpmRange.Item2))
                        {

                            userConnection.RoomId = gameRoom.RoomId;

                            Console.WriteLine("Game within WPM range, joining...");
                            await JoinRoom(userConnection);
                            //break;
                            return;
                        }

                        else
                        {
                            Console.WriteLine("Game not within range");
                        }

                        //userConnection.RoomId = gameRoom.RoomId;

                        //await JoinRoom(userConnection);
                        //return;

                    }
                    // If they don't have an average WPM yet, then just join the game.
                    else
                    {
                        userConnection.RoomId = gameRoom.RoomId;

                        Console.WriteLine("No average WPM to range. Joining anyways...");
                        await JoinRoom(userConnection);
                        //break;
                        return;
                    }

                }

                else
                {
                    Console.WriteLine("this game is already in progress or over");
                }


            }

        }

        // If a game hasn't been found. Then create a game

        Console.WriteLine("No games found, Creating a game");
        await CreateRoom(userConnection);


    }




    private Tuple<int, int> GetWpmRange(int averageWpm)
    {
        /**
         * Returns a range value based on the user's WPM range.
         * This value will be used to determine the average WPM range that 
         * other players must fall within in order to join.
         * */


        //int multiple = averageWpm / 30;

        //int lower = 30 * multiple;

        //int upper = lower + 29;


        int lower = averageWpm < 30 ? 0 : averageWpm - 30;

        int upper = averageWpm + 30;


        return new Tuple<int, int>(lower, upper);

    }

    public async Task LeaveRoom()
    {
        UserConnection? userConnection = GetCurrentConnection();

        if (userConnection != null)
        {
            await RemoveFromCurrentRoom(userConnection);
        }
    }

    /**
     * 2026: Safely removes the caller from the room they're in.
     * Used by LeaveRoom, OnDisconnectedAsync (closing the tab) and FindRoom (finding a new game).
     *
     * SIMPLE TERMS: "This player left. Take them out of their room, and clean up the room if needed."
     * - Never crashes if the room is already gone or they weren't in it.
     * - Deletes the room (and its timers) when the last player leaves.
     * - Ends the race early if everyone still in it has already finished.
     * */
    private async Task RemoveFromCurrentRoom(UserConnection userConnection)
    {
        string? roomId = userConnection.RoomId;

        userConnection.RoomId = null;

        if (roomId == null || !_gameRooms.TryGetValue(roomId, out GameRoom? currRoom))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

        // * Not in this room? Nothing to do.
        if (!currRoom.Connections.Remove(Context.ConnectionId))
        {
            return;
        }

        // * Players who already finished a public race stay on the results board.
        // * Everyone else is removed (private games always remove, so others can tell the host left).
        if (!userConnection.Finished || currRoom.IsPrivateGame)
        {
            currRoom.ClientUserObjects.Remove(userConnection.Username);
        }

        // * Was that the last player? Delete the room and its timers.
        if (currRoom.Connections.Count == 0)
        {
            await DisposeGame(currRoom);
            return;
        }

        // * 2026: Update invites to this private game (EX: the host left, so they can't be used anymore)
        if (currRoom.IsPrivateGame)
        {
            await RefreshInvitesForRoom(roomId);
        }

        // * If everyone left in the race has finished, end it now instead of waiting for the timer
        if (currRoom.Running && currRoom.ClientUserObjects.Values.All(player => player.FinalResults != null))
        {
            await EndGame(currRoom);
        }
        else
        {
            await SendGameRoom(currRoom);
        }

        await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{userConnection.Username} has left the game");
    }

    /**
     * Utility function that allows the frontend to get all active games.
     * 2026: PRIVATE. It sends every room (including other players' connection ids),
     * and the frontend doesn't use it.
     * *******/

    private async Task GetActiveGames()
    {
        //await Clients.Group().SendAsync("ReceiveMessage")

        await Clients.Client(Context.ConnectionId).SendAsync("ReceiveActiveGames", _gameRooms);
    }

    /**
     * Utility --> Generate a unique room ID for each game room. 
     * This ID is used to identify the game room and allow players to join it.
     * **/

    private string GenerateUniqueRoomId()
    {
        // Generate a random string
        //string randomString = Guid.NewGuid().ToString().Substring(0, 10);
        string randomString = Guid.NewGuid().ToString();

        // Get the current timestamp
        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Combine the random string and timestamp to create the Link
        return $"{randomString}-{timestamp}";
    }

    //public override async Task OnConnectedAsync()
    //{

    //}

    //This is a method that is automaticlaly called when a user disconnects from a group
    //We're overriding it to customize what happens...
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out UserConnection? userConnection))
        {
            // * Take them out of their room (if any). Errors here must not stop the cleanup below.
            try
            {
                await RemoveFromCurrentRoom(userConnection);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR removing {userConnection.Username} from their room: {ex.Message}");
            }

            Console.WriteLine($"{userConnection.Username} has disconnected. Removing them");

            // Remove the user from the connections
            _connections.Remove(Context.ConnectionId);

            // * Only remove the user id lookup if it belongs to THIS connection.
            // * (They may still have another tab open with a newer connection.)
            if (_connectionsUserId.TryGetValue(userConnection.UserId, out UserConnection? byUserId) &&
                byUserId.ConnectionId == Context.ConnectionId)
            {
                _connectionsUserId.Remove(userConnection.UserId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"User, connected. ID: {Context.ConnectionId}");

        //if (!_connections.ContainsKey(Context.ConnectionId))
        //{
        //    _connections[Context.ConnectionId] = new UserConnection();
        //}
    }

    /***********************************************
     * Game state Update functions
     *********************************************/
    /**
     * 2026 SECURITY: These three methods only accept updates from a player who is
     * actually IN that room, while its race is running. Values are kept within
     * sensible limits so nobody can send fake numbers (EX: 9999 WPM).
     * */
    public async Task UpdateProgress(double progress, string roomId)
    {
        GameRoom? currRoom = GetCallersRoom(roomId);

        if (currRoom == null || !currRoom.Running)
        {
            return;
        }

        UserConnection currUser = currRoom.Connections[Context.ConnectionId];

        // * Once a player has finished, ignore any more progress updates from them
        if (currUser.Finished)
        {
            return;
        }

        progress = Math.Clamp(progress, 0, 1);

        if (progress >= 1)
        {
            // * The SERVER calculates the final WPM from the paragraph length and race time,
            // * so a player can't just claim a high score. (1 "word" = 5 characters)
            double minutesElapsed = (DateTime.Now.Ticks - currRoom.Time.StartTime) / (double)TimeSpan.TicksPerMinute;

            double serverWpm = (currRoom.Paragraph.Length / 5.0) / Math.Max(minutesElapsed, 0.001);

            if (serverWpm > MaxWpm)
            {
                // * Impossibly fast. Don't accept the finish.
                Console.WriteLine($"Rejected finish from {currUser.Username}: {serverWpm:0} WPM is not realistic");
                return;
            }

            currUser.Progress = 1;
            currUser.Wpm = (int)Math.Round(serverWpm);

            // ? FinishPlayer will send the gameRoom in its own modified way.
            await FinishPlayer(currRoom, currUser);
        }
        else
        {
            currUser.Progress = progress;
        }

        await SendGameRoom(currRoom);
    }

    public async Task UpdateWpm(int wpm, string roomId)
    {
        GameRoom? currRoom = GetCallersRoom(roomId);

        if (currRoom == null || !currRoom.Running)
        {
            return;
        }

        UserConnection currUser = currRoom.Connections[Context.ConnectionId];

        // * The live WPM is only for display. The final WPM is calculated by the server in UpdateProgress.
        if (!currUser.Finished)
        {
            currUser.Wpm = Math.Clamp(wpm, 0, MaxWpm);
        }

        await SendGameRoom(currRoom);
    }

    public async Task UpdateAccuracy(int accuracy, string roomId)
    {
        GameRoom? currRoom = GetCallersRoom(roomId);

        if (currRoom == null || !currRoom.Running)
        {
            return;
        }

        UserConnection currUser = currRoom.Connections[Context.ConnectionId];

        if (!currUser.Finished)
        {
            currUser.Accuracy = Math.Clamp(accuracy, 0, 100);
        }

        await SendGameRoom(currRoom);
    }

    /***********************************************
     * Starting and Ending the game
     *********************************************/

    /**
     * Called by the HOST of a private game when they click "Start Game".
     * 2026 SECURITY: Only the host can start their own private game, and only before it starts.
     * */
    public async Task StartPreGame(string roomId)
    {
        GameRoom? gameRoom = GetCallersRoom(roomId);

        if (gameRoom == null || !IsCallerHost(gameRoom) || gameRoom.Running || gameRoom.IsPreGame)
        {
            return;
        }

        await StartPreGameInternal(roomId);
    }

    private async Task StartPreGameInternal(string roomId)
    {
        /**
         * Starts the pre game timer to prepare the players for the actual game start
         * */

        Console.WriteLine("Passed room id to StartPreGame" + roomId);

        if (_gameRooms.TryGetValue(roomId, out GameRoom gameRoom))
        {

            Console.WriteLine("Found a game room in StartPreGame");
            gameRoom.Waiting = false;

            gameRoom.IsPreGame = true;

            Console.WriteLine("Starting the pregame timer");

            await StartPreGameTimer(gameRoom.RoomId);

            await SendGameRoom(gameRoom);

        }
        

    }

    // * 2026: PRIVATE. Games start automatically when the pre-game countdown ends.
    private async Task StartGame(string roomId, GameRoom? sentGameRoom)
    {

        // Check if the preGameTimer is running. If so, dispose of it.

        GameRoom gameRoom = sentGameRoom != null ? sentGameRoom : _gameRooms[roomId];

        gameRoom.Running = true;

        gameRoom.Time.StartTime = DateTime.Now.Ticks;

        gameRoom.Time.FullStartDate = DateTime.Now;

        gameRoom.PlayerCount = gameRoom.ClientUserObjects.Count;

        // TODO: 
        //  - Start the pre game timer
        //  - Once the pre game timer ends: start the game
        // 

        await StartGameTimer(roomId);

        await SendGameRoom(gameRoom, _hubContext);

        // * 2026: The race started, so invites to this private game can't be used anymore
        if (gameRoom.IsPrivateGame)
        {
            await RefreshInvitesForRoom(gameRoom.RoomId);
        }


    }

    public async Task RestartPrivateGame(string roomId)
    {
        GameRoom? gameRoom = GetCallersRoom(roomId);

        // * 2026 SECURITY: Only the host can restart, and only after the game is over
        if (gameRoom != null && IsCallerHost(gameRoom) && gameRoom.GameOver)
        {
            Console.WriteLine("Resetting the private game");

            // 1. Reset the necessary states of the gameRoom

            // * 2026: Use the real paragraph generator (RandomParagraph only has 2 short test paragraphs)
            gameRoom.Paragraph = new ParagraphGenerator().generate();
            gameRoom.Running = false;
            gameRoom.GameOver = false;
            gameRoom.Time = new Time { CurrentTime = 90, TimePassed = 0, StartTime = 0 };
            gameRoom.Waiting = true;
            gameRoom.PreGameTimer = new Time { CurrentTime = 10, TimePassed = 0, StartTime = 0 };
            
            if (gameRoom.Placements.Count > 0)
            {
                gameRoom.Placements.Clear();
            }

            // 2. Reset the states of the players in the gameRoom 
            foreach (UserConnection user in gameRoom.Connections.Values)
            {
                user.Progress = 0;
                user.Wpm = 0;
                user.Finished = false;
                user.Accuracy = 0;
                user.FinalResults = null;

                gameRoom.ClientUserObjects[user.Username] = user;
            }

            await Clients.Group(gameRoom.RoomId).SendAsync("PrivateGameRestarting");

            // 3. Start The Pregame / Send the gameRoom
            await StartPreGameInternal(gameRoom.RoomId);

        }
    } 

    private async Task EndGame(GameRoom gameRoom)
    {
        /**
         * This function ends the timer and prevents further calculations
         * of WPM, accuracy, and progress.
         * */

        // * 2026: Only end a game once (the timer and the last finisher can both try to end it)
        if (gameRoom.GameOver)
        {
            return;
        }

        //1. Stop the timer
        StopAndRemoveTimer(_gameTimers, gameRoom.RoomId);

        // 2. Set the states of the game
        gameRoom.GameOver = true;
        gameRoom.Running = false;

        Console.WriteLine($"THe new gameroom timer after being disposed: {gameRoom.Time}");

        // Send the updated gameRoom so that the game will stop.
        await SendGameRoom(gameRoom, _hubContext);

    }

    private async Task DisposeGame(GameRoom gameRoom)
    {
        /**
         * Dispose of the game once all players have left.
         */

        // 1. remove BOTH timers
        // * 2026 FIX: The pre-game countdown timer used to keep running after its room was deleted,
        // * which could crash the server when it tried to start a game that no longer existed.
        Console.WriteLine("Disposing the timers and the game");
        StopAndRemoveTimer(_gameTimers, gameRoom.RoomId);
        StopAndRemoveTimer(_preGameTimers, gameRoom.RoomId);


        // 2. Remove the game.
        _gameRooms.Remove(gameRoom.RoomId);

        // * 2026: Anyone invited to this private game should no longer see the invite
        if (gameRoom.IsPrivateGame)
        {
            await RefreshInvitesForRoom(gameRoom.RoomId);
        }

    }

    /**
     * 2026: Stops, cleans up, and removes a room's timer.
     * Returns true only for the ONE caller that actually removed it, so two timer ticks
     * happening at the same moment can't both act on it.
     * */
    private static bool StopAndRemoveTimer(IDictionary<string, System.Timers.Timer> timers, string roomId)
    {
        if (timers.TryGetValue(roomId, out System.Timers.Timer? timer) && timers.Remove(roomId))
        {
            timer.Stop();
            timer.Dispose();
            return true;
        }

        return false;
    }

    private async Task FinishPlayer(GameRoom gameRoom, UserConnection currUser)
    {
        /**
         * Set the current player as finished and upload their results to the database
         * */


        // Use the connectionId to find out who has fininshed.
        //_gameRooms[roomId]

        Console.WriteLine("1. FINISHING PLAYER...");

        long startTime = gameRoom.Time.StartTime;

        long finishTime = DateTime.Now.Ticks - startTime;
        

        // 1. Set finished to true? If applicable
        currUser.Finished = true;


        // 2. Finialize the Player's other results

        currUser.FinalResults = new FinalResults
        {
            Dnf = false,
            FinalWpm = currUser.Wpm,
            FinishTime = finishTime,
            FinalAccuracy = currUser.Accuracy,
            PlayerCount = gameRoom.PlayerCount
        };


        // * Figure out the users position

        var placement = (currUser.Username, finishTime);

        int position = gameRoom.Placements.Count + 1;

        if (gameRoom.Placements.Count <= 0)
        {
            gameRoom.Placements.Add(placement);
        }
        else
        {
            int index = gameRoom.Placements.Count - 1;
            while (index > 0)
            {

                if (finishTime > gameRoom.Placements[index].FinishTime)
                {
                Console.WriteLine("Loop break");
                    gameRoom.Placements.Insert(index, placement);
                    break;
                }
                else if (index == 0)
                {
                    gameRoom.Placements.Insert(0, placement);
                }
                //* Corrects the position of the player if they're in the wrong spot.
                else
                {
                    UserConnection player = gameRoom.Connections
                                                    .Values
                                                    .Where(player => player.Username == currUser.Username)
                                                    .First();

                    player.FinalResults.Position = index + 1;
                }

                index--;
                position--;

            }
        }



        currUser.FinalResults.Position = position;




        // Replace the current ClientUserObject in GameRoom with a copy
        // So that modifying the UserConnection won't affect it after they finish
        UserConnection currUserCopy = new UserConnection();
        currUserCopy = currUser.Copy();

        gameRoom.ClientUserObjects[currUser.Username] = currUserCopy;

        // Determine wether the game needs to be ended by seeing if current players have finished

        bool gameIsOver = true;

        foreach(UserConnection user in gameRoom.ClientUserObjects.Values)
        {
            if (user.FinalResults == null)
            {
                gameIsOver = false;
                break;
            }
            else
            {
                Console.WriteLine($"{user.Username} has finished in {user.FinalResults.Position}");
            }

        }



        if (gameIsOver)
        {
            Console.WriteLine("\nFINAL PLAYER has finished, ENDING THE GAME\n");
            await EndGame(gameRoom);
        }
        else
        {
            Console.WriteLine("\nPLAYER has finished, but its not over\n");
        }

        Console.WriteLine("\nFinal WPM (FinishPlayer): " + currUser.Wpm);


        // 5. Upload their results to the database IF the game is not PRIVATE

        if (!gameRoom.IsPrivateGame)
        {
            Console.WriteLine("\n2. Updating the database...");
            await _userService.AddGameResult(currUser, gameRoom.Time.FullStartDate, gameRoom.RoomId);
            Console.WriteLine("3. Database updated");
        }
        else
        {
            Console.WriteLine("The game is private. Not uploading to database");
        }

    }

    private void InsertPosition(UserConnection currUser, GameRoom gameRoom, long finishTime)
    {
        // * This is to ensure that the players are in the correct spot
        
    }

    /***********************************************
     * Timer Related Functions
     *********************************************/
    private async Task StartGameTimer(string roomId)
    {

        if (_gameRooms.ContainsKey(roomId))
        {
            GameRoom gameRoom = _gameRooms[roomId];

            // Start the main timer
            if (!_gameTimers.ContainsKey(roomId))
            {
                System.Timers.Timer gameTimer = new System.Timers.Timer(1000); // 1-second interval
                gameTimer.Elapsed += async (sender, e) => await OnGameTimerElapsed(sender, e, gameRoom, roomId, _hubContext);

                gameTimer.AutoReset = true;
                gameTimer.Start();
                _gameTimers.Add(roomId, gameTimer);

            }

        }


    }

    private async Task StartPreGameTimer(string roomId)
    {

        if (_gameRooms.ContainsKey(roomId))
        {
            GameRoom gameRoom = _gameRooms[roomId];

            // Start the preGameTimer
            if (!_preGameTimers.ContainsKey(roomId))
            {
                System.Timers.Timer preGameTimer = new System.Timers.Timer(1000); // 1-second interval
                preGameTimer.Elapsed += async (sender, e) => await OnPreGameTimerElapsed(sender, e, gameRoom, roomId, _hubContext);

                preGameTimer.AutoReset = true;

                Console.WriteLine($"THe room id --> {roomId}");
                Console.WriteLine($"The timer?? --> {preGameTimer}");

                preGameTimer.Start();
                _preGameTimers.Add(roomId, preGameTimer);



            }

            //await SendGameRoom(gameRoom);
        }

    }

    // Evnet handler function for each time interval of specific timers
    // * 2026 NOTE: Timer handlers run on their own, outside any player's request. An error here
    // * can't be sent to anyone and can crash the whole server, so they catch and log everything.
    private async Task OnGameTimerElapsed(object sender, ElapsedEventArgs e, GameRoom gameRoom, string roomId, IHubContext<GameHub> hubContext)
    {
        try
        {
            // * The room was deleted (everyone left). Stop this timer.
            if (!_gameRooms.ContainsKey(roomId))
            {
                StopAndRemoveTimer(_gameTimers, roomId);
                return;
            }

            if (gameRoom.Time.CurrentTime > 0)
            {
                gameRoom.Time.CurrentTime--;
                gameRoom.Time.TimePassed++;

            }
            else
            {

                await EndGame(gameRoom);
                return;

            }

            await SendGameRoom(gameRoom, hubContext);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR in game timer for room {roomId}: {ex.Message}");
        }
    }

    private async Task OnPreGameTimerElapsed(object sender, ElapsedEventArgs e, GameRoom gameRoom, string roomId, IHubContext<GameHub> hubContext)
    {
        try
        {
            // * The room was deleted before the countdown finished. Stop this timer.
            if (!_gameRooms.ContainsKey(roomId))
            {
                StopAndRemoveTimer(_preGameTimers, roomId);
                return;
            }

            if (gameRoom.PreGameTimer.CurrentTime > 0)
            {
                gameRoom.PreGameTimer.CurrentTime--;
            }
            else
            {
                // 1. Stop and dispose the timer.
                // * Only the tick that actually removes the timer starts the game (prevents starting twice).
                if (StopAndRemoveTimer(_preGameTimers, roomId))
                {
                    Console.WriteLine("Stopping the PRE GAME timer");

                    // 2. Start the game
                    await StartGame(roomId, null);
                }

                return;
            }

            await SendGameRoom(gameRoom, hubContext);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR in pre-game timer for room {roomId}: {ex.Message}");
        }
    }

    /**********************************************
     * Private game and Invites
     * ********************************************/

    /**
     * The host invites an online friend to their private game.
     * 
     * 2026 SECURITY + FIXES:
     * - The sender's info comes from the server, not the browser.
     * - You can only invite FRIENDS, to a private room you're in, that can still be joined.
     * - The invite goes to every tab the friend has open (Clients.User), not just one.
     * */
    public async Task SendInvite(string senderUserId,
                                string senderUsername,
                                string senderProfilePicturePath,
                                string receiverUserId,
                                string roomId)
    {

        Console.WriteLine("SendInvite function called...");

        UserConnection? sender = GetCurrentConnection();
        GameRoom? inviteRoom = GetCallersRoom(roomId);

        if (sender == null || inviteRoom == null || !IsJoinablePrivateRoom(inviteRoom) ||
            string.IsNullOrEmpty(receiverUserId) || receiverUserId == sender.UserId)
        {
            return;
        }

        // * Only friends can be invited
        if (await _userService.GetSingleFriend(sender.UserId, receiverUserId) == null)
        {
            return;
        }

        senderUserId = sender.UserId;

        // 1. Remember who the host has invited (so their invite modal shows "Invite Sent")
        InviteSender inviteSender = _gameInviteSenders.TryGetValue(senderUserId, out InviteSender? existingSender) ?
            existingSender :
            new InviteSender { RoomId = roomId, InvitesSent = new Dictionary<string, bool>() };

        lock (inviteSender)
        {
            // * If these invites were for an older room, start a fresh list for this room
            if (inviteSender.RoomId != roomId)
            {
                inviteSender.RoomId = roomId;
                inviteSender.InvitesSent.Clear();
            }

            inviteSender.InvitesSent[receiverUserId] = false;
        }

        _gameInviteSenders[senderUserId] = inviteSender;

        await Clients.Caller.SendAsync("GetInvitesSent", inviteSender.InvitesSent);


        // 2. Save the invite for the receiver. A newer invite from the same host replaces the old one.
        Dictionary<string, InviteReceived> invitesReceived =
            _gameInviteReceivers.TryGetValue(receiverUserId, out Dictionary<string, InviteReceived>? existingInvites) ?
            existingInvites :
            new Dictionary<string, InviteReceived>();

        lock (invitesReceived)
        {
            invitesReceived[senderUserId] = new InviteReceived
            {
                RoomId = roomId,
                SenderUserId = senderUserId,
                SenderUsername = sender.Username,
                SenderProfilePicturePath = sender.ProfileImg ?? "",
                SenderColor = sender.Color
            };
        }

        _gameInviteReceivers[receiverUserId] = invitesReceived;


        // 3. Send the updated invites to the receiver (all of their tabs). "GetInvitesReceived" shows the pop-up alert.
        await _hubContext.Clients.User(receiverUserId).SendAsync("GetInvitesReceived", GetValidInvites(receiverUserId));

    }

    /**
     * 2026: The player declines (dismisses) an invite from the navbar.
     * */
    public async Task DeclineInvite(string senderUserId)
    {
        string? myUserId = CurrentUserId;

        if (string.IsNullOrEmpty(myUserId) || senderUserId == null)
        {
            return;
        }

        if (_gameInviteReceivers.TryGetValue(myUserId, out Dictionary<string, InviteReceived>? invites))
        {
            lock (invites)
            {
                invites.Remove(senderUserId);
            }
        }

        await PushInvitesToUser(myUserId);
    }

    private async Task GetInvitesReceived(string userId)
    {
        await Clients.Caller.SendAsync("InitInvitesReceived", GetValidInvites(userId));
    }

    /**
     * 2026: Can players still join this private room? (It exists, hasn't started, and isn't full.)
     * */
    private bool IsJoinablePrivateRoom(GameRoom gameRoom)
    {
        return gameRoom.IsPrivateGame &&
            !gameRoom.Running &&
            !gameRoom.GameOver &&
            gameRoom.Connections.Count < MaxPlayersPerRoom &&
            // * The host must still be there (only the host can start the game)
            gameRoom.ClientUserObjects.ContainsKey(gameRoom.PrivateGameHostUsername);
    }

    /**
     * 2026: Returns a player's invites, after throwing away any that can't be used anymore
     * (the room was deleted, the game already started, or it's full).
     * 
     * SIMPLE TERMS: "Which of my invites still work?"
     * */
    private List<InviteReceived> GetValidInvites(string userId)
    {
        if (!_gameInviteReceivers.TryGetValue(userId, out Dictionary<string, InviteReceived>? invites))
        {
            return new List<InviteReceived>();
        }

        lock (invites)
        {
            foreach (string senderId in invites.Keys.ToList())
            {
                bool stillJoinable = _gameRooms.TryGetValue(invites[senderId].RoomId, out GameRoom? room) &&
                                     IsJoinablePrivateRoom(room);

                if (!stillJoinable)
                {
                    invites.Remove(senderId);
                }
            }

            return invites.Values.ToList();
        }
    }

    /**
     * 2026: Sends a player their current (valid) invites WITHOUT the pop-up alert,
     * to all of their open tabs. Uses _hubContext so it also works from timers.
     * */
    private Task PushInvitesToUser(string userId)
    {
        return _hubContext.Clients.User(userId).SendAsync("InitInvitesReceived", GetValidInvites(userId));
    }

    /**
     * 2026: When a private room changes (starts, is deleted, or fills up), update the invites
     * menu of everyone who was invited to it, so they don't see a "Join" button that won't work.
     * */
    private async Task RefreshInvitesForRoom(string roomId)
    {
        List<string> invitedUserIds = _gameInviteReceivers
            .Where(entry =>
            {
                lock (entry.Value)
                {
                    return entry.Value.Values.Any(invite => invite.RoomId == roomId);
                }
            })
            .Select(entry => entry.Key)
            .ToList();

        foreach (string userId in invitedUserIds)
        {
            await PushInvitesToUser(userId);
        }
    }



    // 3. 

    //public async Task UpdateInvite()


    /**********************************************
     * Friends and Friend Requests
     * ********************************************/


    /**
     * Friends and invitations use both the database AND SignalR.
     * The database stores persistent information such as 
     * - Friend relationships, 
     * - sent/received 
     * - accepted friend requests
     * 
     * SignalR handles real-time communication with users who are currently online.
     * - EX: A friend request is sent. A real time update through SignalR allows
     *      the receiver to see the request immediately without needing to refresh the page.
     *      
     * THE FLOW:
     * 1. User A sends friend/invite request
     * 2. UserService / Repository adds the request to the database
     * 3. Connection map finds User B/s SignalR connection 
     * 4. SignalR sends the real time notification to User B's frontend.
     * */

    public async Task SendFriendRequest(string fromUserId, string fromUsername, string fromProfilePicture, string toUserId, string toUsername, string toProfilePicture)
    {
        /**
         * A function called by the sender. This should
         * 
         * 2. Add the new request to the database
         * 3. Use SendAsync to somehow update the receiver
         * 4. Use SendAsync to update the sender's frontend
         * */
        // * 2026 SECURITY: The sender is ALWAYS the logged-in user (from their token).
        // * Both users' names and pictures come from the database, not from the browser.
        fromUserId = CurrentUserId!;

        if (string.IsNullOrEmpty(fromUserId) || string.IsNullOrEmpty(toUserId) || fromUserId == toUserId)
        {
            return;
        }

        User? fromDbUser = await _userService.GetUserAsync(fromUserId);
        User? toDbUser = await _userService.GetUserAsync(toUserId);

        if (fromDbUser == null || toDbUser == null)
        {
            return;
        }

        // * Don't send a request if they're already friends or a request between them already exists
        if (await _userService.GetSingleFriend(fromUserId, toUserId) != null ||
            await _userService.GetSingleFriendRequest(fromUserId, toUserId) != null)
        {
            return;
        }

        // * The FriendRequests table doesn't allow null pictures, so use "" when there's no picture
        FriendRequestUser fromUser = new FriendRequestUser
        {
            UserId = fromUserId,
            Username = fromDbUser.Username,
            ProfilePicturePath = fromDbUser.ProfilePicturePath ?? "",
        };

        FriendRequestUser toUser = new FriendRequestUser
        {
            UserId = toUserId,
            Username = toDbUser.Username,
            ProfilePicturePath = toDbUser.ProfilePicturePath ?? "",
        };

        Console.WriteLine($"Sender: {fromUser} \n Receiver {toUser}");

        await _userService.AddFriendRequest(fromUser, toUser);


        // * Acurie the new friend request that has just been added to the database and
        // * send it to the frontend of the sender
        FriendRequest? newRequest = await _userService.GetSingleFriendRequest(fromUserId, toUserId);

        if (newRequest == null)
        {
            return;
        }

        Console.WriteLine($"\nNew Request being sent back: " + newRequest.FromUserId + "\n");

        await Clients.Client(Context.ConnectionId).SendAsync("UpdateFriendRequests", newRequest);


        // * Update the frontend of the receiver of the friend request
        if (_connectionsUserId.ContainsKey(toUserId))
        {
            Console.WriteLine("Receiver Connection is contained\n");

            UserConnection receiverUserObject = _connectionsUserId[toUserId];

            string receieverConnectionId = receiverUserObject.ConnectionId;

            if (_connections.TryGetValue(receieverConnectionId, out UserConnection userConnection))
            {

                Console.WriteLine("Sending request back to the receiver");

                await Clients.Client(receieverConnectionId).SendAsync("UpdateFriendRequests", newRequest);

            }



        }

    }

    public async Task UpdateFriendRequestStatus(int friendRequestId, string fromUserId, string toUserId, bool accepted)
    {
        // * 2026 SECURITY: Only the person who RECEIVED the request can accept or reject it.
        toUserId = CurrentUserId!;

        FriendRequest? request = await _userService.GetSingleFriendRequest(fromUserId, toUserId);

        if (request == null || request.RequestId != friendRequestId || request.ToUserId != toUserId)
        {
            return;
        }

        await _userService.UpdateFriendRequestStatus(friendRequestId, accepted);

        /**
         * 1. if accepted:
         *      - Get the updated friends list, and udated friend requests of the receiver. 
         *      - Send the updated lists to the frontend of the receiver
         *      - Repeat both steps for the sender (if they are online / connected)
         * 2. if rejected:
         *      - Get the updated friend requests of the receiver. 
         *      - Send the updated list to the frontend of the receiver.
         *      - Repeat both steps for the sender (if they are online / connected)
         * */



        if (accepted)
        {

            // * Get the updated friend requests list
            // * Acquire the new friend added to the database
            // * Send both to the receiver
            List<FriendRequest> receiverFriendRequests = await _userService.GetFriendRequests(toUserId);
            Friend newFriend = await _userService.GetSingleFriend(fromUserId, toUserId);
           


            await Clients.Client(Context.ConnectionId).SendAsync("ReceiveFriendRequests", receiverFriendRequests);
            await Clients.Client(Context.ConnectionId).SendAsync("UpdateFriendsList", newFriend);



            // * Determine if the sender of the request is online. Only retrieve and send their
            // * new friends and requests list if they're online

            if (_connectionsUserId.ContainsKey(fromUserId))
            {
                UserConnection senderUserObject = _connectionsUserId[fromUserId];

                string senderConnectionId = senderUserObject.ConnectionId;

                if (_connections.TryGetValue(senderConnectionId, out UserConnection userConnection))
                {
                    List<FriendRequest> senderFriendRequests = await _userService.GetFriendRequests(fromUserId);

                    await Clients.Client(senderConnectionId).SendAsync("ReceiveFriendRequests", senderFriendRequests);
                    await Clients.Client(senderConnectionId).SendAsync("UpdateFriendsList", newFriend);


                }



            }


        }
        else
        {
            // * The friend request was not accepted, so simply send the updated friend request list
            // * to the sender and receiver

            List<FriendRequest> receiverFriendRequests = await _userService.GetFriendRequests(toUserId);

            await Clients.Client(Context.ConnectionId).SendAsync("ReceiveFriendRequests", receiverFriendRequests);

            // * Determine if the sender of the request is online. Only retrieve and send their
            // * new friends and requests list if they're online

            if (_connectionsUserId.ContainsKey(fromUserId))
            {
                UserConnection senderUserObject = _connectionsUserId[fromUserId];

                string senderConnectionId = senderUserObject.ConnectionId;

                if (_connections.TryGetValue(senderConnectionId, out UserConnection userConnection))
                {
                    List<FriendRequest> senderFriendRequests = await _userService.GetFriendRequests(fromUserId);

                    await Clients.Client(senderConnectionId).SendAsync("ReceiveFriendRequests", senderFriendRequests);


                }



            }
        }
    }

    private async Task GetFriendRequests(string userId)
    {
        /**
         * Acquire and send the current user's friend requests from the database to the frontend
         * */

        List<FriendRequest> friendRequests = await _userService.GetFriendRequests(userId);

        await Clients.Client(Context.ConnectionId).SendAsync("ReceiveFriendRequests", friendRequests);
    }

    private async Task GetFriends(string userId)
    {
        /**
         * Acquire and send the current user's friends list from the database to the frontend
         * */

        List<Friend> friends = await _userService.GetFriends(userId);

        await Clients.Client(Context.ConnectionId).SendAsync("ReceiveFriendsList", friends);
    }

    public async Task GetOnlineFriends(List<string> friendUserIds)
    {
        /**
         * Acuire and send a list of friends who are online
         * */

        // 1. Create a List to store the found online friends

        // 2. Loop through the friendUserIds

        // 3. See if their userId exists in the _connectionsUserId collection (Are they online?)

        // 4. If so, add them to the list of online friends

        //      4a. We only need to send the username, profilePic, and userId. So create a dictionary for each online friend

        // 5. Use SendAsync to send the list back to the user (using Context.ConnectionId)

        Console.WriteLine("Acquring online friends");

        // * 2026 SECURITY: Only check users who are actually the caller's friends,
        // * so nobody can see whether any random user is online.
        string? myUserId = CurrentUserId;

        if (string.IsNullOrEmpty(myUserId) || friendUserIds == null)
        {
            return;
        }

        HashSet<string> myFriendIds = (await _userService.GetFriends(myUserId))
            .Select(friend => friend.UserId1 == myUserId ? friend.UserId2 : friend.UserId1)
            .ToHashSet();

        friendUserIds = friendUserIds.Where(myFriendIds.Contains).ToList();

        List<Dictionary<string, string>> newOnlineFriends = new List<Dictionary<string, string>>();

        foreach(string userId in friendUserIds)
        {
            
            if (_connectionsUserId.TryGetValue(userId, out UserConnection userConnection))
            {


                Dictionary<string, string> friend = new Dictionary<string, string>()
                {
                    {"userId", userConnection.UserId},
                    {"username", userConnection.Username},
                    {"profilePicturePath", userConnection.ProfileImg}
                };

                newOnlineFriends.Add(friend);
            }

        }

        if (newOnlineFriends.Count > 0)
        {
            await Clients.Client(Context.ConnectionId).SendAsync("ReceiveOnlineFriends", newOnlineFriends);
        }


    }

    private async Task GetFriendObjects(List<string> friendUserIds)
    {
        /**
         * Gets the user objects of the friends list using the list of 
         * user ids.
         * */
        
        List<User> friendUserObjs = await _userService.GetFriendUsers(friendUserIds);

        Console.WriteLine("\n Friend object function called \n");

        foreach(User user in friendUserObjs)
        {
            Console.WriteLine($"The friend's username: {user.Username}" );
        }

        await Clients.Client(Context.ConnectionId).SendAsync("ReceiveFriendObjects", friendUserObjs);

    }

    private async Task UpdateFriendRequestNotifications()
    {
        /**
         * This function should (possibly) receive a list of the friend requests to have 
         * their "viewed" property updated
         * */


    }



}



