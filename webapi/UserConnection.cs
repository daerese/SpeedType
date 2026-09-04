//namespace webapi

using webapi.Models;

public class UserConnection
{
    public string RoomName { get; set; }

    public string RoomId { get; set; }

    public string Username { get; set; }

    public string UserId {  get; set; }

    public string Color { get; set; }
    
    public string ProfileImg { get; set; }

    // ? The connectionId is here because when a receiver receives a friend request, 
    // ? I won't have access to their connectionId. 
    public string ConnectionId { get; set; }

    //public bool IsHost { get; set; }

    // True = The user is currently finding/joining a game
    //public bool IsMatchmaking { get; set; }

    public double Progress { get; set; }
    
    // The user's WPM for this game
    public int Wpm { get; set; }

    // The user's average WPM for all games they've played. Used for Matchmaking
    public int? AverageWpm { get; set; }

    public int Accuracy { get; set; }

    public bool Finished { get; set; }

    public FinalResults FinalResults { get; set; }


    public override string ToString()
    {
        return $"Room: {RoomName}\nRoom ID: {RoomId}\nUser: {Username}\nOverall WPM from recent games: {AverageWpm}\nColor: {Color}\nProgress: {Progress}\nWpm: {Wpm}\nFinished: {Finished}\nAccuracy: {Accuracy}\n Profile Picture: {ProfileImg}\nFinalResults:\n{FinalResults}\n";
    }

    public UserConnection Copy()
    {
        UserConnection copy = new UserConnection
        {
            RoomName = this.RoomName,
            RoomId = this.RoomId,
            Username = this.Username,
            UserId = this.UserId,
            Color = this.Color,
            ProfileImg = this.ProfileImg,
            Progress = this.Progress,
            Wpm = this.Wpm,
            AverageWpm = this.AverageWpm,
            Accuracy = this.Accuracy,
            Finished = this.Finished,
            FinalResults = this.FinalResults
        };

        return copy;
    }


}

