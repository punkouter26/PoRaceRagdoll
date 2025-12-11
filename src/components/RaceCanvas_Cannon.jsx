// src/components/RaceCanvas.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPhysicsWorld, setupContactMaterials, COLLISION_GROUPS } from '../physics/world';
import { createTrack, updateTrackAnimations } from '../physics/track_cannon';
import { createRagdoll, syncRagdolls, RACER_SPECIES } from '../physics/ragdolls_cannon';
import { audioManager } from '../audio';
import { useGameStore } from '../store/gameStore';

// --- PROCEDURAL SCENERY GENERATION ---
function createScenery(scene, groundY) {
    const trackWidth = 30; // Keep scenery away from track
    
    // Materials
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x0d5c0d, roughness: 0.8 });
    const buildingMats = [
        new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x4682b4, roughness: 0.5, metalness: 0.3 }),
    ];
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.6 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 1.0 });
    
    // Helper: Create a tree
    function createTree(x, z, type = 'deciduous') {
        const group = new THREE.Group();
        
        if (type === 'deciduous') {
            // Trunk
            const trunkHeight = 2 + Math.random() * 2;
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, trunkHeight, 8);
            const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            group.add(trunk);
            
            // Leaves (sphere cluster)
            const leavesSize = 1.5 + Math.random() * 1.5;
            const leavesGeo = new THREE.SphereGeometry(leavesSize, 8, 8);
            const leaves = new THREE.Mesh(leavesGeo, treeLeavesMat);
            leaves.position.y = trunkHeight + leavesSize * 0.5;
            leaves.castShadow = true;
            group.add(leaves);
        } else {
            // Pine tree
            const trunkHeight = 1.5 + Math.random();
            const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 6);
            const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            group.add(trunk);
            
            // Cone layers
            const layers = 3 + Math.floor(Math.random() * 2);
            for (let i = 0; i < layers; i++) {
                const coneHeight = 2 - i * 0.3;
                const coneRadius = 1.5 - i * 0.3;
                const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
                const cone = new THREE.Mesh(coneGeo, pineMat);
                cone.position.y = trunkHeight + i * 1.2 + coneHeight / 2;
                cone.castShadow = true;
                group.add(cone);
            }
        }
        
        group.position.set(x, groundY, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        scene.add(group);
    }
    
    // Helper: Create a building
    function createBuilding(x, z) {
        const group = new THREE.Group();
        
        const width = 5 + Math.random() * 10;
        const depth = 5 + Math.random() * 10;
        const height = 8 + Math.random() * 25;
        const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)];
        
        // Main structure
        const buildingGeo = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeo, mat);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Windows
        const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0x87ceeb, 
            emissive: 0x111122,
            roughness: 0.1, 
            metalness: 0.8 
        });
        const windowRows = Math.floor(height / 3);
        const windowCols = Math.floor(width / 2);
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                if (Math.random() > 0.3) {
                    const winGeo = new THREE.PlaneGeometry(0.8, 1.2);
                    const win = new THREE.Mesh(winGeo, windowMat);
                    win.position.set(
                        -width / 2 + 1 + col * 2,
                        2 + row * 3,
                        depth / 2 + 0.01
                    );
                    group.add(win);
                }
            }
        }
        
        // Roof (random style)
        if (Math.random() > 0.5 && height < 20) {
            const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 4, 4);
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = height + 2;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            group.add(roof);
        }
        
        group.position.set(x, groundY, z);
        group.rotation.y = Math.random() * Math.PI * 0.5;
        scene.add(group);
    }
    
    // Helper: Create a rock
    function createRock(x, z) {
        const size = 0.5 + Math.random() * 2;
        const geo = new THREE.DodecahedronGeometry(size, 0);
        const rock = new THREE.Mesh(geo, rockMat);
        rock.position.set(x, groundY + size * 0.3, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.set(1, 0.6 + Math.random() * 0.4, 1);
        rock.castShadow = true;
        scene.add(rock);
    }
    
    // --- GENERATE SCENERY ---
    
    // Trees - scattered around but away from track
    for (let i = 0; i < 200; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (trackWidth + 10 + Math.random() * 200);
        const z = -100 + Math.random() * 400;
        const type = Math.random() > 0.4 ? 'deciduous' : 'pine';
        createTree(x, z, type);
    }
    
    // Forest clusters
    for (let cluster = 0; cluster < 8; cluster++) {
        const clusterX = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 150);
        const clusterZ = -50 + Math.random() * 350;
        for (let t = 0; t < 15; t++) {
            const x = clusterX + (Math.random() - 0.5) * 30;
            const z = clusterZ + (Math.random() - 0.5) * 30;
            createTree(x, z, Math.random() > 0.3 ? 'pine' : 'deciduous');
        }
    }
    
    // Buildings - city area on one side
    const cityX = 80 + Math.random() * 20;
    for (let i = 0; i < 25; i++) {
        const x = cityX + (i % 5) * 20 + Math.random() * 5;
        const z = 50 + Math.floor(i / 5) * 25 + Math.random() * 5;
        createBuilding(x, z);
    }
    
    // Scattered buildings on other side
    for (let i = 0; i < 10; i++) {
        const x = -60 - Math.random() * 100;
        const z = Math.random() * 300;
        createBuilding(x, z);
    }
    
    // Rocks scattered
    for (let i = 0; i < 50; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (trackWidth + 5 + Math.random() * 150);
        const z = -50 + Math.random() * 350;
        createRock(x, z);
    }
}

