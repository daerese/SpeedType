using webapi.Data;
using Microsoft.EntityFrameworkCore;


/**
 * GameResultRepository.cs
 * 
 * This class is responsible for handling all database operations related to game results.
 * It provides methods to retrieve game results, get players in a game, and add new game results.
 * 
 * SIMPLE TERMS: This class is like a helper that talks to the database for anything related to game results. 
 * It can get a user's recent game results, get players in a specific game, and add new game results to the database.
 *
 **/
public class GameResultRepository
{

    private readonly TypeRacerContext _context;

    public GameResultRepository(TypeRacerContext context)
    {
        _context = context;
    }

    public async Task<List<GameResult>> GetGameResults(string userId, int? limit = null, int? offset = null)
    {

        /**
         * Returns the user's recent game results which includes 
         * individual stats from those games.
         * */




        //return await _context.GameResults
        //    .Where(x => x.UserId == userId)
        //    .ToListAsync();

        IQueryable<GameResult> query = _context.GameResults
                                                .Where(x => x.UserId == userId)
                                                .OrderByDescending(x => x.StartDate);

        if (limit.HasValue)
        {
            query = query.Take(limit.Value);
        }

        if (offset.HasValue)
        {
            query = query.Skip(offset.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<List<GameResult>> GetGamePlayers(string gameId)
    {
        IEnumerable<GameResult> players = _context.GameResults
                                            .Where(x => x.GameId == gameId)
                                            .OrderBy(x => x.Position);

        return players.ToList();
    }

    public async Task AddGameResult(UserConnection currUser, DateTime startDate, string gameId)
    {

        /**
         * Adds the user's results from a recent game to the database.
         * */

        // * Add the finalized results to a GameResult model.

        // * Upload it to the database.

        Console.WriteLine("\nFinal WPM (AddGameResult): " + currUser.Wpm);

        GameResult gameResult = new GameResult()
        {
            UserId = currUser.UserId,
            Wpm = currUser.FinalResults.FinalWpm,
            Accuracy = currUser.FinalResults.FinalAccuracy,
            Position = currUser.FinalResults.Position,
            StartDate = startDate.ToString(),
            Username = currUser.Username,
            ProfilePicturePath = currUser.ProfileImg,
            PlayerCount = currUser.FinalResults.PlayerCount,
            GameId = gameId
        };

        _context.GameResults.Add(gameResult);

        await _context.SaveChangesAsync();



    }
}
