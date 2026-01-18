using PoRaceRagdoll.Api.Models;

namespace PoRaceRagdoll.Api.Services;

public interface IRacerService
{
    IReadOnlyList<RacerSpecies> GetAvailableSpecies();
    IReadOnlyList<Racer> GenerateRacers();
}

public sealed class RacerService : IRacerService
{
    private readonly IOddsService _oddsService;
    private readonly Random _random = new();

    private static readonly List<RacerSpecies> AvailableSpecies =
    [
        new("Human", "human", 70, "#FFCCAA", "🏃"),
        new("Spider", "spider", 40, "#9932CC", "🕷️"),
        new("Dog", "dog", 50, "#CD853F", "🐕"),
        new("Snake", "snake", 30, "#32CD32", "🐍"),
        new("Crab", "crab", 45, "#FF4500", "🦀"),
        new("Dino", "dino", 120, "#FF6B6B", "🦖"),
        new("Penguin", "penguin", 35, "#87CEEB", "🐧"),
        new("Alien", "alien", 60, "#00FF00", "👽")
    ];

    public RacerService(IOddsService oddsService)
    {
        _oddsService = oddsService;
    }

    public IReadOnlyList<RacerSpecies> GetAvailableSpecies() => AvailableSpecies;

    public IReadOnlyList<Racer> GenerateRacers()
    {
        var racers = new List<Racer>();

        for (var i = 0; i < 8; i++)
        {
            var species = AvailableSpecies[_random.Next(AvailableSpecies.Count)];
            var massVariance = (_random.NextDouble() * 10) - 5;
            var finalMass = Math.Max(10, species.Mass + massVariance);
            var odds = _oddsService.CalculateOdds(finalMass, GameConfig.SlopeAngle);

            racers.Add(new Racer(
                Id: i,
                Name: $"{species.Name} {i + 1}",
                Species: species.Name,
                Type: species.Type,
                Color: species.Color,
                Mass: Math.Round(finalMass, 1),
                Odds: odds
            ));
        }

        return racers;
    }
}
