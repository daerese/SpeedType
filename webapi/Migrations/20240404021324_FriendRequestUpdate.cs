using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webapi.Migrations
{
    public partial class FriendRequestUpdate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FromProfilePicturePath",
                table: "FriendRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FromUserName",
                table: "FriendRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ToProfilePicturePath",
                table: "FriendRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ToUserName",
                table: "FriendRequests",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FromProfilePicturePath",
                table: "FriendRequests");

            migrationBuilder.DropColumn(
                name: "FromUserName",
                table: "FriendRequests");

            migrationBuilder.DropColumn(
                name: "ToProfilePicturePath",
                table: "FriendRequests");

            migrationBuilder.DropColumn(
                name: "ToUserName",
                table: "FriendRequests");
        }
    }
}
