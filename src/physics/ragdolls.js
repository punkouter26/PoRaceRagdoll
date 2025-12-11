// src/physics/ragdolls.js
import * as BABYLON from '@babylonjs/core';
import { RACER_SPECIES } from '../config';

export { RACER_SPECIES };

// Helper to create a physics aggregate
function createAggregate(mesh, shapeType, mass, restitution, scene, collisionFilter, damping, noPhysics) {
    if (noPhysics) return null;

    const agg = new BABYLON.PhysicsAggregate(mesh, shapeType, {
        mass: mass,
        restitution: restitution,
        friction: 0.3,
        collision: collisionFilter
    }, scene);
    agg.body.setLinearDamping(damping.linear);
    agg.body.setAngularDamping(damping.angular);
    
    // Initialize with zero velocity to prevent startup explosions
    agg.body.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
    agg.body.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
    
    return agg;
}

// ROBUST CONSTRAINT HELPER
function connectBodies(scene, bodyA, bodyB, worldPivot, limits, noPhysics) {
    if (noPhysics || !bodyA || !bodyB) return;

    // Get meshes
    const meshA = bodyA.transformNode;
    const meshB = bodyB.transformNode;

    // Calculate local pivot points
    const pivotA = BABYLON.Vector3.TransformCoordinates(worldPivot, meshA.getWorldMatrix().invert());
    const pivotB = BABYLON.Vector3.TransformCoordinates(worldPivot, meshB.getWorldMatrix().invert());

    const fullLimits = [
        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },
        ...limits
    ];

    const constraint = new BABYLON.Physics6DoFConstraint(
        {
            pivotA: pivotA,
            pivotB: pivotB,
            axisA: new BABYLON.Vector3(1, 0, 0),
            axisB: new BABYLON.Vector3(1, 0, 0),
            perpAxisA: new BABYLON.Vector3(0, 1, 0),
            perpAxisB: new BABYLON.Vector3(0, 1, 0),
            collision: false // CRITICAL: Disable collision between connected bodies
        },
        fullLimits,
        scene
    );
    bodyA.addConstraint(bodyB, constraint);
}

// Helper to create a standard material
function createMaterial(scene, species) {
    const material = new BABYLON.PBRMaterial(species.name + "_mat", scene);
    material.albedoColor = BABYLON.Color3.FromHexString(species.color);
    material.roughness = 0.5;
    material.metallic = 0.1;
    return material;
}

export function createRagdoll(scene, position, species, options = {}) {
    const {
        linearDamping = 0.8,
        angularDamping = 2.0,
        restitution = 0.1,
        noPhysics = false
    } = options;

    const damping = { linear: linearDamping, angular: angularDamping };
    const collisionFilter = { membership: 1, collideWith: 2 };
    const material = createMaterial(scene, species);

    // Dispatch to specific creator
    switch (species.type) {
        case 'spider': return createSpider(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'dog': return createDog(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'snake': return createSnake(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'crab': return createCrab(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'dino': return createDino(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'penguin': return createPenguin(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'alien': return createAlien(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
        case 'human':
        default: return createHuman(scene, position, species, material, damping, restitution, collisionFilter, noPhysics);
    }
}

// --- Creature Implementations ---

function createHuman(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    // Torso
    const torso = BABYLON.MeshBuilder.CreateBox("torso", { height: 1, width: 0.6, depth: 0.4 }, scene);
    torso.position = position.clone();
    torso.material = material;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: 0.5 }, scene);
    head.position = position.add(new BABYLON.Vector3(0, 0.9, 0));
    head.material = material;

    // Limbs
    const limbs = [];
    const limbOffsets = [
        { pos: new BABYLON.Vector3(-0.2, -1.0, 0), pivot: new BABYLON.Vector3(-0.2, -0.5, 0) }, // Leg L
        { pos: new BABYLON.Vector3(0.2, -1.0, 0), pivot: new BABYLON.Vector3(0.2, -0.5, 0) },  // Leg R
        { pos: new BABYLON.Vector3(-0.5, 0.3, 0), pivot: new BABYLON.Vector3(-0.3, 0.3, 0) },   // Arm L
        { pos: new BABYLON.Vector3(0.5, 0.3, 0), pivot: new BABYLON.Vector3(0.3, 0.3, 0) }    // Arm R
    ];

    limbOffsets.forEach((off, i) => {
        const limb = BABYLON.MeshBuilder.CreateCapsule(`limb_${i}`, { height: 0.8, radius: 0.15 }, scene);
        limb.position = position.add(off.pos);
        limb.material = material;
        limbs.push({ mesh: limb, pivot: position.add(off.pivot) }); // Store WORLD pivot
    });

    // --- PHYSICS CREATION ---
    const torsoAgg = createAggregate(torso, BABYLON.PhysicsShapeType.BOX, species.mass * 0.4, restitution, scene, collisionFilter, damping, noPhysics);
    const headAgg = createAggregate(head, BABYLON.PhysicsShapeType.SPHERE, species.mass * 0.1, restitution, scene, collisionFilter, damping, noPhysics);

    // Connect Head
    connectBodies(scene, torsoAgg?.body, headAgg?.body, position.add(new BABYLON.Vector3(0, 0.5, 0)), [
        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: -Math.PI / 4, maxLimit: Math.PI / 4 },
        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: -Math.PI / 4, maxLimit: Math.PI / 4 },
    ], noPhysics);

    const limbAggs = [];
    limbs.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.1, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) limbAggs.push(agg);
        connectBodies(scene, torsoAgg?.body, agg?.body, l.pivot, [
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: -Math.PI, maxLimit: Math.PI },
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: -Math.PI, maxLimit: Math.PI }
        ], noPhysics);
    });

    return { root: torso, parts: [torso, head, ...limbs.map(l => l.mesh)], aggregates: noPhysics ? [] : [torsoAgg, headAgg, ...limbAggs], headBody: headAgg?.body };
}

