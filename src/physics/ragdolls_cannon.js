// src/physics/ragdolls.js
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { RACER_SPECIES } from '../config';
import { MATERIALS, COLLISION_GROUPS } from './world';

export { RACER_SPECIES };

// Helper to create a physics body
function createBody(shape, mass, position, material = MATERIALS.racer) {
    const body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        material: material,
        linearDamping: 0.1,
        angularDamping: 0.3,
        collisionFilterGroup: COLLISION_GROUPS.RACER,
        collisionFilterMask: COLLISION_GROUPS.ENVIRONMENT | COLLISION_GROUPS.RACER,
        allowSleep: false
    });
    body.addShape(shape);
    
    // Initialize with zero velocity
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    
    return body;
}

// Helper to create a cone twist constraint (ball-socket joint)
function createConeTwistConstraint(bodyA, bodyB, pivotA, pivotB, options = {}) {
    const {
        angle = Math.PI / 4,
        twistAngle = Math.PI / 8
    } = options;
    
    const constraint = new CANNON.ConeTwistConstraint(bodyA, bodyB, {
        pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
        pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
        axisA: new CANNON.Vec3(0, 1, 0),
        axisB: new CANNON.Vec3(0, 1, 0),
        angle: angle,
        twistAngle: twistAngle,
        collideConnected: false
    });
    
    return constraint;
}

// Helper to create a hinge constraint
function createHingeConstraint(bodyA, bodyB, pivotA, pivotB, axisA, axisB) {
    const constraint = new CANNON.HingeConstraint(bodyA, bodyB, {
        pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
        pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
        axisA: new CANNON.Vec3(axisA.x, axisA.y, axisA.z),
        axisB: new CANNON.Vec3(axisB.x, axisB.y, axisB.z),
        collideConnected: false
    });
    
    return constraint;
}

// Helper to create a point-to-point constraint
function createPointConstraint(bodyA, bodyB, pivotA, pivotB) {
    const constraint = new CANNON.PointToPointConstraint(
        bodyA,
        new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
        bodyB,
        new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z)
    );
    return constraint;
}

// Helper to create Three.js mesh
function createMesh(geometry, color) {
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.5,
        metalness: 0.1
    });
    return new THREE.Mesh(geometry, material);
}

export function createRagdoll(scene, world, position, species, options = {}) {
    const { noPhysics = false } = options;
    
    // Dispatch to specific creator
    switch (species.type) {
        case 'spider': return createSpider(scene, world, position, species, noPhysics);
        case 'dog': return createDog(scene, world, position, species, noPhysics);
        case 'snake': return createSnake(scene, world, position, species, noPhysics);
        case 'crab': return createCrab(scene, world, position, species, noPhysics);
        case 'dino': return createDino(scene, world, position, species, noPhysics);
        case 'penguin': return createPenguin(scene, world, position, species, noPhysics);
        case 'alien': return createAlien(scene, world, position, species, noPhysics);
        case 'human':
        default: return createHuman(scene, world, position, species, noPhysics);
    }
}

// --- Creature Implementations ---

