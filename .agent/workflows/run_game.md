---
description: Run the PoRaceRagdoll game locally
---

## Start the API Server
```bash
cd src/PoRaceRagdoll.Api
dotnet run
```
API runs at: http://localhost:5155

## Start the Next.js Frontend
```bash
cd src/poraceragdoll-web
npm run dev
```
Frontend runs at: http://localhost:3000

## Run Tests
```bash
# Unit Tests
dotnet test tests/PoRaceRagdoll.Api.UnitTests

# Integration Tests
dotnet test tests/PoRaceRagdoll.Api.IntegrationTests

# E2E Tests (requires frontend and API running)
cd tests/PoRaceRagdoll.E2E
npx playwright test
```
