import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { RACER_SPECIES, type RacerSpecies } from '@/lib/config';
import { MATERIALS, COLLISION_GROUPS } from './world';

export { RACER_SPECIES };

interface RagdollResult {
    root: THREE.Mesh;
    parts: THREE.Mesh[];
    bodies: CANNON.Body[];
    constraints: CANNON.Constraint[];
    headBody: CANNON.Body;
}

interface Vec3Like {
    x: number;
    y: number;
    z: number;
}

// Helper to create a physics body
function createBody(shape: CANNON.Shape, mass: number, position: Vec3Like): CANNON.Body {
    const body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        material: MATERIALS.racer,
        linearDamping: 0.1,
        angularDamping: 0.3,
        collisionFilterGroup: COLLISION_GROUPS.RACER,
        collisionFilterMask: COLLISION_GROUPS.ENVIRONMENT | COLLISION_GROUPS.RACER,
        allowSleep: false
    });
    body.addShape(shape);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    return body;
}

// Helper to create Three.js mesh
function createMesh(geometry: THREE.BufferGeometry, color: string): THREE.Mesh {
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.5,
        metalness: 0.1
    });
    return new THREE.Mesh(geometry, material);
}

// Helper to create a cone twist constraint
function createConeTwistConstraint(
    bodyA: CANNON.Body,
    bodyB: CANNON.Body,
    pivotA: Vec3Like,
    pivotB: Vec3Like,
    options: { angle?: number; twistAngle?: number } = {}
): CANNON.ConeTwistConstraint {
    const { angle = Math.PI / 4, twistAngle = Math.PI / 8 } = options;
    
    return new CANNON.ConeTwistConstraint(bodyA, bodyB, {
        pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
        pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
        axisA: new CANNON.Vec3(0, 1, 0),
        axisB: new CANNON.Vec3(0, 1, 0),
        angle: angle,
        twistAngle: twistAngle,
        collideConnected: false
    });
}

// Helper to create a hinge constraint
function createHingeConstraint(
    bodyA: CANNON.Body,
    bodyB: CANNON.Body,
    pivotA: Vec3Like,
    pivotB: Vec3Like,
    axisA: Vec3Like,
    axisB: Vec3Like
): CANNON.HingeConstraint {
    return new CANNON.HingeConstraint(bodyA, bodyB, {
        pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
        pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
        axisA: new CANNON.Vec3(axisA.x, axisA.y, axisA.z),
        axisB: new CANNON.Vec3(axisB.x, axisB.y, axisB.z),
        collideConnected: false
    });
}

interface Species {
    type: string;
    color: string;
    mass: number;
}

