import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { MATERIALS, COLLISION_GROUPS } from './world';

export interface AnimatedObject {
    update: (deltaTime: number) => void;
    bodies: CANNON.Body[];
    meshes: THREE.Mesh[];
}

export interface TrackResult {
    ramp: THREE.Mesh;
    bodies: CANNON.Body[];
    meshes: THREE.Mesh[];
    animatedObjects: AnimatedObject[];
    finishZ: number;
    rampPos: THREE.Vector3;
    angleRad: number;
}

export function createTrack(scene: THREE.Scene, world: CANNON.World, slopeAngle: number): TrackResult {
    const angleRad = THREE.MathUtils.degToRad(slopeAngle);
    const trackLength = 200;
    const trackWidth = 20;
    
    const bodies: CANNON.Body[] = [];
    const meshes: THREE.Mesh[] = [];
    const animatedObjects: AnimatedObject[] = [];
    
    // --- Ramp ---
    const rampSize = { x: trackWidth, y: 1, z: trackLength };
    
    // Calculate ramp position
    const drop = Math.sin(angleRad) * (trackLength / 2);
    const forward = Math.cos(angleRad) * (trackLength / 2);
    const rampPos = new THREE.Vector3(0, -drop + 10, forward);
    
    // Physics body
    const rampShape = new CANNON.Box(new CANNON.Vec3(rampSize.x / 2, rampSize.y / 2, rampSize.z / 2));
    const rampBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(rampPos.x, rampPos.y, rampPos.z),
        material: MATERIALS.ground,
        collisionFilterGroup: COLLISION_GROUPS.ENVIRONMENT,
        collisionFilterMask: COLLISION_GROUPS.RACER
    });
    rampBody.addShape(rampShape);
    
    const rampQuat = new CANNON.Quaternion();
    rampQuat.setFromEuler(angleRad, 0, 0);
    rampBody.quaternion.copy(rampQuat);
    
    world.addBody(rampBody);
    bodies.push(rampBody);
    
    // Visual mesh
    const rampGeo = new THREE.BoxGeometry(rampSize.x, rampSize.y, rampSize.z);
    const rampMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.0
    });
    
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.copy(rampPos);
    rampMesh.rotation.x = angleRad;
    rampMesh.receiveShadow = true;
    scene.add(rampMesh);
    meshes.push(rampMesh);
    
    // --- Walls ---
    const wallHeight = 10;
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x19cce6,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.0,
        emissive: 0x004d66,
        emissiveIntensity: 0.5
    });
    
    const createWall = (xOffset: number) => {
        const wallSize = { x: 0.5, y: wallHeight, z: trackLength };
        
        const wallShape = new CANNON.Box(new CANNON.Vec3(wallSize.x / 2, wallSize.y / 2, wallSize.z / 2));
        const wallBody = new CANNON.Body({
            mass: 0,
            material: MATERIALS.ground,
            collisionFilterGroup: COLLISION_GROUPS.ENVIRONMENT,
            collisionFilterMask: COLLISION_GROUPS.RACER
        });
        wallBody.addShape(wallShape);
        
        const localPos = new THREE.Vector3(xOffset, wallHeight / 2, 0);
        localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
        const wallPos = rampPos.clone().add(localPos);
        
        wallBody.position.set(wallPos.x, wallPos.y, wallPos.z);
        wallBody.quaternion.copy(rampQuat);
        
        world.addBody(wallBody);
        bodies.push(wallBody);
        
        const wallGeo = new THREE.BoxGeometry(wallSize.x, wallSize.y, wallSize.z);
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.copy(wallPos);
        wallMesh.rotation.x = angleRad;
        scene.add(wallMesh);
        meshes.push(wallMesh);
    };
    
    createWall(-trackWidth / 2 - 0.25);
    createWall(trackWidth / 2 + 0.25);
    
    // --- Finish Line ---
    const rampYOffset = 10;
    const groundIntersectLocalZ = (rampYOffset / Math.sin(angleRad));
    
    const finishMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    
    const finishGeo = new THREE.PlaneGeometry(trackWidth + 4, 8);
    const finishMesh = new THREE.Mesh(finishGeo, finishMat);
    
    const finishLocalPos = new THREE.Vector3(0, 4, groundIntersectLocalZ);
    finishLocalPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
    const finishPos = rampPos.clone().add(finishLocalPos);
    
    finishMesh.position.copy(finishPos);
    finishMesh.rotation.x = angleRad;
    scene.add(finishMesh);
    meshes.push(finishMesh);
    
    // Finish ground stripe
    const finishGroundGeo = new THREE.PlaneGeometry(trackWidth, 2);
    const finishGroundMesh = new THREE.Mesh(finishGroundGeo, finishMat);
    
    const finishGroundLocalPos = new THREE.Vector3(0, 0.6, groundIntersectLocalZ);
    finishGroundLocalPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
    const finishGroundPos = rampPos.clone().add(finishGroundLocalPos);
    
    finishGroundMesh.position.copy(finishGroundPos);
    finishGroundMesh.rotation.x = -Math.PI / 2 + angleRad;
    scene.add(finishGroundMesh);
    meshes.push(finishGroundMesh);
    
    const finishZ = finishGroundPos.z;
    
    // --- Obstacles ---
    const obstacleMat = new THREE.MeshStandardMaterial({
        color: 0xcc3333,
        metalness: 0.8,
        roughness: 0.2
    });
    
    for (let i = 0; i < 20; i++) {
        const rand = (Math.random() + Math.random()) / 2;
        const zPos = -80 + rand * 160;
        const xPos = (Math.random() - 0.5) * (trackWidth - 6);
        const isCylinder = Math.random() > 0.5;
        
        let obstacleShape: CANNON.Shape;
        let obstacleMesh: THREE.Mesh;
        let obsHeight: number;
        
        if (isCylinder) {
            obsHeight = 4;
            obstacleShape = new CANNON.Cylinder(1, 1, obsHeight, 12);
            const obsGeo = new THREE.CylinderGeometry(1, 1, obsHeight, 12);
            obstacleMesh = new THREE.Mesh(obsGeo, obstacleMat);
        } else {
            obsHeight = 2;
            obstacleShape = new CANNON.Box(new CANNON.Vec3(1.5, obsHeight / 2, 1.5));
            const obsGeo = new THREE.BoxGeometry(3, obsHeight, 3);
            obstacleMesh = new THREE.Mesh(obsGeo, obstacleMat);
        }
        
        const localPos = new THREE.Vector3(xPos, 0.5 + obsHeight / 2, zPos);
        localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
        const obsPos = rampPos.clone().add(localPos);
        
        const obsBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(obsPos.x, obsPos.y, obsPos.z),
            material: MATERIALS.obstacle,
            collisionFilterGroup: COLLISION_GROUPS.ENVIRONMENT,
            collisionFilterMask: COLLISION_GROUPS.RACER
        });
        obsBody.addShape(obstacleShape);
        obsBody.quaternion.copy(rampQuat);
        
        world.addBody(obsBody);
        bodies.push(obsBody);
        
        obstacleMesh.position.copy(obsPos);
        obstacleMesh.rotation.x = angleRad;
        obstacleMesh.castShadow = true;
        obstacleMesh.receiveShadow = true;
        scene.add(obstacleMesh);
        meshes.push(obstacleMesh);
    }
    
    return {
        ramp: rampMesh,
        bodies,
        meshes,
        animatedObjects,
        finishZ,
        rampPos,
        angleRad
    };
}

export function updateTrackAnimations(animatedObjects: AnimatedObject[], deltaTime: number): void {
    animatedObjects.forEach(obj => {
        if (obj.update) {
            obj.update(deltaTime);
        }
    });
}
