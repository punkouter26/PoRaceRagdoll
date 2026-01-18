// PoRaceRagdoll Core Infrastructure Module
// Deploys: Container Registry, Container App Environment, Container App, Log Analytics, Managed Identity

// =====================================================
// Parameters
// =====================================================

@description('The environment name')
param environmentName string

@description('Location for resources')
param location string

@description('Resource token for unique naming')
param resourceToken string

@description('Tags to apply to all resources')
param tags object

// =====================================================
// Variables
// =====================================================

// Resource names (alphanumeric only, max 32 chars)
var managedIdentityName = 'azmi${resourceToken}'
var containerRegistryName = 'azacr${resourceToken}'
var logAnalyticsName = 'azlaw${resourceToken}'
var containerAppEnvName = 'azcae${resourceToken}'
var containerAppName = 'azcaapi${resourceToken}'

// AcrPull role definition ID
var acrPullRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

// =====================================================
// User-Assigned Managed Identity
// =====================================================

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: managedIdentityName
  location: location
  tags: tags
}

// =====================================================
// Container Registry
// =====================================================

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-06-01-preview' = {
  name: containerRegistryName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    anonymousPullEnabled: false
  }
}

// =====================================================
// ACR Pull Role Assignment for Managed Identity
// =====================================================

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, managedIdentity.id, acrPullRoleDefinitionId)
  scope: containerRegistry
  properties: {
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleDefinitionId
  }
}

// =====================================================
// Log Analytics Workspace
// =====================================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// =====================================================
// Container App Environment
// =====================================================

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2025-01-01' = {
  name: containerAppEnvName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// =====================================================
// Container App - API
// =====================================================

resource containerApp 'Microsoft.App/containerApps@2025-01-01' = {
  name: containerAppName
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
  })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'http://localhost:3000'
            'https://localhost:3000'
          ]
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          // Initial deployment uses hello-world, will be updated by CI/CD
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 5
              periodSeconds: 10
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
  dependsOn: [
    acrPullRoleAssignment
  ]
}

// =====================================================
// Outputs
// =====================================================

output managedIdentityId string = managedIdentity.id
output managedIdentityClientId string = managedIdentity.properties.clientId
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerAppEnvironmentId string = containerAppEnvironment.id
output containerAppName string = containerApp.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