function createSpider(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const body = BABYLON.MeshBuilder.CreateSphere("spider_body", { diameter: 0.8 }, scene);
    body.position = position.clone();
    body.material = material;

    const legs = [];
    const dist = 0.8;

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);

        const leg = BABYLON.MeshBuilder.CreateCapsule(`leg_${i}`, { height: 0.8, radius: 0.1 }, scene);
        leg.position = position.add(new BABYLON.Vector3(x * dist, -0.2, z * dist));
        leg.rotation.y = -angle;
        leg.rotation.z = Math.PI / 2;
        leg.material = material;

        // Pivot is on the body surface
        const worldPivot = position.add(new BABYLON.Vector3(x * 0.4, -0.2, z * 0.4));
        legs.push({ mesh: leg, pivot: worldPivot });
    }

    const bodyAgg = createAggregate(body, BABYLON.PhysicsShapeType.SPHERE, species.mass * 0.4, restitution, scene, collisionFilter, damping, noPhysics);
    const legAggs = [];

    legs.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.05, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) legAggs.push(agg);
        connectBodies(scene, bodyAgg?.body, agg?.body, l.pivot, [
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: -1, maxLimit: 1 }
        ], noPhysics);
    });

    return { root: body, parts: [body, ...legs.map(l => l.mesh)], aggregates: noPhysics ? [] : [bodyAgg, ...legAggs], headBody: bodyAgg?.body };
}

function createDog(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const body = BABYLON.MeshBuilder.CreateBox("dog_body", { width: 0.5, height: 0.5, depth: 1.0 }, scene);
    body.position = position.clone();
    body.material = material;

    const head = BABYLON.MeshBuilder.CreateBox("dog_head", { width: 0.4, height: 0.4, depth: 0.5 }, scene);
    head.position = position.add(new BABYLON.Vector3(0, 0.4, 0.6));
    head.material = material;

    const legs = [];
    const legPos = [
        { x: -0.25, z: 0.4 }, { x: 0.25, z: 0.4 },
        { x: -0.25, z: -0.4 }, { x: 0.25, z: -0.4 }
    ];

    legPos.forEach((pos, i) => {
        const leg = BABYLON.MeshBuilder.CreateCapsule(`dog_leg_${i}`, { height: 0.6, radius: 0.1 }, scene);
        leg.position = position.add(new BABYLON.Vector3(pos.x, -0.5, pos.z));
        leg.material = material;
        // Pivot at body connection
        const worldPivot = position.add(new BABYLON.Vector3(pos.x, -0.25, pos.z));
        legs.push({ mesh: leg, pivot: worldPivot });
    });

    const bodyAgg = createAggregate(body, BABYLON.PhysicsShapeType.BOX, species.mass * 0.5, restitution, scene, collisionFilter, damping, noPhysics);
    const headAgg = createAggregate(head, BABYLON.PhysicsShapeType.BOX, species.mass * 0.1, restitution, scene, collisionFilter, damping, noPhysics);

    connectBodies(scene, bodyAgg?.body, headAgg?.body, position.add(new BABYLON.Vector3(0, 0.25, 0.5)), [], noPhysics);

    const legAggs = [];
    legs.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.1, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) legAggs.push(agg);
        connectBodies(scene, bodyAgg?.body, agg?.body, l.pivot, [
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: -1, maxLimit: 1 }
        ], noPhysics);
    });

    return { root: body, parts: [body, head, ...legs.map(l => l.mesh)], aggregates: noPhysics ? [] : [bodyAgg, headAgg, ...legAggs], headBody: headAgg?.body };
}

