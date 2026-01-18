using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PoRaceRagdoll.Api.Models;
using System.Reflection;

namespace PoRaceRagdoll.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly HealthCheckService _healthCheckService;

    public HealthController(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    /// <summary>
    /// Health check endpoint that validates all dependencies
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(HealthStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(HealthStatusResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetHealth()
    {
        var report = await _healthCheckService.CheckHealthAsync();

        var version = Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
            .InformationalVersion ?? "1.0.0";

        var result = new HealthStatusResponse(
            Status: report.Status.ToString(),
            Version: version,
            Timestamp: DateTime.UtcNow,
            Dependencies: report.Entries.ToDictionary(
                e => e.Key,
                e => e.Value.Status.ToString()
            )
        );

        return report.Status == HealthStatus.Healthy
            ? Ok(result)
            : StatusCode(StatusCodes.Status503ServiceUnavailable, result);
    }
}
