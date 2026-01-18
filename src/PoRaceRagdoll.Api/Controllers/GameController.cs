using Microsoft.AspNetCore.Mvc;
using PoRaceRagdoll.Api.Models;
using PoRaceRagdoll.Api.Services;

namespace PoRaceRagdoll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly IGameSessionService _gameSessionService;
    private readonly IRacerService _racerService;

    public GameController(IGameSessionService gameSessionService, IRacerService racerService)
    {
        _gameSessionService = gameSessionService;
        _racerService = racerService;
    }

    /// <summary>
    /// Creates a new game session
    /// </summary>
    [HttpPost("session")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult CreateSession()
    {
        var sessionId = _gameSessionService.CreateSession();
        var state = _gameSessionService.GetSession(sessionId);

        return Ok(new { sessionId, state });
    }

    /// <summary>
    /// Gets the current game state for a session
    /// </summary>
    [HttpGet("session/{sessionId}")]
    [ProducesResponseType(typeof(GameState), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetSession(string sessionId)
    {
        var state = _gameSessionService.GetSession(sessionId);

        if (state is null)
        {
            return NotFound(new { error = "Session not found" });
        }

        return Ok(state);
    }

    /// <summary>
    /// Places a bet on a racer
    /// </summary>
    [HttpPost("session/{sessionId}/bet")]
    [ProducesResponseType(typeof(GameState), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult PlaceBet(string sessionId, [FromBody] PlaceBetRequest request)
    {
        var state = _gameSessionService.PlaceBet(sessionId, request.RacerId);

        if (state is null)
        {
            return NotFound(new { error = "Session not found" });
        }

        return Ok(state);
    }

    /// <summary>
    /// Finishes the race and calculates results
    /// </summary>
    [HttpPost("session/{sessionId}/finish")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult FinishRace(string sessionId, [FromBody] FinishRaceRequest request)
    {
        var (state, result) = _gameSessionService.FinishRace(sessionId, request.WinnerId);

        if (state is null)
        {
            return NotFound(new { error = "Session not found" });
        }

        return Ok(new { state, result });
    }

    /// <summary>
    /// Advances to the next round
    /// </summary>
    [HttpPost("session/{sessionId}/next")]
    [ProducesResponseType(typeof(GameState), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult NextRound(string sessionId)
    {
        var state = _gameSessionService.NextRound(sessionId);

        if (state is null)
        {
            return NotFound(new { error = "Session not found" });
        }

        return Ok(state);
    }

    /// <summary>
    /// Gets available racer species and their base stats
    /// </summary>
    [HttpGet("species")]
    [ProducesResponseType(typeof(IReadOnlyList<RacerSpecies>), StatusCodes.Status200OK)]
    public IActionResult GetSpecies()
    {
        return Ok(_racerService.GetAvailableSpecies());
    }
}