export default function RaceCanvas() {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const worldRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    
    const racersRef = useRef([]);
    const trackRef = useRef(null);
    const finishZRef = useRef(0);
    const raceActiveRef = useRef(false);
    const raceDataRef = useRef([]);
    const frameCountRef = useRef(0);
    const animationIdRef = useRef(null);

    const { gameState, racers, finishRace } = useGameStore();
    const [countdown, setCountdown] = useState(null);
    const [debugData, setDebugData] = useState("");

    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;

        const init = () => {
            // --- THREE.JS SETUP ---
            const renderer = new THREE.WebGLRenderer({ 
                canvas: canvasRef.current, 
                antialias: true,
                alpha: false
            });
            renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            rendererRef.current = renderer;

            // Scene
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0d0d1a);
            scene.fog = new THREE.FogExp2(0x0d0d1a, 0.002);
            sceneRef.current = scene;

            // Camera
            const camera = new THREE.PerspectiveCamera(
                60,
                canvasRef.current.clientWidth / canvasRef.current.clientHeight,
                0.1,
                5000
            );
            camera.position.set(0, 10, -20);
            camera.lookAt(0, 0, 50);
            cameraRef.current = camera;

            // Controls
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.target.set(0, 0, 10);
            controlsRef.current = controls;

            // --- LIGHTING ---
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
            scene.add(ambientLight);

            const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362f2f, 0.5);
            scene.add(hemisphereLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
            dirLight.position.set(50, 100, 50);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 1;
            dirLight.shadow.camera.far = 500;
            dirLight.shadow.camera.left = -100;
            dirLight.shadow.camera.right = 100;
            dirLight.shadow.camera.top = 100;
            dirLight.shadow.camera.bottom = -100;
            scene.add(dirLight);

            // --- PHYSICS SETUP ---
            const world = createPhysicsWorld();
            setupContactMaterials(world);
            worldRef.current = world;

            // --- GROUND PLANE ---
            const groundY = -50; // Ground level below the ramp
            const groundGeo = new THREE.PlaneGeometry(2000, 2000);
            const groundTexture = new THREE.TextureLoader().load('https://playground.babylonjs.com/textures/grass.png');
            groundTexture.wrapS = THREE.RepeatWrapping;
            groundTexture.wrapT = THREE.RepeatWrapping;
            groundTexture.repeat.set(100, 100);
            
            const groundMat = new THREE.MeshStandardMaterial({
                map: groundTexture,
                color: 0x228B22, // Forest green
                roughness: 0.9,
                metalness: 0.0
            });
            
            const groundMesh = new THREE.Mesh(groundGeo, groundMat);
            groundMesh.rotation.x = -Math.PI / 2;
            groundMesh.position.y = groundY;
            groundMesh.receiveShadow = true;
            scene.add(groundMesh);

            // Ground physics
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(groundShape);
            groundBody.position.y = groundY;
            groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
            groundBody.collisionFilterGroup = COLLISION_GROUPS.ENVIRONMENT;
            groundBody.collisionFilterMask = COLLISION_GROUPS.RACER;
            world.addBody(groundBody);

            // --- PROCEDURAL SCENERY ---
            createScenery(scene, groundY);

            // --- TRACK ---
            const track = createTrack(scene, world, 30); // 20% steeper ramp angle
            trackRef.current = track;
            finishZRef.current = track.finishZ;

            // --- CREATE RACERS ---
            const startZ = 5;
            const startY = 14; // Higher start to be above the raised ramp
            const laneWidth = 2.0;

            racersRef.current = racers.map((racerData, index) => {
                const xPos = (index - 3.5) * laneWidth;
                const species = RACER_SPECIES.find(s => s.name === racerData.species) || RACER_SPECIES[0];
                const speciesWithColor = { ...species, color: racerData.color || species.color };
                
                const ragdoll = createRagdoll(
                    scene, 
                    world, 
                    new THREE.Vector3(xPos, startY, startZ), 
                    speciesWithColor
                );

                // Set bodies to sleep initially
                ragdoll.bodies.forEach(body => {
                    body.sleep();
                });

                return {
                    id: racerData.id,
                    root: ragdoll.root,
                    parts: ragdoll.parts,
                    bodies: ragdoll.bodies,
                    constraints: ragdoll.constraints,
                    finished: false
                };
            });

            // --- ANIMATION LOOP ---
            const animate = () => {
                if (!isMounted) return;
                
                animationIdRef.current = requestAnimationFrame(animate);
                
                const deltaTime = clockRef.current.getDelta();
                const currentGameState = useGameStore.getState().gameState;

                // Update physics
                if (raceActiveRef.current) {
                    world.step(1 / 60, deltaTime, 3);
                    
                    // Sync ragdoll meshes with physics bodies
                    syncRagdolls(racersRef.current);
                    
                    // Update animated obstacles
                    if (trackRef.current?.animatedObjects) {
                        updateTrackAnimations(trackRef.current.animatedObjects, deltaTime);
                    }
                }

                // Update controls
                controls.update();

                // --- TELEMETRY ---
                if (raceActiveRef.current && racersRef.current.length > 0) {
                    const leader = racersRef.current.reduce((prev, curr) =>
                        (curr.root.position.z > prev.root.position.z) ? curr : prev
                    );
                    const leaderZ = leader.root.position.z.toFixed(2);
                    const leaderVelZ = leader.bodies[0]?.velocity?.z?.toFixed(2) || '0';
                    const finish = finishZRef.current.toFixed(2);

                    if (frameCountRef.current % 30 === 0) {
                        setDebugData(`LeaderZ: ${leaderZ} | Vel: ${leaderVelZ} | Finish: ${finish}`);
                        console.log(`Race: LeaderZ=${leaderZ}, VelZ=${leaderVelZ}, Finish=${finish}`);
                    }
                }

                // --- RACE DATA TRACKING ---
                if (raceActiveRef.current && racersRef.current.length > 0) {
                    frameCountRef.current++;
                    if (frameCountRef.current % 10 === 0) {
                        const now = Date.now();
                        const snapshot = racersRef.current.map(r => ({
                            id: r.id,
                            parts: r.parts.map(p => ({
                                n: p.name,
                                x: parseFloat(p.position.x.toFixed(2)),
                                y: parseFloat(p.position.y.toFixed(2)),
                                z: parseFloat(p.position.z.toFixed(2))
                            }))
                        }));
                        raceDataRef.current.push({ t: now, r: snapshot });
                    }
                }

                // --- ATTRACT MODE (Camera Flyover) ---
                if (currentGameState === 'BETTING') {
                    const time = Date.now() * 0.001;
                    camera.position.x = Math.sin(time * 0.2) * 15;
                    camera.position.y = 8 + Math.sin(time * 0.5) * 2;
                    camera.position.z = -10 + Math.cos(time * 0.2) * 10;
                    camera.lookAt(0, 0, 50);
                    controls.target.set(0, 0, 50);
                }

                // --- RACE MODE (Camera Follow - 180° Front View) ---
                else if (raceActiveRef.current && racersRef.current.length > 0) {
                    let leader = racersRef.current[0];
                    let maxZ = -Infinity;

                    racersRef.current.forEach(r => {
                        const z = r.root.position.z;
                        if (z > maxZ) {
                            maxZ = z;
                            leader = r;
                        }
                    });

                    if (leader) {
                        const targetPos = leader.root.position.clone();
                        targetPos.y += 1;
                        controls.target.lerp(targetPos, 0.05);
                        
                        // Position camera IN FRONT of leader, looking back at them
                        const camTarget = targetPos.clone();
                        camTarget.y += 8; // Above eye level
                        camTarget.z += 30; // AHEAD of the leader (positive Z)
                        camera.position.lerp(camTarget, 0.03);
                    }
                }

                // Check race status
                checkRaceStatus();

                // Render
                renderer.render(scene, camera);
            };

            animate();

            // Handle resize
            const handleResize = () => {
                if (!canvasRef.current) return;
                const width = canvasRef.current.clientWidth;
                const height = canvasRef.current.clientHeight;
                
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
            };
        };

        init();

        return () => {
            isMounted = false;
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [racers]);

    // Handle Game State
    useEffect(() => {
        if (gameState === 'RACING' && !raceActiveRef.current) {
            setCountdown(3);
        }
        if (gameState === 'BETTING') {
            resetRace();
            setCountdown(null);
        }
    }, [gameState]);

    // Countdown
    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            audioManager.playTone(400, 'square', 0.1, 0.1);
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            audioManager.playTone(800, 'sawtooth', 0.5, 0.1);
            startRace();
            const timer = setTimeout(() => setCountdown(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const startRace = () => {
        // Reset Logging
        raceDataRef.current = [];
        frameCountRef.current = 0;

        // Wake up all bodies, disable sleep, and give initial push
        racersRef.current.forEach(r => {
            r.bodies.forEach(body => {
                body.wakeUp();
                body.allowSleep = false;
                body.velocity.set(0, 0, 2); // Initial forward velocity
                body.angularVelocity.set(0, 0, 0);
            });
        });

        // Start immediately
        raceActiveRef.current = true;

        // Reset camera
        if (cameraRef.current && controlsRef.current) {
            controlsRef.current.target.set(0, 5, 50);
            cameraRef.current.position.set(0, 10, -10);
        }
    };

    const resetRace = () => {
        raceActiveRef.current = false;
        racersRef.current.forEach(r => {
            r.finished = false;
            r.bodies.forEach(body => {
                body.sleep();
            });
        });
        
        if (cameraRef.current && controlsRef.current) {
            controlsRef.current.target.set(0, 0, 10);
            cameraRef.current.position.set(0, 10, -20);
        }
    };

    const checkRaceStatus = () => {
        if (!raceActiveRef.current) return;

        // Check for winner
        const winner = racersRef.current.find(r => !r.finished && r.root.position.z > finishZRef.current);

        if (winner) {
            winner.finished = true;
            raceActiveRef.current = false;

            // Export data
            const json = JSON.stringify(raceDataRef.current);
            console.log("RACE_DATA_EXPORT_START");
            console.log("RACE_DATA_EXPORT_END");

            setDebugData(json);
            window.RACE_DATA = json;

            finishRace(winner.id);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />
            {countdown !== null && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10rem] font-black text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-pulse font-mono z-50 pointer-events-none">
                    {countdown === 0 ? <span className="text-[#00ff88]">GO!</span> : countdown}
                </div>
            )}

            {/* Live Telemetry Display */}
            <div style={{ 
                position: 'absolute', 
                top: 10, 
                left: '50%', 
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)', 
                color: '#00ff88', 
                padding: '10px 20px', 
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '16px',
                zIndex: 100 
            }}>
                {debugData || 'Waiting for race...'}
            </div>

            <textarea id="race-data" readOnly style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '50px', zIndex: 9999, opacity: 0.3, fontSize: '10px' }} value={debugData} />
        </div>
    );
}
