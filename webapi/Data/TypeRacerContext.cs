using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Configuration;
using webapi.Models.DatabaseModels;

/**
 * TypeRacerContext.cs
 * 
 * This class is the database context for the TypeRacer application.
 * It inherits from DbContext and provides access to the database tables
 * through DbSet properties. It also configures the database connection
 * using the provided configuration.
 * 
 * SIMPLE TERMS: This class is like a bridge between the application 
 * and the database. It allows the application to read from and write to 
 * the database tables (like Users, GameResults, Friends, and FriendRequests) 
 * using C# objects instead of raw SQL queries.
 *
 **/

namespace webapi.Data
{
    public class TypeRacerContext : DbContext
    {

        // 
        protected readonly IConfiguration Configuration;

        // It allows the application to access configuration settings, 
        // such as database connection strings, from the appsettings.json file or other configuration sources.
        public TypeRacerContext(IConfiguration configuration)
        {
            Configuration = configuration;
        }


        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
                
            //optionsBuilder.UseSqlServer(@"Data Source=(localdb)\MSSQLLocalDB;Initial Catalog=TypeRacerDB;Integrated Security=True");

            // This line configures the database connection to use PostgreSQL with
            // the connection string named "cockroach" from the configuration settings.
            optionsBuilder.UseNpgsql(Configuration.GetConnectionString("cockroach"));

        }

        /**
         * DbSet properties represent the tables in the database.
         * Each DbSet corresponds to a table, and each entity in the DbSet corresponds to a row in that table.
         * 
         * For example, the Users DbSet represents the Users table in the database, 
         * and each User object represents a row in that table.
         * 
         **/

        public DbSet<User> Users { get; set; }

        public DbSet<GameResult> GameResults { get; set; }

        public DbSet<Friend> Friends { get; set; }

        public DbSet<FriendRequest> FriendRequests { get; set; }

    }
}
