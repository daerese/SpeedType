using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webapi.Models.DatabaseModels
{
    public class FriendRequest
    {

        [Key]
        public int RequestId { get; set; }

        public string FromUserId { get; set; }

        public string FromUsername { get; set; }

        public string FromProfilePicturePath { get; set; }

        public string ToUserId { get; set; }

        public string ToUsername { get; set; }

        public string ToProfilePicturePath { get; set; }

        public bool Viewed { get; set; }
        
        public string DateSent { get; set; }

    }
}
