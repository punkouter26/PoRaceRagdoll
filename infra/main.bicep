// PoRaceRagdoll Infrastructure - Azure Container Apps Deployment
// Resource Group: PoRaceRagdoll
// Subscription: Punkouter26 (Bbb8dfbe-9169-432f-9b7a-fbf861b51037)

targetScope = 'subscription'

// =====================================================
// Parameters
// =====================================================

@description('The environment name (used for resource naming)')
param environmentName string

@description('Primary location for resources')
param location string = 'eastus'

@description('Resource group name')
param resourceGroupName string = 'PoRaceRagdoll'

// =====================================================
// Variables
// =====================================================

var resourceToken = uniqueString(subscription().id, location, environmentName)
var tags = {
  'azd-env-name': environmentName
  project: 'PoRaceRagdoll'
}

// =====================================================
// Resource Group
// =====================================================

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: {
    'azd-env-name': environmentName
    project: 'PoRaceRagdoll'
  }
}

// =====================================================
// Module: Core Infrastructure
// =====================================================

module infrastructure 'modules/infrastructure.bicep' = {
  name: 'infrastructure-${resourceToken}'
  scope: rg
  params: {
    environmentName: environmentName
    location: location
    resourceToken: resourceToken
    tags: tags
  }
}

// =====================================================
// Outputs
// =====================================================

output RESOURCE_GROUP_ID string = rg.id
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = infrastructure.outputs.containerRegistryLoginServer
output AZURE_CONTAINER_REGISTRY_NAME string = infrastructure.outputs.containerRegistryName
output AZURE_CONTAINER_APP_ENVIRONMENT_ID string = infrastructure.outputs.containerAppEnvironmentId
output AZURE_CONTAINER_APP_NAME string = infrastructure.outputs.containerAppName
output AZURE_CONTAINER_APP_FQDN string = infrastructure.outputs.containerAppFqdn
output MANAGED_IDENTITY_ID string = infrastructure.outputs.managedIdentityId
output MANAGED_IDENTITY_CLIENT_ID string = infrastructure.outputs.managedIdentityClientId
