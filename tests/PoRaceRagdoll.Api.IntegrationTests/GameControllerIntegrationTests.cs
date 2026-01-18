using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using PoRaceRagdoll.Api.Models;

namespace PoRaceRagdoll.Api.IntegrationTests;

public class GameControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public GameControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateSession_ShouldReturnOkWithSessionId()
    {
        // Act
        var response = await _client.PostAsync("/api/game/session", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<SessionResponse>();
        content.Should().NotBeNull();
        content!.SessionId.Should().NotBeNullOrEmpty();
        content.State.Should().NotBeNull();
    }

    [Fact]
    public async Task GetSession_WithValidSessionId_ShouldReturnGameState()
    {
        // Arrange
        var createResponse = await _client.PostAsync("/api/game/session", null);
        var sessionData = await createResponse.Content.ReadFromJsonAsync<SessionResponse>();

        // Act
        var response = await _client.GetAsync($"/api/game/session/{sessionData!.SessionId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var state = await response.Content.ReadFromJsonAsync<GameState>();
        state.Should().NotBeNull();
        state!.Balance.Should().Be(1000);
        state.Round.Should().Be(1);
    }

    [Fact]
    public async Task GetSession_WithInvalidSessionId_ShouldReturn404()
    {
        // Act
        var response = await _client.GetAsync("/api/game/session/invalid-session-id");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PlaceBet_ShouldTransitionToRacing()
    {
        // Arrange
        var createResponse = await _client.PostAsync("/api/game/session", null);
        var sessionData = await createResponse.Content.ReadFromJsonAsync<SessionResponse>();

        // Act
        var betRequest = new PlaceBetRequest(0);
        var response = await _client.PostAsJsonAsync($"/api/game/session/{sessionData!.SessionId}/bet", betRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var state = await response.Content.ReadFromJsonAsync<GameState>();
        state.Should().NotBeNull();
        state!.State.Should().Be("RACING");
        state.SelectedRacerId.Should().Be(0);
        state.Balance.Should().Be(900); // 1000 - 100 bet
    }

    [Fact]
    public async Task FinishRace_ShouldReturnResult()
    {
        // Arrange
        var createResponse = await _client.PostAsync("/api/game/session", null);
        var sessionData = await createResponse.Content.ReadFromJsonAsync<SessionResponse>();
        
        await _client.PostAsJsonAsync($"/api/game/session/{sessionData!.SessionId}/bet", new PlaceBetRequest(0));

        // Act
        var finishRequest = new FinishRaceRequest(0);
        var response = await _client.PostAsJsonAsync($"/api/game/session/{sessionData.SessionId}/finish", finishRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetSpecies_ShouldReturn8Species()
    {
        // Act
        var response = await _client.GetAsync("/api/game/species");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var species = await response.Content.ReadFromJsonAsync<List<RacerSpecies>>();
        species.Should().NotBeNull();
        species.Should().HaveCount(8);
    }

    private record SessionResponse(string SessionId, GameState State);
}

public class HealthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ShouldReturnOk()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var health = await response.Content.ReadFromJsonAsync<HealthStatusResponse>();
        health.Should().NotBeNull();
        health!.Status.Should().Be("Healthy");
    }

    [Fact]
    public async Task HealthLive_ShouldReturnOk()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
