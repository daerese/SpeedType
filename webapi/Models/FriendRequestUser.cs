
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;
using System.Text;

public class FriendRequestUser
{

    public string UserId { get; set; }

    public string Username { get; set; }

    public string ProfilePicturePath { get; set; }

    public override string ToString()
    {
        StringBuilder sb = new StringBuilder();

        sb.AppendLine($"Id: {UserId}");
        sb.AppendLine($"Name: {Username}");
        sb.AppendLine($"Picture: {ProfilePicturePath}");
        

        return sb.ToString();
    }

}