using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webapi.Migrations
{
    public partial class minorFriendRequestChange : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ToUserName",
                table: "FriendRequests",
                newName: "ToUsername");

            migrationBuilder.RenameColumn(
                name: "FromUserName",
                table: "FriendRequests",
                newName: "FromUsername");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ToUsername",
                table: "FriendRequests",
                newName: "ToUserName");

            migrationBuilder.RenameColumn(
                name: "FromUsername",
                table: "FriendRequests",
                newName: "FromUserName");
        }
    }
}
