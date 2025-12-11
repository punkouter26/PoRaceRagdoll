// src/physics/world.js
import * as CANNON from 'cannon-es';

// Collision groups
export const COLLISION_GROUPS = {
    RACER: 1,
    ENVIRONMENT: 2
};

export function createPhysicsWorld() {
    const world = new CANNON.World();
    
    // Gravity
    world.gravity.set(0, -9.81, 0);
    
    // Solver settings for stable ragdolls
    world.solver.iterations = 20;
    world.solver.tolerance = 0.001;
    
    // Broadphase for performance
    world.broadphase = new CANNON.SAPBroadphase(world);
    
    // Enable sleeping for performance
    world.allowSleep = true;
    
    // Default contact material
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
        friction: 0.3,
        restitution: 0.2
    });
    world.addContactMaterial(defaultContactMaterial);
    world.defaultContactMaterial = defaultContactMaterial;
    
    return world;
}

// Material definitions
export const MATERIALS = {
    racer: new CANNON.Material('racer'),
    ground: new CANNON.Material('ground'),
    obstacle: new CANNON.Material('obstacle')
};

// Contact materials for different interactions
export function setupContactMaterials(world) {
    // Racer on ground - LOW friction for sliding down ramp
    const racerGround = new CANNON.ContactMaterial(MATERIALS.racer, MATERIALS.ground, {
        friction: 0.05,
        restitution: 0.2
    });
    world.addContactMaterial(racerGround);
    
    // Racer on obstacle - bouncy
    const racerObstacle = new CANNON.ContactMaterial(MATERIALS.racer, MATERIALS.obstacle, {
        friction: 0.1,
        restitution: 0.5
    });
    world.addContactMaterial(racerObstacle);
    
    // Racer on racer - some friction
    const racerRacer = new CANNON.ContactMaterial(MATERIALS.racer, MATERIALS.racer, {
        friction: 0.2,
        restitution: 0.3
    });
    world.addContactMaterial(racerRacer);
}