export function createRagdoll(
    scene: THREE.Scene,
    world: CANNON.World | null,
    position: Vec3Like,
    species: Species,
    options: { noPhysics?: boolean } = {}
): RagdollResult {
    const { noPhysics = false } = options;
    
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

function createHuman(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
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
    
    if (!noPhysics && world) world.addBody(torsoBody);
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
    
    if (!noPhysics && world) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    // Head constraint
    if (!noPhysics && world) {
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
        { pos: new THREE.Vector3(-0.2, -0.85, 0), pivot: { x: -0.2, y: -0.5, z: 0 } },
        { pos: new THREE.Vector3(0.2, -0.85, 0), pivot: { x: 0.2, y: -0.5, z: 0 } },
        { pos: new THREE.Vector3(-0.45, 0.3, 0), pivot: { x: -0.3, y: 0.3, z: 0 } },
        { pos: new THREE.Vector3(0.45, 0.3, 0), pivot: { x: 0.3, y: 0.3, z: 0 } }
    ];
    
    limbOffsets.forEach((off, i) => {
        const limbShape = new CANNON.Cylinder(limbRadius, limbRadius, limbHeight, 8);
        const limbPos = pos.clone().add(off.pos);
        const limbBody = createBody(limbShape, species.mass * 0.1, limbPos);
        
        const limbGeo = new THREE.CapsuleGeometry(limbRadius, limbHeight - limbRadius * 2, 8, 8);
        const limbMesh = createMesh(limbGeo, color);
        limbMesh.position.copy(limbPos);
        limbMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(limbBody);
        scene.add(limbMesh);
        bodies.push(limbBody);
        meshes.push(limbMesh);
        
        if (!noPhysics && world) {
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
    
    return { root: torsoMesh, parts: meshes, bodies, constraints, headBody };
}

function createSpider(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
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
    
    if (!noPhysics && world) world.addBody(bodyBody);
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
        
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(0, -angle, Math.PI / 2);
        legBody.quaternion.copy(quat);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legLength - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPos);
        legMesh.rotation.set(0, -angle, Math.PI / 2);
        legMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics && world) {
            const constraint = createHingeConstraint(
                bodyBody, legBody,
                { x: x * bodyRadius, y: -0.1, z: z * bodyRadius },
                { x: 0, y: -legLength / 2, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 1, z: 0 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
    }
    
    return { root: bodyMesh, parts: meshes, bodies, constraints, headBody: bodyBody };
}

function createDog(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
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
    
    if (!noPhysics && world) world.addBody(bodyBody);
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
    
    if (!noPhysics && world) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    if (!noPhysics && world) {
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
    const legPositions = [
        { x: -0.25, z: 0.4 }, { x: 0.25, z: 0.4 },
        { x: -0.25, z: -0.4 }, { x: 0.25, z: -0.4 }
    ];
    
    legPositions.forEach((lp) => {
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legHeight, 6);
        const legPosition = pos.clone().add(new THREE.Vector3(lp.x, -0.45, lp.z));
        const legBody = createBody(legShape, species.mass * 0.1, legPosition);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legHeight - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPosition);
        legMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
        
        if (!noPhysics && world) {
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
    
    return { root: bodyMesh, parts: meshes, bodies, constraints, headBody };
}

// Simplified implementations for other creature types
function createSnake(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const radius = 0.2;
    const spacing = radius * 2.5;
    const segmentCount = 6;
    
    let prevBody: CANNON.Body | null = null;
    
    for (let i = 0; i < segmentCount; i++) {
        const segShape = new CANNON.Sphere(radius);
        const segPos = pos.clone().add(new THREE.Vector3(0, 0, -i * spacing));
        const segBody = createBody(segShape, species.mass / segmentCount, segPos);
        
        const segGeo = new THREE.SphereGeometry(radius, 12, 12);
        const segMesh = createMesh(segGeo, color);
        segMesh.position.copy(segPos);
        segMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(segBody);
        scene.add(segMesh);
        bodies.push(segBody);
        meshes.push(segMesh);
        
        if (prevBody && !noPhysics && world) {
            const constraint = createConeTwistConstraint(
                prevBody, segBody,
                { x: 0, y: 0, z: -spacing / 2 },
                { x: 0, y: 0, z: spacing / 2 },
                { angle: Math.PI / 3, twistAngle: Math.PI / 4 }
            );
            world.addConstraint(constraint);
            constraints.push(constraint);
        }
        prevBody = segBody;
    }
    
    return { root: meshes[0], parts: meshes, bodies, constraints, headBody: bodies[0] };
}

function createCrab(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body
    const bodySize = { x: 1.2, y: 0.4, z: 0.8 };
    const bodyShape = new CANNON.Box(new CANNON.Vec3(bodySize.x / 2, bodySize.y / 2, bodySize.z / 2));
    const bodyBody = createBody(bodyShape, species.mass * 0.5, pos);
    
    const bodyGeo = new THREE.BoxGeometry(bodySize.x, bodySize.y, bodySize.z);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics && world) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Legs (6)
    const legRadius = 0.06;
    const legLength = 0.5;
    const legPos = [
        { x: -0.6, z: 0.3 }, { x: 0.6, z: 0.3 },
        { x: -0.6, z: 0 }, { x: 0.6, z: 0 },
        { x: -0.6, z: -0.3 }, { x: 0.6, z: -0.3 }
    ];
    
    legPos.forEach((lp) => {
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legLength, 6);
        const legPosition = pos.clone().add(new THREE.Vector3(lp.x, -0.3, lp.z));
        const legBody = createBody(legShape, species.mass * 0.05, legPosition);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legLength - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPosition);
        legMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
    });
    
    return { root: bodyMesh, parts: meshes, bodies, constraints, headBody: bodyBody };
}

function createDino(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body
    const bodySize = { x: 0.8, y: 1.2, z: 1.5 };
    const bodyShape = new CANNON.Box(new CANNON.Vec3(bodySize.x / 2, bodySize.y / 2, bodySize.z / 2));
    const bodyBody = createBody(bodyShape, species.mass * 0.5, pos);
    
    const bodyGeo = new THREE.BoxGeometry(bodySize.x, bodySize.y, bodySize.z);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics && world) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Head
    const headRadius = 0.4;
    const headShape = new CANNON.Sphere(headRadius);
    const headPos = pos.clone().add(new THREE.Vector3(0, 0.8, 0.8));
    const headBody = createBody(headShape, species.mass * 0.15, headPos);
    
    const headGeo = new THREE.SphereGeometry(headRadius, 12, 12);
    const headMesh = createMesh(headGeo, color);
    headMesh.position.copy(headPos);
    headMesh.castShadow = true;
    
    if (!noPhysics && world) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    // Legs
    const legRadius = 0.15;
    const legHeight = 0.8;
    const legPositions = [{ x: -0.3, z: 0 }, { x: 0.3, z: 0 }];
    
    legPositions.forEach((lp) => {
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legHeight, 8);
        const legPosition = pos.clone().add(new THREE.Vector3(lp.x, -0.9, lp.z));
        const legBody = createBody(legShape, species.mass * 0.15, legPosition);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legHeight - legRadius * 2, 8, 8);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPosition);
        legMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
    });
    
    return { root: bodyMesh, parts: meshes, bodies, constraints, headBody };
}

