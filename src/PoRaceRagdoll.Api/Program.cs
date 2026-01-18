using PoRaceRagdoll.Api.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddSingleton<IOddsService, OddsService>();
builder.Services.AddSingleton<IRacerService, RacerService>();
builder.Services.AddSingleton<IGameSessionService, GameSessionService>();

// Controllers
builder.Services.AddControllers();

// OpenAPI (built-in .NET 10)
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info.Title = "PoRaceRagdoll API";
        document.Info.Version = "v1";
        document.Info.Description = "API for the PoRaceRagdoll 3D Ragdoll Racing Betting Game";
        return Task.CompletedTask;
    });
});

// Health checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("PoRaceRagdoll API")
               .WithTheme(ScalarTheme.BluePlanet)
               .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

app.UseCors("AllowFrontend");

app.MapControllers();

// Health check endpoint via standard middleware
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // Just check if app is running
});

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.Run();

// Needed for integration tests
public partial class Program { }
