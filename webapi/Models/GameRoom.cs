using System.Text;

namespace webapi.Models
{
    public class GameRoom
    {
        /**
         * Models represent the data used by the application. 
         * My application uses two categories of models: Database Models 
         * and Non-Database Models. This GameRoom model is an example of a
         * Non-Database model. Or, a just a Game related model. 
         * */
        public bool Running { get; set; }

        public bool GameOver { get; set; }

        // Determines whether there is one player in a game thats waiting for others to join
        public bool Waiting { get; set; }

        public bool IsPreGame { get; set; }

        public Time PreGameTimer { get; set; }

        public Time Time { get; set; }
         
        public string RoomId { get; set; }

        public bool IsPrivateGame { get; set; }

        //public string RoomName { get; set; }

        public string Paragraph { get; set; }

        public Tuple<int, int>? WpmRange { get; set; }

        public int PlayerCount { get; set; }

        public string PrivateGameHostUsername { get; set; }

        //public bool Restricted { get; set; }

        // This will be used to determine who's connected to the game
        // Also used for processing.
        // * (Context.ConnectionId, userConection)
        public IDictionary<string, UserConnection> Connections { get; set; }

        // This will be used on the frontend for displaying users correctly
        // * (userConnection.Username, userConnection)
        public IDictionary<string, UserConnection> ClientUserObjects { get; set; }

        // Placements go here...
        public List<(string Username, long FinishTime)> Placements { get; set; }

        

         
        public GameRoom()
        {
            Placements = new List<(string, long)>();
        }

        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();

            sb.AppendLine("Connections:");
            foreach (var entry in Connections)
            {
                sb.AppendLine($"- ConnectionId: {entry.Key}, User: {entry.Value}");
            }

            return sb.ToString();
        }


    }
}
