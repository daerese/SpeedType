//using Auth0.AspNetCore.Authentication;
using Auth0.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using webapi.Data;
using webapi.Models;

using Npgsql.EntityFrameworkCore.PostgreSQL;

/**
 * Program.cs
 * 
 * This is the main entry point of the application. It sets up the web application, configures services, and defines the HTTP request pipeline.
 * 
 * SIMPLE TERMS: This file is like the starting point of the application. It sets up the web server, adds necessary services, and defines how requests are handled.
 * 
 * 1. Add SignalR as one of the build services
 * 2. Add middleware (Routing and other stuff)
 * 3. Add our hub as an endpoint
 * 
 * 
 * 2026: The following code is a basic setup for an ASP.NET Core web application that uses SignalR for real-time communication, Entity Framework Core for database access, and JWT Bearer authentication with Auth0.
 * 
 * It configures services such as controllers, Swagger for API documentation, CORS for cross-origin requests, and authentication/authorization middleware.
 * 
 * The application also defines a SignalR hub endpoint for real-time game communication.
 * 
 **/

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

/**************************
 * Other Builder Services
 * ************************/
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//builder.Services.AddDbContext<TypeRacerContext>(options =>
//{
//    options.UseSqlServer(@"Server=(localdb)\\mssqllocaldb;Database=aspnet-53bc9b9d-9d6a-45d4-8429-2a2761773502;Trusted_Connection=True;MultipleActiveResultSets=true");
//});

// Adding the database context
builder.Services.AddDbContext<TypeRacerContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("cockroach")));


// Adding the service that accesses the database for a user
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<GameResultRepository>();
builder.Services.AddScoped<UserService>();

builder.Services.AddSingleton<IDictionary<string, UserConnection>>(opts => new Dictionary<string, UserConnection>());

builder.Services.AddSingleton<IDictionary<string, GameRoom>>(opts => new Dictionary<string, GameRoom>());

// Timer singleton
builder.Services.AddSingleton<IDictionary<string, System.Timers.Timer>>(opts => new Dictionary<string, System.Timers.Timer>());

// _gameInviteSenders singleton 
builder.Services.AddSingleton<IDictionary<string, InviteSender>>(opts => new Dictionary<string, InviteSender>());

// _gameInviteReceivers singleton
builder.Services.AddSingleton<IDictionary<string, Dictionary<string, InviteReceived>>>(opts => new Dictionary<string, Dictionary<string, InviteReceived>>());

//IDictionary<string, Dictionary<string, bool>> gameInvitesSender,
//                IDictionary<string, List<Invite>> gameInvitesReceiver,


// 1. Add SignalR as one of the build services
builder.Services.AddSignalR();

// Optional --> CORS (In case your React project is in a different coding enviornment)
//      - Different ports

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("https://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// 1. Add Authentication Services (API)
//builder.Services.AddAuthentication(options =>
//{
//    // Setting 
//    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//    //options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//}).AddJwtBearer(options =>
//{
//    options.Authority = "https://dev-w5kn5y38eszy14v4.us.auth0.com/";
//    options.Audience = "https://localhost:7229";

//    // * Token validation?
//    options.TokenValidationParameters = new TokenValidationParameters
//    {
//        ValidateAudience = true,
//        ValidateIssuer = true
//    };
//});


// 1. Add Authentication Services (PREVIOUS CONFIGURATION)
//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//        .AddJwtBearer(options =>
//        {
//            // Setting the Authority and Audience for Auth0
//            options.Authority = "https://dev-w5kn5y38eszy14v4.us.auth0.com/";
//            options.Audience = "https://localhost:7229"; ;

//            options.TokenValidationParameters = new TokenValidationParameters
//            {
//                ValidateAudience = true,
//                ValidateIssuerSigningKey = true
//            };
//});

// 1. Add Authentication Services (NEW CONFIGURATION)
/**
 * Auth0 + JWT Bearer Authentication Configuration
 * */
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {

        /**
         * 2026: THe following string code ensures that the auth0 Domain for this project
         * starts with HTTPS. THe authority NEEDS to be a full URL with https:// prefix. 
         * */
        var authority = builder.Configuration["Auth0:Domain"];

        // ? Ensure the authority has the https:// prefix and trailing slash
        if (!authority.StartsWith("https://"))
        {
            authority = "https://" + authority;
        }
        if (!authority.EndsWith("/"))
        {
            authority += "/";
        }


        //options.Authority = builder.Configuration["Auth0:Domain"]; // e.g. https://dev-xxxx.us.auth0.com/
        options.Authority = authority; // e.g. https://dev-xxxx.us.auth0.com/
        options.Audience = builder.Configuration["Auth0:Audience"]; // e.g. https://localhost:7229


        /**
         * 2026: Program.cs is configured to use Auth0 with HTTPS-only metadata retrieval. But we're in development,
         * so some request will be HTTP and not HTTPS. 
         * The following line tells the JWT Bearer middleware to only require HTTPS metadata in production. 
         * In development, it will work with HTTP.
         * */
        options.RequireHttpsMetadata = false; //2026 CHANGE: CHANGE THIS TO TRUE IN PRODUCTION. FALSE FOR DEVELOPMENT.

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuerSigningKey = true
        };

        // Allow SignalR WebSocket connections to send the access token via query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"].FirstOrDefault();
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/game"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. Add middleware (Routing and other stuff)
app.UseHttpsRedirection();

/*
 * 2026 (SIDE NOTE): Cors needs to be add before routing and authentication/authorization middleware.
 * This is because SignalR websocket connections need CORS middleware to run before routing.
 * */
app.UseCors();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();


/*
 * 2026 (SIDE NOTE): Authentication and authorization must run BEFORE the hub is mapped so SignalR can 
 * authenticate the connection. 
 * */
app.MapControllers();

// 3. Add our hub as an endpoint
app.MapHub<GameHub>("/game");




app.Run();