function createHuman(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Torso
    const torsoSize = { x: 0.6, y: 1, z: 0.4 };
    const torsoShape = new CANNON.Box(new CANNON.Vec3(torsoSize.x / 2, torsoSize.y / 2, torsoSize.z / 2));
    const torsoBody = createBody(torsoShape, species.mass * 0.4, pos);
    
    const torsoGeo = new THREE.BoxGeometry(torsoSize.x, torsoSize.y, torsoSize.z);
    const torsoMesh = createMesh(torsoGeo, color);
    torsoMesh.position.copy(pos);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    
    if (!noPhysics) world.addBody(torsoBody);
    scene.add(torsoMesh);
    bodies.push(torsoBody);
    meshes.push(torsoMesh);
    
    // Head
    const headRadius = 0.25;
    const headShape = new CANNON.Sphere(headRadius);
    const headPos = pos.clone().add(new THREE.Vector3(0, 0.9, 0));
    const headBody = createBody(headShape, species.mass * 0.1, headPos);
    
    const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
    const headMesh = createMesh(headGeo, color);
    headMesh.position.copy(headPos);
    headMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    // Head constraint
    if (!noPhysics) {
        const headConstraint = createConeTwistConstraint(
            torsoBody, headBody,
            { x: 0, y: 0.5, z: 0 },
            { x: 0, y: -headRadius - 0.15, z: 0 },
            { angle: Math.PI / 4, twistAngle: Math.PI / 6 }
        );
        world.addConstraint(headConstraint);
        constraints.push(headConstraint);
    }
    
    // Limbs
    const limbRadius = 0.12;
    const limbHeight = 0.7;
    const limbOffsets = [
        { pos: new THREE.Vector3(-0.2, -0.85, 0), pivot: { x: -0.2, y: -0.5, z: 0 } }, // Leg L
        { pos: new THREE.Vector3(0.2, -0.85, 0), pivot: { x: 0.2, y: -0.5, z: 0 } },  // Leg R
        { pos: new THREE.Vector3(-0.45, 0.3, 0), pivot: { x: -0.3, y: 0.3, z: 0 } },  // Arm L
        { pos: new THREE.Vector3(0.45, 0.3, 0), pivot: { x: 0.3, y: 0.3, z: 0 } }    // Arm R
    ];
    
    limbOffsets.forEach((off, i) => {
        const limbShape = new CANNON.Cylinder(limbRadius, limbRadius, limbHeight, 8);
        const limbPos = pos.clone().add(off.pos);
        const limbBody = createBody(limbShape, species.mass * 0.1, limbPos);
        
        const limbGeo = new THREE.CapsuleGeometry(limbRadius, limbHeight - limbRadius * 2, 8, 8);
        const limbMesh = createMesh(limbGeo, color);
        limbMesh.position.copy(limbPos);
        limbMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(limbBody);
        scene.add(limbMesh);
        bodies.push(limbBody);
        meshes.push(limbMesh);
        
        if (!noPhysics) {
            const isLeg = i < 2;
            const constraint = createConeTwistConstraint(
                torsoBody, limbBody,
                off.pivot,
                { x: 0, y: isLeg ? limbHeight / 2 : -limbHeight / 2, z: 0 },
                { angle: isLeg ? Math.PI / 3 : Math.PI / 2, twistAngle: Math.PI / 4 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    });
    
    return {
        root: torsoMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: headBody
    };
}

function createSpider(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body
    const bodyRadius = 0.4;
    const bodyShape = new CANNON.Sphere(bodyRadius);
    const bodyBody = createBody(bodyShape, species.mass * 0.4, pos);
    
    const bodyGeo = new THREE.SphereGeometry(bodyRadius, 16, 16);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Legs (8)
    const legRadius = 0.08;
    const legLength = 0.7;
    const dist = 0.7;
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legLength, 6);
        const legPos = pos.clone().add(new THREE.Vector3(x * dist, -0.15, z * dist));
        const legBody = createBody(legShape, species.mass * 0.05, legPos);
        
        // Rotate the body to match leg orientation
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(0, -angle, Math.PI / 2);
        legBody.quaternion.copy(quat);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legLength - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPos);
        legMesh.rotation.set(0, -angle, Math.PI / 2);
        legMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics) {
            const constraint = createHingeConstraint(
                bodyBody, legBody,
                { x: x * bodyRadius, y: -0.1, z: z * bodyRadius },
                { x: 0, y: -legLength / 2, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 1, z: 0 }
            );
            constraint.enableMotor();
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    }
    
    return {
        root: bodyMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: bodyBody
    };
}

function createDog(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body
    const bodySize = { x: 0.5, y: 0.5, z: 1.0 };
    const bodyShape = new CANNON.Box(new CANNON.Vec3(bodySize.x / 2, bodySize.y / 2, bodySize.z / 2));
    const bodyBody = createBody(bodyShape, species.mass * 0.5, pos);
    
    const bodyGeo = new THREE.BoxGeometry(bodySize.x, bodySize.y, bodySize.z);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Head
    const headSize = { x: 0.4, y: 0.4, z: 0.5 };
    const headShape = new CANNON.Box(new CANNON.Vec3(headSize.x / 2, headSize.y / 2, headSize.z / 2));
    const headPos = pos.clone().add(new THREE.Vector3(0, 0.4, 0.6));
    const headBody = createBody(headShape, species.mass * 0.1, headPos);
    
    const headGeo = new THREE.BoxGeometry(headSize.x, headSize.y, headSize.z);
    const headMesh = createMesh(headGeo, color);
    headMesh.position.copy(headPos);
    headMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    // Head constraint
    if (!noPhysics) {
        const headConstraint = createConeTwistConstraint(
            bodyBody, headBody,
            { x: 0, y: 0.25, z: 0.5 },
            { x: 0, y: 0, z: -headSize.z / 2 },
            { angle: Math.PI / 4, twistAngle: Math.PI / 6 }
        );
        world.addConstraint(headConstraint);
        constraints.push(headConstraint);
    }
    
    // Legs
    const legRadius = 0.08;
    const legHeight = 0.5;
    const legPos = [
        { x: -0.25, z: 0.4 }, { x: 0.25, z: 0.4 },
        { x: -0.25, z: -0.4 }, { x: 0.25, z: -0.4 }
    ];
    
    legPos.forEach((lp, i) => {
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legHeight, 6);
        const legPosition = pos.clone().add(new THREE.Vector3(lp.x, -0.45, lp.z));
        const legBody = createBody(legShape, species.mass * 0.1, legPosition);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legHeight - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPosition);
        legMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics) {
            const constraint = createHingeConstraint(
                bodyBody, legBody,
                { x: lp.x, y: -bodySize.y / 2, z: lp.z },
                { x: 0, y: legHeight / 2, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    });
    
    return {
        root: bodyMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: headBody
    };
}

