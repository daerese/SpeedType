using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webapi.Models.DatabaseModels
{
    public class Friend
    {

        [Key]
        public int FriendId { get; set; }

        public string DateAccepted { get; set; }

        public string UserId1 { get; set; }

        public string UserId2 { get; set;}
         
    }
}
