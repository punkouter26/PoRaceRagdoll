using FluentAssertions;
using Moq;
using PoRaceRagdoll.Api.Services;

namespace PoRaceRagdoll.Api.UnitTests;

public class OddsServiceTests
{
    private readonly OddsService _sut = new();

    [Theory]
    [InlineData(70, 20)]    // Human default mass
    [InlineData(120, 20)]   // Dino heavy mass
    [InlineData(30, 20)]    // Snake light mass
    public void CalculateOdds_ShouldReturnValidOdds(double mass, double slopeAngle)
    {
        // Act
        var odds = _sut.CalculateOdds(mass, slopeAngle);

        // Assert - American odds should be reasonable values
        odds.Should().BeInRange(-1000, 1000);
    }

    [Theory]
    [InlineData(100, 200, true, 300)]   // Positive odds: bet * (odds/100) + bet
    [InlineData(100, -200, true, 150)]  // Negative odds: bet * (100/abs(odds)) + bet
    [InlineData(100, 200, false, 0)]    // Lost bet: 0
    [InlineData(100, -150, false, 0)]   // Lost bet: 0
    public void CalculatePayout_ShouldReturnCorrectAmount(int betAmount, int odds, bool playerWon, int expectedPayout)
    {
        // Act
        var payout = _sut.CalculatePayout(betAmount, odds, playerWon);

        // Assert
        payout.Should().Be(expectedPayout);
    }
}

public class RacerServiceTests
{
    [Fact]
    public void GenerateRacers_ShouldReturn8Racers()
    {
        // Arrange
        var oddsService = new OddsService();
        var sut = new RacerService(oddsService);

        // Act
        var racers = sut.GenerateRacers();

        // Assert
        racers.Should().HaveCount(8);
    }

    [Fact]
    public void GenerateRacers_AllRacersShouldHaveUniqueIds()
    {
        // Arrange
        var oddsService = new OddsService();
        var sut = new RacerService(oddsService);

        // Act
        var racers = sut.GenerateRacers();

        // Assert
        racers.Select(r => r.Id).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void GenerateRacers_AllRacersShouldHaveValidMass()
    {
        // Arrange
        var oddsService = new OddsService();
        var sut = new RacerService(oddsService);

        // Act
        var racers = sut.GenerateRacers();

        // Assert
        racers.Should().AllSatisfy(r => r.Mass.Should().BeGreaterThan(0));
    }

    [Fact]
    public void GetAvailableSpecies_ShouldReturn8Species()
    {
        // Arrange
        var oddsService = new OddsService();
        var sut = new RacerService(oddsService);

        // Act
        var species = sut.GetAvailableSpecies();

        // Assert
        species.Should().HaveCount(8);
    }
}

public class GameSessionServiceTests
{
    private readonly GameSessionService _sut;
    private readonly Mock<IRacerService> _racerServiceMock;
    private readonly Mock<IOddsService> _oddsServiceMock;

    public GameSessionServiceTests()
    {
        _racerServiceMock = new Mock<IRacerService>();
        _oddsServiceMock = new Mock<IOddsService>();

        _racerServiceMock.Setup(r => r.GenerateRacers())
            .Returns(Enumerable.Range(0, 8).Select(i => new Models.Racer(
                i, $"Racer {i}", "Human", "human", "#FFCCAA", 70, 100
            )).ToList());

        _sut = new GameSessionService(_racerServiceMock.Object, _oddsServiceMock.Object);
    }

    [Fact]
    public void CreateSession_ShouldReturnNewSessionId()
    {
        // Act
        var sessionId = _sut.CreateSession();

        // Assert
        sessionId.Should().NotBeNullOrEmpty();
        sessionId.Should().HaveLength(32); // GUID without hyphens
    }

    [Fact]
    public void GetSession_WithValidId_ShouldReturnGameState()
    {
        // Arrange
        var sessionId = _sut.CreateSession();

        // Act
        var state = _sut.GetSession(sessionId);

        // Assert
        state.Should().NotBeNull();
        state!.Balance.Should().Be(GameConfig.InitialBalance);
        state.Round.Should().Be(1);
        state.State.Should().Be("BETTING");
    }

    [Fact]
    public void GetSession_WithInvalidId_ShouldReturnNull()
    {
        // Act
        var state = _sut.GetSession("invalid-session-id");

        // Assert
        state.Should().BeNull();
    }

    [Fact]
    public void PlaceBet_ShouldTransitionToRacing()
    {
        // Arrange
        var sessionId = _sut.CreateSession();

        // Act
        var state = _sut.PlaceBet(sessionId, 0);

        // Assert
        state.Should().NotBeNull();
        state!.State.Should().Be("RACING");
        state.SelectedRacerId.Should().Be(0);
        state.Balance.Should().Be(GameConfig.InitialBalance - GameConfig.InitialBet);
    }

    [Fact]
    public void PlaceBet_WithInvalidRacerId_ShouldNotChangeState()
    {
        // Arrange
        var sessionId = _sut.CreateSession();

        // Act
        var state = _sut.PlaceBet(sessionId, 99);

        // Assert
        state.Should().NotBeNull();
        state!.State.Should().Be("BETTING");
    }

    [Fact]
    public void PlaceBet_WhenNotBetting_ShouldNotChangeState()
    {
        // Arrange
        var sessionId = _sut.CreateSession();
        _sut.PlaceBet(sessionId, 0); // Transition to RACING

        // Act
        var state = _sut.PlaceBet(sessionId, 1); // Try to bet again

        // Assert
        state.Should().NotBeNull();
        state!.State.Should().Be("RACING");
        state.SelectedRacerId.Should().Be(0); // Original selection unchanged
    }

    [Fact]
    public void FinishRace_WhenPlayerWins_ShouldIncreasBalance()
    {
        // Arrange
        _oddsServiceMock.Setup(o => o.CalculatePayout(It.IsAny<int>(), It.IsAny<int>(), true))
            .Returns(200);
        
        var sessionId = _sut.CreateSession();
        var stateAfterBet = _sut.PlaceBet(sessionId, 0);
        var balanceAfterBet = stateAfterBet!.Balance;

        // Act
        var (state, result) = _sut.FinishRace(sessionId, 0); // Same racer wins

        // Assert
        state.Should().NotBeNull();
        state!.State.Should().Be("FINISHED");
        result.Should().NotBeNull();
        result!.PlayerWon.Should().BeTrue();
    }

    [Fact]
    public void FinishRace_WhenPlayerLoses_ShouldNotChangeBalance()
    {
        // Arrange
        var sessionId = _sut.CreateSession();
        _sut.PlaceBet(sessionId, 0);
        var stateAfterBet = _sut.GetSession(sessionId);
        var balanceAfterBet = stateAfterBet!.Balance;

        // Act
        var (state, result) = _sut.FinishRace(sessionId, 5); // Different racer wins

        // Assert
        state.Should().NotBeNull();
        state!.State.Should().Be("FINISHED");
        state.Balance.Should().Be(balanceAfterBet); // No change
        result.Should().NotBeNull();
        result!.PlayerWon.Should().BeFalse();
    }

    [Fact]
    public void NextRound_ShouldResetStateForNewRound()
    {
        // Arrange
        var sessionId = _sut.CreateSession();
        _sut.PlaceBet(sessionId, 0);
        _sut.FinishRace(sessionId, 0);

        // Act
        var state = _sut.NextRound(sessionId);

        // Assert
        state.Should().NotBeNull();
        state!.State.Should().Be("BETTING");
        state.Round.Should().Be(2);
        state.SelectedRacerId.Should().BeNull();
        state.WinnerId.Should().BeNull();
    }
}