function createPenguin(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Body (capsule-like)
    const bodyRadius = 0.3;
    const bodyHeight = 0.8;
    const bodyShape = new CANNON.Cylinder(bodyRadius, bodyRadius * 0.7, bodyHeight, 12);
    const bodyBody = createBody(bodyShape, species.mass * 0.6, pos);
    
    const bodyGeo = new THREE.CapsuleGeometry(bodyRadius, bodyHeight - bodyRadius * 2, 12, 12);
    const bodyMesh = createMesh(bodyGeo, color);
    bodyMesh.position.copy(pos);
    bodyMesh.castShadow = true;
    
    if (!noPhysics && world) world.addBody(bodyBody);
    scene.add(bodyMesh);
    bodies.push(bodyBody);
    meshes.push(bodyMesh);
    
    // Head
    const headRadius = 0.2;
    const headShape = new CANNON.Sphere(headRadius);
    const headPos = pos.clone().add(new THREE.Vector3(0, 0.6, 0));
    const headBody = createBody(headShape, species.mass * 0.1, headPos);
    
    const headGeo = new THREE.SphereGeometry(headRadius, 12, 12);
    const headMesh = createMesh(headGeo, color);
    headMesh.position.copy(headPos);
    headMesh.castShadow = true;
    
    if (!noPhysics && world) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    return { root: bodyMesh, parts: meshes, bodies, constraints, headBody };
}

function createAlien(scene: THREE.Scene, world: CANNON.World | null, position: Vec3Like, species: Species, noPhysics: boolean): RagdollResult {
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const constraints: CANNON.Constraint[] = [];
    
    const color = species.color;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Large head
    const headRadius = 0.5;
    const headShape = new CANNON.Sphere(headRadius);
    const headBody = createBody(headShape, species.mass * 0.4, pos);
    
    const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
    const headMesh = createMesh(headGeo, color);
    headMesh.position.copy(pos);
    headMesh.castShadow = true;
    
    if (!noPhysics && world) world.addBody(headBody);
    scene.add(headMesh);
    bodies.push(headBody);
    meshes.push(headMesh);
    
    // 3 legs
    const legRadius = 0.08;
    const legHeight = 0.7;
    
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const x = Math.cos(angle) * 0.4;
        const z = Math.sin(angle) * 0.4;
        
        const legShape = new CANNON.Cylinder(legRadius, legRadius, legHeight, 6);
        const legPosition = pos.clone().add(new THREE.Vector3(x, -0.6, z));
        const legBody = createBody(legShape, species.mass * 0.2, legPosition);
        
        const legGeo = new THREE.CapsuleGeometry(legRadius, legHeight - legRadius * 2, 6, 6);
        const legMesh = createMesh(legGeo, color);
        legMesh.position.copy(legPosition);
        legMesh.castShadow = true;
        
        if (!noPhysics && world) world.addBody(legBody);
        scene.add(legMesh);
        bodies.push(legBody);
        meshes.push(legMesh);
    }
    
    return { root: headMesh, parts: meshes, bodies, constraints, headBody };
}

// Sync ragdoll meshes with physics bodies
export function syncRagdolls(racers: { bodies: CANNON.Body[]; parts: THREE.Mesh[] }[]): void {
    racers.forEach(racer => {
        racer.bodies.forEach((body, i) => {
            if (racer.parts[i]) {
                racer.parts[i].position.copy(body.position as unknown as THREE.Vector3);
                racer.parts[i].quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
            }
        });
    });
}
