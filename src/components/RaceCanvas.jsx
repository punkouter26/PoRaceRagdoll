// src/components/RaceCanvas.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { createTrack } from '../physics/track';
import { createRagdoll } from '../physics/ragdolls';
import { RACER_SPECIES } from '../config';
import { audioManager } from '../audio';
import { useGameStore } from '../store/gameStore';

export default function RaceCanvas() {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const sceneRef = useRef(null);
    const racersRef = useRef([]); // Stores { id, root, parts, aggregates, finished }
    const finishZRef = useRef(0);
    const raceActiveRef = useRef(false);
    const raceDataRef = useRef([]);
    const frameCountRef = useRef(0);

    const { gameState, racers, finishRace } = useGameStore();
    const [countdown, setCountdown] = useState(null);
    const [debugData, setDebugData] = useState("");

    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;

        const initEngine = async () => {
            const engine = new BABYLON.Engine(canvasRef.current, true);
            engineRef.current = engine;

            const scene = new BABYLON.Scene(engine);
            sceneRef.current = scene;

            // --- NEXT GEN GRAPHICS SETTINGS ---
            scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.1, 1);
            scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
            scene.fogDensity = 0.002;
            scene.fogColor = new BABYLON.Color3(0.05, 0.05, 0.1);

            // Physics
            try {
                const wasmBinary = await fetch('https://cdn.babylonjs.com/havok/HavokPhysics.wasm').then(res => res.arrayBuffer());
                if (!isMounted) { engine.dispose(); return; }

                const havokInstance = await HavokPhysics({ wasmBinary });
                const hk = new BABYLON.HavokPlugin(false, havokInstance);
                scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);
            } catch (e) {
                console.error("Havok init failed:", e);
                return;
            }

            if (!isMounted) { engine.dispose(); return; }

            // Environment
            const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.env", scene);
            scene.environmentTexture = envTexture;
            scene.createDefaultSkybox(envTexture, true, 1000);

            // Camera
            const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 50, new BABYLON.Vector3(0, 0, 10), scene);
            camera.attachControl(canvasRef.current, true);
            camera.minZ = 0.1;
            camera.maxZ = 5000;

            // Lights
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 0.5;

            const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
            dirLight.position = new BABYLON.Vector3(50, 100, 50);
            dirLight.intensity = 2.0;
            dirLight.shadowMinZ = 1;
            dirLight.shadowMaxZ = 500;

            // Shadows
            const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 32;
            shadowGenerator.transparencyShadow = true;

            // Ground
            const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 2000, height: 2000 }, scene);
            ground.position.y = -150;
            const groundMat = new BABYLON.PBRMaterial("groundMat", scene);
            groundMat.albedoColor = new BABYLON.Color3(0.02, 0.05, 0.02);
            groundMat.roughness = 0.8;
            groundMat.metallic = 0.1;
            const groundTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.png", scene);
            groundTexture.uScale = 50;
            groundTexture.vScale = 50;
            groundMat.albedoTexture = groundTexture;
            ground.material = groundMat;
            ground.receiveShadows = true;

            new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, {
                mass: 0,
                restitution: 0.5,
                friction: 0.5,
                collision: { membership: 2, collideWith: 1 }
            }, scene);

            // Track - SHORTENED TO 3 FOR TESTING
            const { ramp, finishZ } = createTrack(scene, 15);
            finishZRef.current = finishZ;
            ramp.getChildMeshes().forEach(m => {
                m.receiveShadows = true;
                shadowGenerator.addShadowCaster(m);
            });
            ramp.receiveShadows = true;

            // Create Racers
            const startZ = 2; // Closer to start
            const startY = 2; // Gentle drop
            const laneWidth = 2.0;

            racersRef.current = racers.map((racerData, index) => {
                const xPos = (index - 3.5) * laneWidth;
                const species = RACER_SPECIES.find(s => s.name === racerData.species) || RACER_SPECIES[0];
                const ragdoll = createRagdoll(scene, new BABYLON.Vector3(xPos, startY, startZ), species);

                ragdoll.parts.forEach(part => {
                    shadowGenerator.addShadowCaster(part);
                    part.receiveShadows = true;
                });

                ragdoll.aggregates.forEach(agg => {
                    agg.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
                });

                return {
                    id: racerData.id,
                    root: ragdoll.root,
                    parts: ragdoll.parts,
                    aggregates: ragdoll.aggregates,
                    finished: false
                };
            });

            // --- POST PROCESSING PIPELINE ---
            const pipeline = new BABYLON.DefaultRenderingPipeline(
                "defaultPipeline",
                true, // HDR
                scene,
                [camera]
            );
            pipeline.samples = 4;
            pipeline.fxaaEnabled = true;

            // Bloom
            pipeline.bloomEnabled = true;
            pipeline.bloomThreshold = 0.6;
            pipeline.bloomWeight = 0.4;
            pipeline.bloomKernel = 64;
            pipeline.bloomScale = 0.5;

            // Tone Mapping
            pipeline.imageProcessingEnabled = true;
            pipeline.imageProcessing.toneMappingEnabled = true;
            pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
            pipeline.imageProcessing.exposure = 1.2;
            pipeline.imageProcessing.contrast = 1.2;

            // Depth of Field
            // DISABLED due to excessive blurriness
            pipeline.depthOfFieldEnabled = false;

            // Render Loop
            engine.runRenderLoop(() => {
                if (scene && scene.activeCamera) {
                    scene.render();
                    checkRaceStatus();

                    const currentGameState = useGameStore.getState().gameState;

                    // --- TELEMETRY ---
                    if (raceActiveRef.current && racersRef.current.length > 0) {
                        const leader = racersRef.current.reduce((prev, curr) =>
                            (curr.root.absolutePosition.z > prev.root.absolutePosition.z) ? curr : prev
                        );
                        const leaderZ = leader.root.absolutePosition.z.toFixed(2);
                        const finish = finishZRef.current.toFixed(2);

                        // Update on-screen debug every 60 frames to avoid thrashing React
                        if (frameCountRef.current % 60 === 0) {
                            setDebugData(`LeaderZ: ${leaderZ} / FinishZ: ${finish} | State: ${currentGameState}`);
                        }
                    }

                    // --- RACE DATA TRACKING ---
                    if (raceActiveRef.current && racersRef.current.length > 0) {
                        frameCountRef.current++;
                        if (frameCountRef.current % 10 === 0) { // Log every ~10 frames
                            const now = Date.now();
                            const snapshot = racersRef.current.map(r => ({
                                id: r.id,
                                parts: r.parts.map(p => ({
                                    n: p.name,
                                    x: parseFloat(p.absolutePosition.x.toFixed(2)),
                                    y: parseFloat(p.absolutePosition.y.toFixed(2)),
                                    z: parseFloat(p.absolutePosition.z.toFixed(2))
                                }))
                            }));
                            raceDataRef.current.push({ t: now, r: snapshot });
                        }
                    }

                    // --- ATTRACT MODE (Camera Flyover) ---
                    if (currentGameState === 'BETTING') {
                        const cam = scene.activeCamera;
                        cam.alpha += 0.002;
                        cam.beta = Math.PI / 3 + Math.sin(Date.now() * 0.0005) * 0.1;
                        cam.radius = 8 + Math.sin(Date.now() * 0.0002) * 2;
                        cam.setTarget(new BABYLON.Vector3(0, 0, 50));
                    }

                    // --- RACE MODE (Camera Follow) ---
                    else if (raceActiveRef.current && racersRef.current.length > 0) {
                        let leader = racersRef.current[0];
                        let maxZ = -Infinity;

                        racersRef.current.forEach(r => {
                            const z = r.root.absolutePosition.z;
                            if (z > maxZ) {
                                maxZ = z;
                                leader = r;
                            }
                        });

                        if (leader) {
                            const cam = scene.activeCamera;
                            const targetPos = leader.root.absolutePosition.clone();
                            targetPos.y += 1;
                            cam.setTarget(BABYLON.Vector3.Lerp(cam.target, targetPos, 0.05));
                        }
                    }
                }
            });

            window.addEventListener('resize', () => engine.resize());
        };

        initEngine();

        return () => {
            isMounted = false;
            if (engineRef.current) engineRef.current.dispose();
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

        // STEP 1: Reset all velocities to zero BEFORE enabling physics
        racersRef.current.forEach(r => {
            r.aggregates.forEach(agg => {
                agg.body.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
                agg.body.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
            });
        });

        // STEP 2: Wait a few frames for physics to stabilize, then enable
        setTimeout(() => {
            racersRef.current.forEach(r => {
                r.aggregates.forEach(agg => {
                    agg.body.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC);
                });
            });
            
            // Debug log: Check for any ragdolls with high initial velocity
            setTimeout(() => {
                racersRef.current.forEach((r, idx) => {
                    const rootVel = r.aggregates[0]?.body.getLinearVelocity();
                    if (rootVel) {
                        const speed = Math.sqrt(rootVel.x**2 + rootVel.y**2 + rootVel.z**2);
                        if (speed > 5) {
                            console.warn(`⚠️ Racer ${idx} has high initial velocity: ${speed.toFixed(2)}`);
                        }
                    }
                });
            }, 100);
            
            raceActiveRef.current = true;
        }, 50); // 50ms delay for stability

        if (sceneRef.current && sceneRef.current.activeCamera) {
            const camera = sceneRef.current.activeCamera;
            camera.setTarget(new BABYLON.Vector3(0, 5, 50));
            camera.radius = 12; // Relaxed Zoom
            camera.alpha = -Math.PI / 2; // Behind
            camera.beta = Math.PI / 2.5; // Angled Down
        }
    };

    const resetRace = () => {
        raceActiveRef.current = false;
        racersRef.current.forEach(r => {
            r.finished = false;
            r.aggregates.forEach(agg => {
                agg.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
            });
        });
        if (sceneRef.current && sceneRef.current.activeCamera) {
            const camera = sceneRef.current.activeCamera;
            camera.setTarget(new BABYLON.Vector3(0, 0, 10));
            camera.radius = 12;
            camera.alpha = -Math.PI / 2;
            camera.beta = Math.PI / 2.5;
        }
    };

    const checkRaceStatus = () => {
        if (!raceActiveRef.current) return;

        // Check for winner
        const winner = racersRef.current.find(r => !r.finished && r.root.absolutePosition.z > finishZRef.current);

        if (winner) {
            winner.finished = true;
            raceActiveRef.current = false;

            // EXPORT DATA
            // Trigger state update to show data on UI and window object
            const json = JSON.stringify(raceDataRef.current);
            console.log("RACE_DATA_EXPORT_START");
            // console.log(json); // Prevent console spam if huge
            console.log("RACE_DATA_EXPORT_END");

            setDebugData(json);
            window.RACE_DATA = json;

            finishRace(winner.id); // Notify Store
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

            {/* Visual Indicator for Subagent */}
            {debugData && (
                <div id="data-ready-indicator" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50px', backgroundColor: 'red', zIndex: 9999, color: 'white', fontSize: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    DATA EXPORTED
                </div>
            )}

            <textarea id="race-data" readOnly style={{ position: 'absolute', top: '50px', left: 0, width: '100px', height: '100px', zIndex: 9999, opacity: 0.1 }} value={debugData} />
        </div>
    );
}
