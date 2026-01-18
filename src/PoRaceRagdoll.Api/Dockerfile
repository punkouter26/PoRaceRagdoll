# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy Directory.Build.props and Directory.Packages.props for Central Package Management
COPY Directory.Build.props ./
COPY Directory.Packages.props ./

# Copy project file and restore dependencies
COPY src/PoRaceRagdoll.Api/PoRaceRagdoll.Api.csproj ./src/PoRaceRagdoll.Api/
RUN dotnet restore ./src/PoRaceRagdoll.Api/PoRaceRagdoll.Api.csproj

# Copy source code and build
COPY src/PoRaceRagdoll.Api/ ./src/PoRaceRagdoll.Api/
WORKDIR /src/src/PoRaceRagdoll.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copy published output
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "PoRaceRagdoll.Api.dll"]
