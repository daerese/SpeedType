//namespace webapi.Models.DatabaseModels
//{
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using webapi.Models;

public class User
{

    // This attribute specifies that this property is a primary key
    //[Key]
    //public int UserId { get; set; }
    //public string Email { get; set; }
    //public string Password { get; set; }

/**
 * Models represent the data used by the application.
 * My application has two categories of models: Database Models and Non-Database Models.
 * This User model is an example of a Database model.
 * 
 * Think of it like a schematic for an entry into a database table. In this case
 * an object of this class would go into the Users table in the database.
 * */

[Key]
[DatabaseGenerated(DatabaseGeneratedOption.None)]
public string UserId { get; set; }

public string Username { get; set; }

public string? ProfilePicturePath { get; set; }

public string? Bio {  get; set; }

public string? Color { get; set; }

public int? AverageWpm { get; set; }

public int? AverageAccuracy { get; set; }

public int? BestWpm { get; set; }

public int GamesPlayed { get; set; }

public ICollection<GameResult>? GameResults { get; set; } = new List<GameResult>();

public override string ToString()
{
    return $"Username: {Username}\n AverageWPM: {AverageWpm}\n Average Accuracy: {AverageAccuracy}";
}


}
//}
