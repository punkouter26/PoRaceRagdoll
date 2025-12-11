// src/physics/obstacles_cannon.js
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { MATERIALS, COLLISION_GROUPS } from './world';

export function createSpinningHammer(scene, world, position, material, rampPos, angleRad) {
    const bodies = [];
    const meshes = [];
    
    // Static Base (Pillar)
    const baseHeight = 2;
    const baseRadius = 0.5;
    
    // Calculate position on ramp
    const localPos = new THREE.Vector3(position.x, 0.5 + baseHeight / 2, position.z);
    localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
    const basePos = rampPos.clone().add(localPos);
    
    // Base body (static)
    const baseShape = new CANNON.Cylinder(baseRadius, baseRadius, baseHeight, 12);
    const baseBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(basePos.x, basePos.y, basePos.z),
        material: MATERIALS.obstacle,
        collisionFilterGroup: COLLISION_GROUPS.ENVIRONMENT,
        collisionFilterMask: COLLISION_GROUPS.RACER
    });
    baseBody.addShape(baseShape);
    
    const rampQuat = new CANNON.Quaternion();
    rampQuat.setFromEuler(angleRad, 0, 0);
    baseBody.quaternion.copy(rampQuat);
    
    world.addBody(baseBody);
    bodies.push(baseBody);
    
    // Base mesh
    const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 12);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.position.copy(basePos);
    baseMesh.rotation.x = angleRad;
    baseMesh.castShadow = true;
    scene.add(baseMesh);
    meshes.push(baseMesh);
    
    // Rotating Hammer Head
    const hammerWidth = 8;
    const hammerHeight = 1;
    const hammerDepth = 1;
    
    // Position on top of base
    const hammerLocalPos = new THREE.Vector3(position.x, 0.5 + baseHeight + hammerHeight / 2, position.z);
    hammerLocalPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
    const hammerPos = rampPos.clone().add(hammerLocalPos);
    
    // Hammer body (dynamic, will be constrained)
    const hammerShape = new CANNON.Box(new CANNON.Vec3(hammerWidth / 2, hammerHeight / 2, hammerDepth / 2));
    const hammerBody = new CANNON.Body({
        mass: 100,
        position: new CANNON.Vec3(hammerPos.x, hammerPos.y, hammerPos.z),
        material: MATERIALS.obstacle,
        collisionFilterGroup: COLLISION_GROUPS.ENVIRONMENT,
        collisionFilterMask: COLLISION_GROUPS.RACER,
        angularDamping: 0.0
    });
    hammerBody.addShape(hammerShape);
    hammerBody.quaternion.copy(rampQuat);
    
    world.addBody(hammerBody);
    bodies.push(hammerBody);
    
    // Hammer mesh
    const hammerGeo = new THREE.BoxGeometry(hammerWidth, hammerHeight, hammerDepth);
    const hammerMesh = new THREE.Mesh(hammerGeo, material);
    hammerMesh.position.copy(hammerPos);
    hammerMesh.rotation.x = angleRad;
    hammerMesh.castShadow = true;
    scene.add(hammerMesh);
    meshes.push(hammerMesh);
    
    // Arm visual
    const armGeo = new THREE.BoxGeometry(1, 0.5, 4);
    const armMesh = new THREE.Mesh(armGeo, material);
    armMesh.castShadow = true;
    hammerMesh.add(armMesh); // Child of hammer
    
    // Hinge constraint to make it spin around Y axis
    const hinge = new CANNON.HingeConstraint(baseBody, hammerBody, {
        pivotA: new CANNON.Vec3(0, baseHeight / 2 + 0.5, 0),
        pivotB: new CANNON.Vec3(0, 0, 0),
        axisA: new CANNON.Vec3(0, 1, 0),
        axisB: new CANNON.Vec3(0, 1, 0),
        collideConnected: false
    });
    
    // Enable motor for continuous spinning
    hinge.enableMotor();
    hinge.setMotorSpeed(3); // Radians per second
    hinge.setMotorMaxForce(10000);
    
    world.addConstraint(hinge);
    
    // Update function to sync mesh with body
    const update = () => {
        hammerMesh.position.copy(hammerBody.position);
        hammerMesh.quaternion.copy(hammerBody.quaternion);
    };
    
    return {
        bodies,
        meshes,
        update,
        hinge
    };
}

export function createSlidingWall(scene, world, position, trackWidth, material, rampPos, angleRad) {
    const bodies = [];
    const meshes = [];
    
    const wallWidth = trackWidth / 2;
    const wallHeight = 3;
    const wallDepth = 1;
    
    // Calculate position on ramp
    const localPos = new THREE.Vector3(position.x, 0.5 + wallHeight / 2, position.z);
    localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
    const wallPos = rampPos.clone().add(localPos);
    
    // Wall body (kinematic - animated)
    const wallShape = new CANNON.Box(new CANNON.Vec3(wallWidth / 2, wallHeight / 2, wallDepth / 2));
    const wallBody = new CANNON.Body({
        mass: 0, // Kinematic
        position: new CANNON.Vec3(wallPos.x, wallPos.y, wallPos.z),
        material: MATERIALS.obstacle,
        collisionFilterGroup: COLLISION_GROUPS.ENVIRONMENT,
        collisionFilterMask: COLLISION_GROUPS.RACER,
        type: CANNON.Body.KINEMATIC
    });
    wallBody.addShape(wallShape);
    
    const rampQuat = new CANNON.Quaternion();
    rampQuat.setFromEuler(angleRad, 0, 0);
    wallBody.quaternion.copy(rampQuat);
    
    world.addBody(wallBody);
    bodies.push(wallBody);
    
    // Wall mesh
    const wallGeo = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    const wallMesh = new THREE.Mesh(wallGeo, material);
    wallMesh.position.copy(wallPos);
    wallMesh.rotation.x = angleRad;
    wallMesh.castShadow = true;
    scene.add(wallMesh);
    meshes.push(wallMesh);
    
    // Animation state
    const limit = (trackWidth - wallWidth) / 2 - 1;
    const baseX = wallPos.x;
    let time = Math.random() * Math.PI * 2; // Random start phase
    const speed = 0.5; // Speed of oscillation
    
    // Update function for animation
    const update = (deltaTime) => {
        time += deltaTime * speed;
        const xOffset = Math.sin(time) * limit;
        
        // Update body position
        wallBody.position.x = baseX + xOffset;
        
        // Sync mesh
        wallMesh.position.x = wallBody.position.x;
    };
    
    return {
        bodies,
        meshes,
        update
    };
}
