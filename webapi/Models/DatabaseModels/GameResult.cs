//namespace webapi.Models
//{
using System.ComponentModel.DataAnnotations;

public class GameResult
{
        
    public string UserId { get; set; }

    public string Username { get; set; }

    public string ProfilePicturePath { get; set; }

    [Key]
    public int ResultId { get; set; }

    public string GameId { get; set; }

    public int Wpm {  get; set; }

    public int Accuracy { get; set; }

    public int Position { get; set; }

    public string StartDate { get; set; }

    public int PlayerCount { get; set; }

        

}
//}
