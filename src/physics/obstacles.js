import * as BABYLON from '@babylonjs/core';

export function createSpinningHammer(scene, position, material, parent) {
    // Static Base (Pillar)
    const baseHeight = 2;
    const base = BABYLON.MeshBuilder.CreateCylinder("hammerBase", { diameter: 1, height: baseHeight }, scene);
    base.parent = parent;
    base.position = position.clone();
    base.position.y += 0.5 + baseHeight / 2; // 0.5 is ramp half-height
    base.material = material;

    new BABYLON.PhysicsAggregate(base, BABYLON.PhysicsShapeType.CYLINDER, {
        mass: 0, // Static
        restitution: 0.5,
        collision: { membership: 2, collideWith: 1 }
    }, scene);

    // Rotating Head (Hammer)
    const hammerWidth = 8;
    const hammerHeight = 1;
    const hammerDepth = 1;
    const hammer = BABYLON.MeshBuilder.CreateBox("hammerHead", { width: hammerWidth, height: hammerHeight, depth: hammerDepth }, scene);
    // Position it on top of the base
    hammer.parent = parent; // Important for physics to move with parent if parent moves (though ramp is static)
    hammer.position = base.position.clone();
    hammer.position.y += baseHeight / 2 + hammerHeight / 2;
    hammer.material = material;

    // Visual "Arms"
    const arm = BABYLON.MeshBuilder.CreateBox("hammerArm", { width: 1, height: 0.5, depth: 4 }, scene);
    arm.parent = hammer;
    arm.position.y = 0;
    arm.material = material;

    const agg = new BABYLON.PhysicsAggregate(hammer, BABYLON.PhysicsShapeType.BOX, {
        mass: 100, // Heavy enough to knock racers
        restitution: 0.8, // Bouncy
        friction: 0.1,
        collision: { membership: 2, collideWith: 1 }
    }, scene);

    // Hinge Constraint (Spin around Y axis)
    const hinge = new BABYLON.Physics6DoFConstraint(
        {
            pivotA: new BABYLON.Vector3(0, baseHeight / 2 + 0.5, 0),
            pivotB: new BABYLON.Vector3(0, 0, 0),
            axisA: new BABYLON.Vector3(0, 1, 0),
            axisB: new BABYLON.Vector3(0, 1, 0),
        },
        [
            { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
            { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
            { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 },
            { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0 },
            // ANGULAR_Y is free to rotate
        ],
        scene
    );

    base.physicsBody.addConstraint(hammer.physicsBody, hinge);

    // Motor for spinning
    // Note: Havok 6DoF motors are a bit complex in Babylon. 
    // A simpler way for continuous spin is setting angular velocity directly if it's kinematic, 
    // but for dynamic interaction, we want a motor.
    // Let's try a HingeConstraint instead of 6DoF if possible, but 6DoF is generic.
    // Actually, let's just use a HingeConstraint specifically if available, or configure the motor on the 6DoF.

    // Using setAxisMotorTarget on the constraint
    hinge.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, BABYLON.PhysicsConstraintMotorType.VELOCITY);
    hinge.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 5); // Speed
    hinge.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 10000);

    return { base, hammer };
}

export function createSlidingWall(scene, position, trackWidth, material, parent) {
    const wallWidth = trackWidth / 2;
    const wallHeight = 3;
    const wallDepth = 1;

    const wall = BABYLON.MeshBuilder.CreateBox("slidingWall", { width: wallWidth, height: wallHeight, depth: wallDepth }, scene);
    wall.parent = parent;
    wall.position = position.clone();
    wall.position.y += 0.5 + wallHeight / 2;
    wall.material = material;

    // Use ANIMATED motion type (Kinematic) so it pushes things but isn't pushed back
    const agg = new BABYLON.PhysicsAggregate(wall, BABYLON.PhysicsShapeType.BOX, {
        mass: 0, // Infinite mass effectively for animated
        restitution: 1.0, // Very bouncy
        friction: 0.0,
        collision: { membership: 2, collideWith: 1 }
    }, scene);

    agg.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);

    // Create Animation
    const frameRate = 30;
    const slide = new BABYLON.Animation("slide", "position.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    const limit = (trackWidth - wallWidth) / 2 - 1; // Keep inside track

    const keyFrames = [];
    keyFrames.push({ frame: 0, value: -limit });
    keyFrames.push({ frame: frameRate * 2, value: limit });
    keyFrames.push({ frame: frameRate * 4, value: -limit });

    slide.setKeys(keyFrames);

    wall.animations.push(slide);
    scene.beginAnimation(wall, 0, frameRate * 4, true);

    return wall;
}
