// src/physics/track.js
import * as BABYLON from '@babylonjs/core';
import { createSpinningHammer, createSlidingWall } from './obstacles';

export function createTrack(scene, slopeAngle) {
    const angleRad = BABYLON.Tools.ToRadians(slopeAngle);
    const trackLength = 200;
    const trackWidth = 20;

    // --- Ramp ---
    const ramp = BABYLON.MeshBuilder.CreateBox("ramp", { width: trackWidth, height: 1, depth: trackLength }, scene);
    ramp.rotation.x = angleRad;

    const drop = Math.sin(angleRad) * (trackLength / 2);
    const forward = Math.cos(angleRad) * (trackLength / 2);
    ramp.position = new BABYLON.Vector3(0, -drop, forward);

    // Ramp Material (Asphalt)
    const rampMat = new BABYLON.PBRMaterial("rampMat", scene);
    rampMat.albedoColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    rampMat.roughness = 0.7;
    rampMat.metallic = 0.0;

    // Diffuse Texture (Asphalt/Concrete)
    const rampTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/ground.jpg", scene);
    rampTexture.uScale = 5;
    rampTexture.vScale = 50;
    rampMat.albedoTexture = rampTexture;

    // Bump Texture
    const noiseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/rock.png", scene);
    noiseTexture.uScale = 10;
    noiseTexture.vScale = 50;
    rampMat.bumpTexture = noiseTexture;
    rampMat.bumpTexture.level = 0.5;

    ramp.material = rampMat;

    new BABYLON.PhysicsAggregate(ramp, BABYLON.PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.5,
        friction: 0.2, // Low friction for speed
        collision: { membership: 2, collideWith: 1 }
    }, scene);

    // --- Walls ---
    const wallHeight = 10;
    const wallMat = new BABYLON.PBRMaterial("wallMat", scene);
    wallMat.albedoColor = new BABYLON.Color3(0.1, 0.8, 0.9);
    wallMat.alpha = 0.4;
    wallMat.roughness = 0.1;
    wallMat.metallic = 0.0;
    wallMat.subSurface.isRefractionEnabled = true;
    wallMat.emissiveColor = new BABYLON.Color3(0.0, 0.2, 0.3);
    wallMat.emissiveIntensity = 0.5;

    const createWall = (xOffset, name) => {
        const wall = BABYLON.MeshBuilder.CreateBox(name, { width: 0.5, height: wallHeight, depth: trackLength }, scene);
        wall.parent = ramp;
        wall.position.x = xOffset;
        wall.position.y = wallHeight / 2;
        wall.material = wallMat;
        new BABYLON.PhysicsAggregate(wall, BABYLON.PhysicsShapeType.BOX, {
            mass: 0,
            restitution: 0.3,
            collision: { membership: 2, collideWith: 1 }
        }, scene);
    };

    createWall(-trackWidth / 2 - 0.25, "wallL");
    createWall(trackWidth / 2 + 0.25, "wallR");

    // --- Finish Line ---
    const finishStrip = BABYLON.MeshBuilder.CreateGround("finishStrip", { width: trackWidth, height: 3 }, scene);
    finishStrip.parent = ramp;
    finishStrip.position.z = trackLength / 2 - 1.5;
    finishStrip.position.y = 0.51;

    const finishMat = new BABYLON.PBRMaterial("finishMat", scene);
    finishMat.albedoColor = new BABYLON.Color3(1, 0, 0);
    finishMat.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1);
    finishMat.emissiveIntensity = 2.0;
    finishStrip.material = finishMat;

    // --- Obstacles ---
    const obstacleMat = new BABYLON.PBRMaterial("obstacleMat", scene);
    obstacleMat.albedoColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    obstacleMat.metallic = 0.8;
    obstacleMat.roughness = 0.2;

    for (let i = 0; i < 20; i++) {
        // Z: -80 to 80 (Safe range within -100 to 100)
        const rand = (Math.random() + Math.random()) / 2;
        const zPos = -80 + rand * 160;

        const obstacleType = Math.random();

        if (obstacleType < 0.2) {
            // 20% Chance: Spinning Hammer
            const xPos = (Math.random() - 0.5) * 5;
            createSpinningHammer(scene, new BABYLON.Vector3(xPos, 0, zPos), obstacleMat, ramp);

        } else if (obstacleType < 0.4) {
            // 20% Chance: Sliding Wall
            createSlidingWall(scene, new BABYLON.Vector3(0, 0, zPos), trackWidth, obstacleMat, ramp);

        } else {
            // 60% Chance: Static Obstacle
            const xPos = (Math.random() - 0.5) * (trackWidth - 6);
            const isCylinder = Math.random() > 0.5;
            let obstacle;
            let shapeType;
            let obsHeight;

            if (isCylinder) {
                obsHeight = 4;
                obstacle = BABYLON.MeshBuilder.CreateCylinder("obs" + i, { diameter: 2, height: obsHeight }, scene);
                shapeType = BABYLON.PhysicsShapeType.CYLINDER;
            } else {
                obsHeight = 2;
                obstacle = BABYLON.MeshBuilder.CreateBox("obs" + i, { width: 3, height: obsHeight, depth: 3 }, scene);
                shapeType = BABYLON.PhysicsShapeType.BOX;
            }

            obstacle.parent = ramp;
            obstacle.position = new BABYLON.Vector3(xPos, 0.5 + obsHeight / 2, zPos);
            obstacle.material = obstacleMat;

            new BABYLON.PhysicsAggregate(obstacle, shapeType, {
                mass: 0,
                restitution: 0.5,
                friction: 0.5,
                collision: { membership: 2, collideWith: 1 }
            }, scene);
        }
    }


    return { ramp, finishZ: finishStrip.getAbsolutePosition().z };
}
