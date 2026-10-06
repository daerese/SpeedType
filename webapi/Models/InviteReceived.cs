

public class InviteReceived
{

    public string SenderUsername { get; set; }

    public string SenderUserId { get; set; }

    public string SenderProfilePicturePath { get; set; }

    // 2026: The sender's color, so their avatar shows in their color in the invites menu
    public string? SenderColor { get; set; }

    public string RoomId { get; set; }

}