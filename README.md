# PoRaceRagdoll

A 3D physics-based ragdoll racing betting game built with Next.js (App Router) and .NET 10 API.

## 🏗️ Architecture

```
PoRaceRagdoll/
├── src/
│   ├── PoRaceRagdoll.Api/        # .NET 10 Web API
│   └── poraceragdoll-web/         # Next.js 15+ App Router frontend
├── tests/
│   ├── PoRaceRagdoll.Api.UnitTests/        # xUnit unit tests
│   ├── PoRaceRagdoll.Api.IntegrationTests/ # Integration tests
│   └── PoRaceRagdoll.E2E/                  # Playwright E2E tests
├── docs/
│   └── mermaid/                   # Architecture diagrams
├── Directory.Build.props          # Shared build properties
├── Directory.Packages.props       # Central Package Management
└── PoRaceRagdoll.sln             # Visual Studio solution
```

## 🚀 Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- pnpm (recommended) or npm

### Running the API

```bash
cd src/PoRaceRagdoll.Api
dotnet run
```

The API will be available at `http://localhost:5000`
- Swagger UI: `http://localhost:5000/swagger`
- Health Check: `http://localhost:5000/health`

### Running the Frontend

```bash
cd src/poraceragdoll-web
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Running Both (Development)

For the best development experience, run both in separate terminals:

**Terminal 1 - API:**
```bash
cd src/PoRaceRagdoll.Api && dotnet watch run
```

**Terminal 2 - Frontend:**
```bash
cd src/poraceragdoll-web && npm run dev
```

## 🧪 Testing

### Unit Tests
```bash
cd tests/PoRaceRagdoll.Api.UnitTests
dotnet test
```

### Integration Tests
```bash
cd tests/PoRaceRagdoll.Api.IntegrationTests
dotnet test
```

### E2E Tests (Playwright)
```bash
cd tests/PoRaceRagdoll.E2E
npm install
npx playwright install chromium
npm test
```

### Run All .NET Tests
```bash
dotnet test PoRaceRagdoll.sln
```

## 🎮 Game Features

- **8 Unique Racers**: Each species has different physical attributes affecting racing performance
- **Physics-Based Racing**: Real-time ragdoll physics using Cannon.js
- **Betting System**: Place bets on racers with dynamic odds
- **5-Round Tournament**: Track your winnings across multiple races
- **3D Visualization**: Three.js powered race visualization

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/game/species` | Get all racer species |
| POST | `/api/game/session` | Create new game session |
| GET | `/api/game/session/{id}` | Get session by ID |
| POST | `/api/game/session/{id}/bet` | Place a bet |
| POST | `/api/game/session/{id}/finish-race` | Complete a race |

## 🛠️ Tech Stack

### Backend
- .NET 10 Web API
- ASP.NET Core
- Azure.Identity for authentication
- Swagger/OpenAPI

### Frontend
- Next.js 15+ (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Three.js + Cannon-es (physics)
- Zustand (state management)

### Testing
- xUnit + FluentAssertions + Moq (unit tests)
- WebApplicationFactory + Testcontainers (integration)
- Playwright (E2E - Chromium + Mobile Chrome)

## 📦 Project Standards

- **Central Package Management**: All NuGet versions in `Directory.Packages.props`
- **Strict Compilation**: `TreatWarningsAsErrors=true` in `Directory.Build.props`
- **Naming Convention**: `PoRaceRagdoll` prefix for all .NET projects
- **Health Endpoint**: `/health` for container orchestration

## 🌐 Deployment

The project is designed for Azure deployment:
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service or Azure Container Apps
- **Authentication**: DefaultAzureCredential

## 📄 License

MIT
