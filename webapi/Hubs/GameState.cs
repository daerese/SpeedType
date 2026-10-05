using System.Collections.Concurrent;
using webapi.Models;

/**
 * GameState.cs (2026)
 *
 * Holds all of the live game data that has to survive between hub calls:
 * who's connected, the game rooms, the timers, and private game invites.
 * It's registered ONCE as a singleton in Program.cs, so every GameHub shares it.
 *
 * SIMPLE TERMS: GameHub objects are created and thrown away for every message a player sends.
 * This class is the "memory" that stays around the whole time the server is running.
 *
 * Why ConcurrentDictionary? Many players (and the game timers) use these at the same
 * moment. A normal Dictionary can get corrupted when that happens. ConcurrentDictionary
 * is the thread-safe version.
 *
 * NOTE: Before 2026, these were registered as separate IDictionary singletons. Because
 * some had the SAME type, they accidentally shared one dictionary (EX: the game timers
 * and pre-game timers were stored together). Each one now has its own dictionary.
 * */
public class GameState
{
    // Context.ConnectionId --> UserConnection
    public ConcurrentDictionary<string, UserConnection> Connections { get; } = new();

    // UserId --> UserConnection (used to find a player's connection to send them friend requests/invites)
    public ConcurrentDictionary<string, UserConnection> ConnectionsByUserId { get; } = new();

    // RoomId --> GameRoom
    public ConcurrentDictionary<string, GameRoom> GameRooms { get; } = new();

    // RoomId --> the 90 second race timer
    public ConcurrentDictionary<string, System.Timers.Timer> GameTimers { get; } = new();

    // RoomId --> the 10 second countdown before a race
    public ConcurrentDictionary<string, System.Timers.Timer> PreGameTimers { get; } = new();

    // Sender's UserId --> the invites they've sent
    public ConcurrentDictionary<string, InviteSender> InviteSenders { get; } = new();

    // Receiver's UserId --> (Sender's UserId --> invite)
    public ConcurrentDictionary<string, Dictionary<string, InviteReceived>> InviteReceivers { get; } = new();
}
