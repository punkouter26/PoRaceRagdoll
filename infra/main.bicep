// PoRaceRagdoll Infrastructure - Uses Shared Resources from PoShared
// Resource Group: PoRaceRagdoll
// Shared Resources: acrposhared, cae-poshared, mi-poshared-apps (from PoShared)

targetScope = 'resourceGroup'

// =====================================================
// Parameters
// =====================================================

@description('Container image to deploy')
param containerImage string = 'acrposhared.azurecr.io/poraceragdoll-api:latest'

@description('Primary location for resources')
param location string = resourceGroup().location

// =====================================================
// Existing Shared Resources (from PoShared)
// =====================================================

resource sharedEnvironment 'Microsoft.App/managedEnvironments@2025-01-01' existing = {
  name: 'cae-poshared'
  scope: resourceGroup('PoShared')
}

resource sharedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' existing = {
  name: 'mi-poshared-apps'
  scope: resourceGroup('PoShared')
}

// =====================================================
// Container App - API
// =====================================================

resource containerApp 'Microsoft.App/containerApps@2025-01-01' = {
  name: 'poraceragdoll-api'
  location: location
  tags: {
    project: 'PoRaceRagdoll'
    'azd-service-name': 'api'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${sharedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: sharedEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        transport: 'auto'
      }
      registries: [
        {
          server: 'acrposhared.azurecr.io'
          identity: sharedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'poraceragdoll-api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:8080'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// =====================================================
// Outputs
// =====================================================

output containerAppName string = containerApp.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
