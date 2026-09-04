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

    // Stores --> roomId: gameRoom object
    private readonly IDictionary<string, GameRoom> _privateGameRooms;

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
    //public GameHub(IDictionary<string, UserConnection> connections)
    public GameHub(IDictionary<string, UserConnection> connections,
                    IDictionary<string, UserConnection> connectionsUserId,
                    IDictionary<string, GameRoom> gameRooms,
                    IDictionary<string, GameRoom> privateGameRooms,
                    IDictionary<string, System.Timers.Timer> gameTimers,
                    IDictionary<string, System.Timers.Timer> preGameTimers,
                    IDictionary<string, InviteSender> gameInvitesSender,
                    IDictionary<string, Dictionary<string, InviteReceived>> gameInvitesReceiver,
                    IHubContext<GameHub> hubContext,
                    UserService userService)
    {
        _connections = connections;
        _connectionsUserId = connectionsUserId;
        _gameRooms = gameRooms;

        _privateGameRooms = privateGameRooms;

        _gameTimers = gameTimers;
        _preGameTimers = preGameTimers;

        _gameInviteSenders = gameInvitesSender;
        _gameInviteReceivers = gameInvitesReceiver;

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
     * Intializing the connection to the hub
     * *******************/

    public async Task InitConnection(UserConnection userConnection)
    {
        try
        {
            // ✅ ADD THIS: Validate the incoming userConnection
            if (userConnection == null)
            {
                throw new ArgumentNullException(nameof(userConnection), "UserConnection cannot be null");
            }

            if (string.IsNullOrEmpty(userConnection.UserId))
            {
                throw new ArgumentException("UserId cannot be null or empty", nameof(userConnection.UserId));
            }

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

    public async Task JoinRoom(UserConnection userConnection)
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

            gameRoom.Connections.Add(Context.ConnectionId, userConnection);

            gameRoom.ClientUserObjects.Add(userConnection.Username, userConnection);

            

            // If a player has joined, the pre game timer can be started IF not already started...
            if (gameRoom.Waiting)
            {
                if (gameRoom.Connections.Count > 1)
                {

                    Console.WriteLine("Starting the Pregame");

                    await StartPreGame(gameRoom.RoomId);
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
    public string RandomParagraph()
    {
        Random random = new Random();
        return paragraphs[random.Next(paragraphs.Length)];
        
    }

    public Task SendGameRoom(GameRoom gameRoom, IHubContext<GameHub>? hubContext = null)
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

    public async Task CreateRoom(UserConnection userConnection)
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
            Connections = new Dictionary<string, UserConnection>()
            {
                {Context.ConnectionId, userConnection }
            },
            ClientUserObjects = new Dictionary<string, UserConnection>()
            {
                { userConnection.Username, userConnection }
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
                Paragraph = RandomParagraph(), 
                Connections = new Dictionary<string, UserConnection>() 
            { 
                {connectionId, userConnection } 
            }, 
                ClientUserObjects = new Dictionary<string, UserConnection>() 
            {
                { userConnection.Username, userConnection } 
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
        UserConnection userConnection = _connections[Context.ConnectionId];


        // 0a. Ensure that the private game is joinable 
        if (_gameRooms.TryGetValue(roomId, out GameRoom currentGameRoom))
        {

            // ? Check the state of the gameRoom and ensure that it isn't in progress.
            if (currentGameRoom.IsPrivateGame)
            {
                if (!currentGameRoom.Running && !currentGameRoom.GameOver)
                {
                    isJoinable = true;
                }
            }

        }


        if (isJoinable)
        {
            Console.WriteLine("Private game found. Joining... \n");

            // 1. Add the user to the group first
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);


            // 1a. Add the roomId to the user's userConnection object
            userConnection.RoomId = currentGameRoom.RoomId;

            // 1b. Add the user to the game room
            currentGameRoom.Connections.Add(Context.ConnectionId, userConnection);

            currentGameRoom.ClientUserObjects.Add(userConnection.Username, userConnection);

            // 1c. Remove the invite from the receiver's invites

            string userId = userConnection.UserId;

            _gameInviteReceivers[userId].Remove(roomId);


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


        // * Possible solution: get average WPM from the database
        var user = await _userService.GetUserAsync(userConnection.UserId);

        // * Populate userConnection from user

        // * - Remove the user from the game if still there. THEN find a new game
        if (_connections.ContainsKey(Context.ConnectionId))
        {

            Console.WriteLine("User is connected already. Finding a game");
            userConnection = _connections[Context.ConnectionId];

            if (userConnection.RoomId != null)
            {
                // * Is the user in a game or has a game associated with them already?
                if (_gameRooms.TryGetValue(userConnection.RoomId, out GameRoom gameRoom))
                {

                    Console.WriteLine("\nAttempting to find a new game\n");


                    if (gameRoom.Connections.ContainsKey(Context.ConnectionId))
                    {

                        Console.WriteLine("\nRemoving from the current game\n");

                        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameRoom.RoomId);
                        gameRoom.Connections.Remove(Context.ConnectionId);


                        //* If the game hasn't started and is not over, remove their clientObject
                        //if (!gameRoom.Running && !gameRoom.GameOver)
                        //{
                        //    gameRoom.ClientUserObjects.Remove(userConnection.Username);

                        //}



                    }

                    // Reset the values of the userConnection before joining a new game
                    userConnection.Accuracy = 0;
                    userConnection.Finished = false;
                    userConnection.Progress = 0;
                    userConnection.Wpm = 0;
                    userConnection.FinalResults = null;
                    
                }

            }


        }

        bool hasAverageWpm = user.AverageWpm != null;

        Console.WriteLine($"FINDROOM Connection ID: {Context.ConnectionId}");

        if (_gameRooms.Count > 0)
        {
            // If they don't have an averageWPM yet, (they haven't played their first game)
            // Join them to a random game

            // Loop and find a game within the range if there are games
            foreach (GameRoom gameRoom in _gameRooms.Values)
            {

                Console.WriteLine("FOUND A GAME, CHECKING");

                // Make sure the game hasn't started and isn't private
                if (!gameRoom.Running && !gameRoom.GameOver && !gameRoom.IsPrivateGame)
                {

                    // Does their average WPM fall in the range of this game?
                    if (hasAverageWpm)
                    {
                        if (gameRoom.WpmRange != null &&
                            userConnection.AverageWpm > gameRoom.WpmRange.Item1 &&
                            userConnection.AverageWpm < gameRoom.WpmRange.Item2)
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




    public Tuple<int, int> GetWpmRange(int averageWpm)
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

        if (_connections.TryGetValue(Context.ConnectionId, out UserConnection userConnection))
        {
            GameRoom currRoom = _gameRooms[userConnection.RoomId] != null ? _gameRooms[userConnection.RoomId] : null;
            // TODO: Don't completely remove their info from the gameRoom if the game has started. 

            // Remove the user connection from the gameRoom (if they are still present)
            if (currRoom != null &&
                currRoom.Connections[Context.ConnectionId] != null)
            {
                currRoom.Connections.Remove(Context.ConnectionId);
                Console.WriteLine("PLEASE REMOVE THE USER");
                currRoom.ClientUserObjects.Remove(userConnection.Username);
            }


            // TODO: Add conditions to determine whether to destroy the gameRoom or not.
            if (currRoom != null)
            {

                // Was that the last user? Dispose of the game
                if (currRoom.Connections.Count <= 0)
                {
                    await DisposeGame(currRoom);
                }
                // Otherwise, if players are still there, re-send the gameRoom object
                // to update the amount of players there.
                else
                {
                    // Send the updated game room information the correct game room.
                    await SendGameRoom(currRoom);


                    await Clients.Group(userConnection.RoomId).SendAsync("ReceiveMessage",
                        $"{userConnection.Username} has left {userConnection.RoomId}");
                }

            }
        }
    }

    /**
     * Utility function that allows the frontend to get all active games.
     * *******/

    public async Task GetActiveGames()
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
    public override async Task OnDisconnectedAsync(Exception exception)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out UserConnection userConnection))
        {
            // TODO: Don't completely remove their info from the gameRoom the game has started. 

            // Does the game still exist?
            // Are they even in that game
            //      - If not in the game, don't worry about it.
            //      - if still in the game determine whether to destroy or not.


            GameRoom currRoom = null;

            if (userConnection.RoomId != null)
            {
                currRoom = _gameRooms[userConnection.RoomId] != null ? _gameRooms[userConnection.RoomId] : null;

            }

            if (currRoom != null)
            {

                // 1. Remove the user completely from the game
                if (currRoom.Connections[Context.ConnectionId] != null)
                {
                    currRoom.Connections.Remove(Context.ConnectionId);
                    currRoom.ClientUserObjects.Remove(userConnection.Username);
                }

                // determine whether to destroy the gameRoom or not. Was that the last user?
                if (_gameRooms[userConnection.RoomId].Connections.Count <= 0)
                {

                    await DisposeGame(currRoom);

                }

                else
                {
                    // Send the updated game room information to the correct game room.
                    await SendGameRoom(currRoom);


                    await Clients.Group(userConnection.RoomId).SendAsync("ReceiveMessage",
                        $"{userConnection.Username} has left {userConnection.RoomId}");
                }

            }

            Console.WriteLine($"{userConnection.Username} has disconnected. Removing them");

            // Remove the user from the connections, and their current game room.
            _connections.Remove(Context.ConnectionId);
            _connectionsUserId.Remove(userConnection.UserId);


            foreach(var connection in _connections)
            {
                Console.WriteLine($"\n{connection.Value.Username} is still connected\n");
            }
        }
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
    public async Task UpdateProgress(double progress, string roomId)
    {


        GameRoom currRoom = _gameRooms[roomId];

        UserConnection currUser = currRoom.Connections[Context.ConnectionId];

        currUser.Progress = progress;
        
        if (progress >= 1)
        {
            // ? FinishPlayer will send the gameRoom in its own modified way.
            await FinishPlayer(currRoom, currUser);
        }
        
        await SendGameRoom(_gameRooms[roomId]);
        

        //Console.WriteLine("New Progress: " + progress.ToString());

        //Console.WriteLine("Server Stored Progress: " + _gameRooms[roomId].Connections[Context.ConnectionId].Progress.ToString());

    }
    public async Task UpdateWpm(int wpm, string roomId)
    {

        //Console.WriteLine($"Room ID Passed to WPM: {roomId}");
        //Console.WriteLine($"ConnectionId Passed to WPM: {Context.ConnectionId}");

        //Console.WriteLine($"Update WPM Gameroom in question: {_gameRooms[roomId]}");

        _gameRooms[roomId].Connections[Context.ConnectionId].Wpm = wpm;


        //Console.WriteLine("New WPM: " + wpm.ToString());

        await SendGameRoom(_gameRooms[roomId]);

    }

    public async Task UpdateAccuracy(int accuracy, string roomId)
    {

        _gameRooms[roomId].Connections[Context.ConnectionId].Accuracy = accuracy;


        //Console.WriteLine("New WPM: " + wpm.ToString());

        await SendGameRoom(_gameRooms[roomId]);

        //Console.WriteLine("New Accuracy: ", accuracy.ToString());

    }

    /***********************************************
     * Starting and Ending the game
     *********************************************/

    //public async Task StartPreGame(GameRoom gameRoom)
    public async Task StartPreGame(string roomId)
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

    public async Task StartGame(string roomId, GameRoom? sentGameRoom)
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


    }

    public async Task RestartPrivateGame(string roomId)
    {
        if (_gameRooms.TryGetValue(roomId, out GameRoom gameRoom))
        {
            Console.WriteLine("Resetting the private game");

            // 1. Reset the necessary states of the gameRoom

            gameRoom.Paragraph = RandomParagraph();
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
            await StartPreGame(gameRoom.RoomId);

        }
    } 

    public async Task EndGame(GameRoom gameRoom)
    {
        /**
         * This function ends the timer and prevents further calculations
         * of WPM, accuracy, and progress.
         * */

        //1. Stop the timer

        if (_gameTimers.ContainsKey(gameRoom.RoomId))
        {
            Console.WriteLine("Stopping the timer");
            _gameTimers[gameRoom.RoomId].Stop();
            _gameTimers[gameRoom.RoomId].Dispose();
            _gameTimers.Remove(gameRoom.RoomId);
        }

        // 2. Set the states of the game
        gameRoom.GameOver = true;
        gameRoom.Running = false;

        Console.WriteLine($"THe new gameroom timer after being disposed: {gameRoom.Time}");

        // Send the updated gameRoom so that the game will stop.
        await SendGameRoom(gameRoom, _hubContext);

    }

    public async Task DisposeGame(GameRoom gameRoom)
    {
        /**
         * Dispose of the game once all players have left.
         */

        // 1. remove the timer
        if (_gameTimers.ContainsKey(gameRoom.RoomId))
        {
            Console.WriteLine("Disposing the timer and the game");
            _gameTimers[gameRoom.RoomId].Stop();
            _gameTimers[gameRoom.RoomId].Dispose();
            _gameTimers.Remove(gameRoom.RoomId);
        }


        // 2. Remove the game. 
        _gameRooms.Remove(gameRoom.RoomId);

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
    private async Task OnGameTimerElapsed(object sender, ElapsedEventArgs e, GameRoom gameRoom, string roomId, IHubContext<GameHub> hubContext)
    {

        if (_gameRooms.ContainsKey(roomId))
        {
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

    }

    private async Task OnPreGameTimerElapsed(object sender, ElapsedEventArgs e, GameRoom gameRoom, string roomId, IHubContext<GameHub> hubContext)
    {
        
        if (gameRoom.PreGameTimer.CurrentTime > 0)
        {
            gameRoom.PreGameTimer.CurrentTime--;
        }
        else
        {

            // TODO: 
            //  1. Stop and dispose the preGameTimer
            //  2. Start the game after the timer ends


            // 1. Stop and dispose the timer
            if (_preGameTimers.ContainsKey(gameRoom.RoomId))
            {
                Console.WriteLine("Stopping the PRE GAME timer");
                _preGameTimers[gameRoom.RoomId].Stop();
                _preGameTimers[gameRoom.RoomId].Dispose();
                _preGameTimers.Remove(gameRoom.RoomId);
            }

            // Start the game 
            await StartGame(gameRoom.RoomId, null);

            return;

        }

        await SendGameRoom(gameRoom, hubContext);
    }

    /**********************************************
     * Private game and Invites
     * ********************************************/

    public async Task SendInvite(string senderUserId,
                                string senderUsername,
                                string senderProfilePicturePath,
                                string receiverUserId,
                                string roomId)
    {

        Console.WriteLine("SendInvite function called...");

        Console.WriteLine("Profile picture path from sender: " + senderProfilePicturePath);

        // 1. Create an entry in GameInvitesSender

        // 2. Add property in gameInvitesReceiver

        // 3. SendAsync to sender and receiver


        // 1. Check if the player has already sent invites / exists in the invites collection
        // a. If so, add the new invite
        // b. otherwise, create a new entry in _gameInviteSenders and store the invite
        if (_gameInviteSenders.TryGetValue(senderUserId, out InviteSender inviteSender))
        {

            //senderInvites.Add(userId, false);

            inviteSender.InvitesSent.Add(receiverUserId, false);

            Dictionary<string, bool> invitesSentDict = inviteSender.InvitesSent;

            await Clients.Client(Context.ConnectionId).SendAsync("GetInvitesSent", invitesSentDict);

        }
        else
        {

            InviteSender newInviteSender = new InviteSender()
            {
                RoomId = roomId,
                InvitesSent = new Dictionary<string, bool>
                {
                    {receiverUserId, false }
                }
            };

            _gameInviteSenders[senderUserId] = newInviteSender;


            Dictionary<string, bool> invitesSentDict = newInviteSender.InvitesSent;

            await Clients.Client(Context.ConnectionId).SendAsync("GetInvitesSent", invitesSentDict);
        }




        // 2. Check if the receiver of the invite is online before sending it
        string receiverConnectionId = null;

        if (_connectionsUserId.TryGetValue(receiverUserId, out UserConnection user))
        {
            receiverConnectionId = user.ConnectionId;
        }

        // 3. Check if the player has already received invites / exists in the invites collection
        // a. If so, add the new invite
        // b. else, create a new entry in _gameInviteReceivers and store the invite
        if (_gameInviteReceivers.TryGetValue(receiverUserId, out Dictionary<string, InviteReceived> invitesReceived))
        {

            InviteReceived inviteReceived = new InviteReceived
            {

                SenderUserId = senderUserId,
                RoomId = roomId,
                SenderUsername = senderUsername,
                SenderProfilePicturePath = senderProfilePicturePath,
                

            };

            invitesReceived.Add(senderUserId, inviteReceived);


            // * Send the new invites to the receiver if they're online
            if (receiverConnectionId != null)
            {

                // ? The frontend React method receiving this collection must receive it as a list 
                List<InviteReceived> invitesReceivedList = invitesReceived.Values.ToList();

                await Clients.Client(receiverConnectionId).SendAsync("GetInvitesReceived", invitesReceivedList);
            }

        }

        else
        {

            // 1. Create a new inviteReceived object and store it in a dictionary
            InviteReceived newInviteReceived = new InviteReceived
            {
                RoomId = roomId,
                SenderUserId = senderUserId,
                SenderUsername = senderUsername,
                SenderProfilePicturePath = senderProfilePicturePath,
            };

            Dictionary<string, InviteReceived> invitesReceivedDict = new Dictionary<string, InviteReceived>
            {
                { senderUserId, newInviteReceived }
            };

            // 2. Create an entry in the _gameInviteReceivers collection

            _gameInviteReceivers[receiverUserId] = invitesReceivedDict;


            // * Send the new invites to the receiver if they're online
            if (receiverConnectionId != null)
            {

                List<InviteReceived> invitesReceivedList = invitesReceivedDict.Values.ToList();

                await Clients.Client(receiverConnectionId).SendAsync("GetInvitesReceived", invitesReceivedList);


            }

        }

    }

    public async Task GetInvitesReceived(string userId)
    {

        if (_gameInviteReceivers.TryGetValue(userId, out Dictionary<string, InviteReceived> invitesReceived))
        {

            List<InviteReceived> invitesReceivedList = invitesReceived.Values.ToList();

            await Clients.Client(Context.ConnectionId).SendAsync("InitInvitesReceived", invitesReceivedList);


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
        FriendRequestUser fromUser = new FriendRequestUser
        {
            UserId = fromUserId,
            Username = fromUsername,
            ProfilePicturePath = fromProfilePicture,
        };

        FriendRequestUser toUser = new FriendRequestUser
        {
            UserId = toUserId,
            Username = toUsername,
            ProfilePicturePath = toProfilePicture,
        };

        Console.WriteLine($"Sender: {fromUser} \n Receiver {toUser}");

        await _userService.AddFriendRequest(fromUser, toUser);


        // * Acurie the new friend request that has just been added to the database and 
        // * send it to the frontend of the sender
        FriendRequest newRequest = await _userService.GetSingleFriendRequest(fromUserId, toUserId);

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

    public async Task GetFriendRequests(string userId)
    {
        /**
         * Acquire and send the current user's friend requests from the database to the frontend
         * */

        List<FriendRequest> friendRequests = await _userService.GetFriendRequests(userId);

        await Clients.Client(Context.ConnectionId).SendAsync("ReceiveFriendRequests", friendRequests);
    }

    public async Task GetFriends(string userId)
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

    public async Task GetFriendObjects(List<string> friendUserIds)
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

    public async Task UpdateFriendRequestNotifications()
    {
        /**
         * This function should (possibly) receive a list of the friend requests to have 
         * their "viewed" property updated
         * */


    }



}