function createSnake(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const segments = [];
    const radius = 0.25;
    const spacing = radius * 2.2; // Increased from 1.8 to prevent segment overlap
    const segmentCount = 6;

    for (let i = 0; i < segmentCount; i++) {
        const seg = BABYLON.MeshBuilder.CreateSphere(`snake_seg_${i}`, { diameter: radius * 2 }, scene);
        seg.position = position.add(new BABYLON.Vector3(0, 0, -i * spacing));
        seg.material = material;
        segments.push(seg);
    }

    const aggs = [];
    segments.forEach((seg, i) => {
        const agg = createAggregate(seg, BABYLON.PhysicsShapeType.SPHERE, species.mass / segmentCount, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) aggs.push(agg);

        if (i > 0 && !noPhysics) {
            const worldPivot = position.add(new BABYLON.Vector3(0, 0, -(i - 0.5) * spacing));
            connectBodies(scene, aggs[i - 1]?.body, agg?.body, worldPivot, [
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: -0.5, maxLimit: 0.5 }
            ], noPhysics);
        }
    });

    return { root: segments[0], parts: segments, aggregates: noPhysics ? [] : aggs, headBody: aggs[0]?.body };
}

function createCrab(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const body = BABYLON.MeshBuilder.CreateBox("crab_body", { width: 1.2, height: 0.4, depth: 0.6 }, scene);
    body.position = position.clone();
    body.material = material;

    const legs = [];
    for (let i = 0; i < 6; i++) {
        const isRight = i < 3;
        const zOffset = ((i % 3) - 1) * 0.4;
        const xOffset = isRight ? 0.7 : -0.7;

        const leg = BABYLON.MeshBuilder.CreateCapsule(`crab_leg_${i}`, { height: 0.6, radius: 0.1 }, scene);
        leg.position = position.add(new BABYLON.Vector3(xOffset, -0.3, zOffset));
        leg.rotation.z = isRight ? -Math.PI / 4 : Math.PI / 4;
        leg.material = material;

        const worldPivot = position.add(new BABYLON.Vector3(isRight ? 0.6 : -0.6, 0, zOffset));
        legs.push({ mesh: leg, pivot: worldPivot });
    }

    const bodyAgg = createAggregate(body, BABYLON.PhysicsShapeType.BOX, species.mass * 0.5, restitution, scene, collisionFilter, damping, noPhysics);
    const legAggs = [];
    legs.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.05, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) legAggs.push(agg);
        connectBodies(scene, bodyAgg?.body, agg?.body, l.pivot, [
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: -0.5, maxLimit: 0.5 }
        ], noPhysics);
    });

    return { root: body, parts: [body, ...legs.map(l => l.mesh)], aggregates: noPhysics ? [] : [bodyAgg, ...legAggs], headBody: bodyAgg?.body };
}