function createSnake(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    const radius = 0.2;
    const spacing = radius * 2.5; // Increased spacing to prevent collisions
    const segmentCount = 6;
    
    for (let i = 0; i < segmentCount; i++) {
        const segShape = new CANNON.Sphere(radius);
        const segPos = pos.clone().add(new THREE.Vector3(0, 0, -i * spacing));
        const segBody = createBody(segShape, species.mass / segmentCount, segPos);
        
        const segGeo = new THREE.SphereGeometry(radius, 12, 12);
        const segMesh = createMesh(segGeo, color);
        segMesh.position.copy(segPos);
        segMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(segBody);
        scene.add(segMesh);
        bodies.push(segBody);
        meshes.push(segMesh);
        
        // Connect to previous segment
        if (i > 0 && !noPhysics) {
            const constraint = createPointConstraint(
                bodies[i - 1], segBody,
                { x: 0, y: 0, z: -spacing / 2 },
                { x: 0, y: 0, z: spacing / 2 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    }
    
    return {
        root: meshes[0],
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: bodies[0]
    };
}

function createCrab(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body
    const bodySize = { x: 1.2, y: 0.4, z: 0.6 };
    const bodyShape = new CANNON.Box(new CANNON.Vec3(bodySize.x / 2, bodySize.y / 2, bodySize.z / 2));
    const bodyBody = createBody(bodyShape, species.mass * 0.5, pos);
    
    const bodyGeo = new THREE.BoxGeometry(bodySize.x, bodySize.y, bodySize.z);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Legs (6)
    const legRadius = 0.08;
    const legLength = 0.5;
    
    for (let i = 0; i < 6; i++) {
        const isRight = i < 3;
        const zOffset = ((i % 3) - 1) * 0.35;
        const xOffset = isRight ? 0.7 : -0.7;
        
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legLength, 6);
        const legPos = pos.clone().add(new THREE.Vector3(xOffset, -0.25, zOffset));
        const legBody = createBody(legShape, species.mass * 0.05, legPos);
        
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(0, 0, isRight ? -Math.PI / 4 : Math.PI / 4);
        legBody.quaternion.copy(quat);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legLength - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPos);
        legMesh.rotation.z = isRight ? -Math.PI / 4 : Math.PI / 4;
        legMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics) {
            const constraint = createHingeConstraint(
                bodyBody, legBody,
                { x: isRight ? bodySize.x / 2 - 0.1 : -bodySize.x / 2 + 0.1, y: 0, z: zOffset },
                { x: 0, y: legLength / 2, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 0, y: 0, z: 1 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    }
    
    return {
        root: bodyMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: bodyBody
    };
}

function createDino(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body
    const bodySize = { x: 0.6, y: 0.8, z: 1.0 };
    const bodyShape = new CANNON.Box(new CANNON.Vec3(bodySize.x / 2, bodySize.y / 2, bodySize.z / 2));
    const bodyBody = createBody(bodyShape, species.mass * 0.4, pos);
    
    const bodyGeo = new THREE.BoxGeometry(bodySize.x, bodySize.y, bodySize.z);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Head
    const headSize = { x: 0.5, y: 0.6, z: 0.8 };
    const headShape = new CANNON.Box(new CANNON.Vec3(headSize.x / 2, headSize.y / 2, headSize.z / 2));
    const headPos = pos.clone().add(new THREE.Vector3(0, 0.8, 0.6));
    const headBody = createBody(headShape, species.mass * 0.1, headPos);
    
    const headGeo = new THREE.BoxGeometry(headSize.x, headSize.y, headSize.z);
    const headMesh = createMesh(headGeo, color);
    headMesh.position.copy(headPos);
    headMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    // Tail
    const tailSize = { x: 0.4, y: 0.4, z: 1.2 };
    const tailShape = new CANNON.Box(new CANNON.Vec3(tailSize.x / 2, tailSize.y / 2, tailSize.z / 2));
    const tailPos = pos.clone().add(new THREE.Vector3(0, -0.2, -1.1));
    const tailBody = createBody(tailShape, species.mass * 0.1, tailPos);
    
    const tailGeo = new THREE.BoxGeometry(tailSize.x, tailSize.y, tailSize.z);
    const tailMesh = createMesh(tailGeo, color);
    tailMesh.position.copy(tailPos);
    tailMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(tailBody);
    scene.add(tailMesh);
    bodies.push(tailBody);
    meshes.push(tailMesh);
    
    // Constraints
    if (!noPhysics) {
        const headConstraint = createConeTwistConstraint(
            bodyBody, headBody,
            { x: 0, y: 0.4, z: 0.5 },
            { x: 0, y: 0, z: -headSize.z / 2 },
            { angle: Math.PI / 6, twistAngle: Math.PI / 8 }
        );
        world.addConstraint(headConstraint);
        constraints.push(headConstraint);
        
        const tailConstraint = createConeTwistConstraint(
            bodyBody, tailBody,
            { x: 0, y: -0.2, z: -0.5 },
            { x: 0, y: 0, z: tailSize.z / 2 },
            { angle: Math.PI / 4, twistAngle: Math.PI / 4 }
        );
        world.addConstraint(tailConstraint);
        constraints.push(tailConstraint);
    }
    
    // Legs
    const legRadius = 0.15;
    const legHeight = 0.9;
    
    [-0.35, 0.35].forEach((x, i) => {
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legHeight, 8);
        const legPos = pos.clone().add(new THREE.Vector3(x, -0.8, 0));
        const legBody = createBody(legShape, species.mass * 0.15, legPos);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legHeight - legRadius * 2, 8, 8);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPos);
        legMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics) {
            const constraint = createHingeConstraint(
                bodyBody, legBody,
                { x: x, y: -bodySize.y / 2, z: 0 },
                { x: 0, y: legHeight / 2, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    });
    
    return {
        root: bodyMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: headBody
    };
}

function createPenguin(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body (capsule-like)
    const bodyRadius = 0.35;
    const bodyHeight = 1.0;
    const bodyShape = new CANNON.Cylinder(bodyRadius, bodyRadius, bodyHeight, 12);
    const bodyBody = createBody(bodyShape, species.mass * 0.7, pos);
    
    const bodyGeo = new THREE.CapsuleGeometry(bodyRadius, bodyHeight - bodyRadius * 2, 12, 12);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Flippers
    const flipperSize = { x: 0.1, y: 0.5, z: 0.25 };
    
    [-0.4, 0.4].forEach((x, i) => {
        const flipperShape = new CANNON.Box(new CANNON.Vec3(flipperSize.x / 2, flipperSize.y / 2, flipperSize.z / 2));
        const flipperPos = pos.clone().add(new THREE.Vector3(x, 0.15, 0));
        const flipperBody = createBody(flipperShape, species.mass * 0.05, flipperPos);
        
        const flipperGeo = new THREE.BoxGeometry(flipperSize.x, flipperSize.y, flipperSize.z);
        const flipperMesh = createMesh(flipperGeo, color);
        flipperMesh.position.copy(flipperPos);
        flipperMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(flipperBody);
        scene.add(flipperMesh);
        bodies.push(flipperBody);
        meshes.push(flipperMesh);
        
        if (!noPhysics) {
            const constraint = createHingeConstraint(
                bodyBody, flipperBody,
                { x: x > 0 ? bodyRadius : -bodyRadius, y: 0.15, z: 0 },
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 0, y: 0, z: 1 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    });
    
    return {
        root: bodyMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: bodyBody
    };
}

function createAlien(scene, world, position, species, noPhysics) {
    const bodies = [];
    const meshes = [];
    const constraints = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body (big head)
    const bodyRadius = 0.5;
    const bodyShape = new CANNON.Sphere(bodyRadius);
    const bodyBody = createBody(bodyShape, species.mass * 0.4, pos);
    
    const bodyGeo = new THREE.SphereGeometry(bodyRadius, 16, 16);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Tripod legs
    const legRadius = 0.08;
    const legLength = 0.7;
    
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const x = Math.cos(angle) * 0.35;
        const z = Math.sin(angle) * 0.35;
        
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legLength, 6);
        const legPos = pos.clone().add(new THREE.Vector3(x, -0.75, z));
        const legBody = createBody(legShape, species.mass * 0.2, legPos);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legLength - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPos);
        legMesh.castShadow = true;
        
        if (!noPhysics) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics) {
            const constraint = createConeTwistConstraint(
                bodyBody, legBody,
                { x: x, y: -bodyRadius, z: z },
                { x: 0, y: legLength / 2, z: 0 },
                { angle: Math.PI / 3, twistAngle: Math.PI / 4 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    }
    
    return {
        root: bodyMesh,
        parts: meshes,
        bodies: bodies,
        constraints: constraints,
        headBody: bodyBody
    };
}

// Sync function to update Three.js meshes from Cannon.js bodies
export function syncRagdolls(racers) {
    racers.forEach(racer => {
        racer.bodies.forEach((body, i) => {
            const mesh = racer.parts[i];
            if (mesh && body) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        });
    });
}