function createDino(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const body = BABYLON.MeshBuilder.CreateBox("dino_body", { width: 0.6, height: 0.8, depth: 1.0 }, scene);
    body.position = position.clone();
    body.material = material;

    const head = BABYLON.MeshBuilder.CreateBox("dino_head", { width: 0.5, height: 0.6, depth: 0.8 }, scene);
    head.position = position.add(new BABYLON.Vector3(0, 0.8, 0.6));
    head.material = material;

    const tail = BABYLON.MeshBuilder.CreateBox("dino_tail", { width: 0.4, height: 0.4, depth: 1.2 }, scene);
    tail.position = position.add(new BABYLON.Vector3(0, -0.2, -1.1));
    tail.material = material;

    const legs = [];
    [-0.4, 0.4].forEach(x => {
        const leg = BABYLON.MeshBuilder.CreateCapsule("dino_leg", { height: 1.0, radius: 0.2 }, scene);
        leg.position = position.add(new BABYLON.Vector3(x, -0.9, 0));
        leg.material = material;
        const worldPivot = position.add(new BABYLON.Vector3(x, -0.4, 0));
        legs.push({ mesh: leg, pivot: worldPivot });
    });

    const bodyAgg = createAggregate(body, BABYLON.PhysicsShapeType.BOX, species.mass * 0.4, restitution, scene, collisionFilter, damping, noPhysics);
    const headAgg = createAggregate(head, BABYLON.PhysicsShapeType.BOX, species.mass * 0.1, restitution, scene, collisionFilter, damping, noPhysics);
    const tailAgg = createAggregate(tail, BABYLON.PhysicsShapeType.BOX, species.mass * 0.1, restitution, scene, collisionFilter, damping, noPhysics);

    connectBodies(scene, bodyAgg?.body, headAgg?.body, position.add(new BABYLON.Vector3(0, 0.4, 0.5)), [], noPhysics);
    connectBodies(scene, bodyAgg?.body, tailAgg?.body, position.add(new BABYLON.Vector3(0, -0.2, -0.5)), [], noPhysics);

    const legAggs = [];
    legs.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.15, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) legAggs.push(agg);
        connectBodies(scene, bodyAgg?.body, agg?.body, l.pivot, [], noPhysics);
    });

    return { root: body, parts: [body, head, tail, ...legs.map(l => l.mesh)], aggregates: noPhysics ? [] : [bodyAgg, headAgg, tailAgg, ...legAggs], headBody: headAgg?.body };
}

function createPenguin(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const body = BABYLON.MeshBuilder.CreateCapsule("penguin_body", { height: 1.2, radius: 0.4 }, scene);
    body.position = position.clone();
    body.material = material;

    const flippers = [];
    [-0.5, 0.5].forEach(x => {
        const flipper = BABYLON.MeshBuilder.CreateBox("flipper", { width: 0.1, height: 0.6, depth: 0.3 }, scene);
        const fX = x > 0 ? 0.45 : -0.45;
        flipper.position = position.add(new BABYLON.Vector3(fX, 0.2, 0));
        flipper.material = material;
        const worldPivot = position.add(new BABYLON.Vector3(x > 0 ? 0.4 : -0.4, 0.2, 0));
        flippers.push({ mesh: flipper, pivot: worldPivot });
    });

    const bodyAgg = createAggregate(body, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.7, restitution, scene, collisionFilter, damping, noPhysics);
    const flipperAggs = [];

    flippers.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.BOX, species.mass * 0.05, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) flipperAggs.push(agg);
        connectBodies(scene, bodyAgg?.body, agg?.body, l.pivot, [], noPhysics);
    });

    return { root: body, parts: [body, ...flippers.map(l => l.mesh)], aggregates: noPhysics ? [] : [bodyAgg, ...flipperAggs], headBody: bodyAgg?.body };
}

function createAlien(scene, position, species, material, damping, restitution, collisionFilter, noPhysics) {
    const body = BABYLON.MeshBuilder.CreateSphere("alien_head", { diameter: 1.0 }, scene);
    body.position = position.clone();
    body.material = material;

    const legs = [];
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);

        const leg = BABYLON.MeshBuilder.CreateCapsule("alien_leg", { height: 0.8, radius: 0.1 }, scene);
        leg.position = position.add(new BABYLON.Vector3(x * 0.4, -0.8, z * 0.4));
        leg.material = material;

        const worldPivot = position.add(new BABYLON.Vector3(x * 0.4, -0.4, z * 0.4));
        legs.push({ mesh: leg, pivot: worldPivot });
    }

    const bodyAgg = createAggregate(body, BABYLON.PhysicsShapeType.SPHERE, species.mass * 0.4, restitution, scene, collisionFilter, damping, noPhysics);
    const legAggs = [];

    legs.forEach(l => {
        const agg = createAggregate(l.mesh, BABYLON.PhysicsShapeType.CAPSULE, species.mass * 0.2, restitution, scene, collisionFilter, damping, noPhysics);
        if (agg) legAggs.push(agg);
        connectBodies(scene, bodyAgg?.body, agg?.body, l.pivot, [], noPhysics);
    });

    return { root: body, parts: [body, ...legs.map(l => l.mesh)], aggregates: noPhysics ? [] : [bodyAgg, ...legAggs], headBody: bodyAgg?.body };
}
