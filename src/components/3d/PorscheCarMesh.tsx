import * as THREE from 'three';
import type { CarCustomization } from '../../context/SponsorContext';

export const createPorscheCarGroup = (carConfig: CarCustomization): THREE.Group => {
  const carGroup = new THREE.Group();
  carGroup.name = 'porsche_911_gt3_rs';

  // Materials
  const paintMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(carConfig.bodyColor),
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
  });

  const carbonFiberMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#151618'),
    metalness: 0.4,
    roughness: 0.35,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0a0c10'),
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.88,
    thickness: 0.5,
    transparent: true,
    opacity: 0.85,
  });

  const wheelRimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(carConfig.wheelColor),
    metalness: 0.9,
    roughness: 0.2,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1b1b1d'),
    roughness: 0.85,
    metalness: 0.05,
  });

  const brakeRotorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8e9095'),
    metalness: 0.9,
    roughness: 0.3,
  });

  const brakeCaliperMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f5b800'), // GT3 RS yellow calipers
    metalness: 0.5,
    roughness: 0.3,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#d4e8ff'),
    emissiveIntensity: carConfig.daytimeLights ? 2.5 : 0.2,
    metalness: 0.8,
    roughness: 0.1,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e00000'),
    emissive: new THREE.Color('#ff1111'),
    emissiveIntensity: 2.0,
    metalness: 0.2,
    roughness: 0.1,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d8d8d8'),
    metalness: 0.95,
    roughness: 0.1,
  });

  // --- 1. MAIN CAR BODY & AERODYNAMIC CHASSIS ---
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'car_body_group';

  // Lower chassis & side skirts
  const lowerBodyGeo = new THREE.BoxGeometry(1.88, 0.42, 4.35);
  const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, paintMaterial);
  lowerBodyMesh.position.set(0, 0.42, 0);
  lowerBodyMesh.castShadow = true;
  lowerBodyMesh.receiveShadow = true;
  bodyGroup.add(lowerBodyMesh);

  // Front Hood & Aerodynamic nose (911 sloping front)
  const hoodShape = new THREE.Shape();
  hoodShape.moveTo(-0.9, 0);
  hoodShape.lineTo(0.9, 0);
  hoodShape.lineTo(0.78, 1.4);
  hoodShape.lineTo(-0.78, 1.4);
  hoodShape.closePath();

  const hoodExtrudeSettings = { depth: 0.32, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.08, bevelThickness: 0.08 };
  const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, hoodExtrudeSettings);
  const hoodMesh = new THREE.Mesh(hoodGeo, paintMaterial);
  hoodMesh.rotation.x = Math.PI / 2 + 0.22;
  hoodMesh.position.set(0, 0.65, 0.75);
  hoodMesh.castShadow = true;
  bodyGroup.add(hoodMesh);

  // GT3 RS Hood Air Nostrils (radiator extractors in carbon fiber)
  const leftNostrilGeo = new THREE.BoxGeometry(0.24, 0.08, 0.48);
  const leftNostril = new THREE.Mesh(leftNostrilGeo, carbonFiberMaterial);
  leftNostril.position.set(-0.35, 0.74, 1.32);
  leftNostril.rotation.x = -0.22;
  bodyGroup.add(leftNostril);

  const rightNostril = leftNostril.clone();
  rightNostril.position.x = 0.35;
  bodyGroup.add(rightNostril);

  // Greenhouse & Sloping Teardrop Roof (Iconic 911 Roofline)
  const cabinGeo = new THREE.BoxGeometry(1.52, 0.58, 2.1);
  const cabinMesh = new THREE.Mesh(cabinGeo, paintMaterial);
  cabinMesh.position.set(0, 0.88, -0.2);
  bodyGroup.add(cabinMesh);

  // Carbon Fiber Roof (Weissach package)
  const roofTopGeo = new THREE.BoxGeometry(1.38, 0.04, 1.55);
  const roofTop = new THREE.Mesh(roofTopGeo, carbonFiberMaterial);
  roofTop.position.set(0, 1.18, -0.22);
  bodyGroup.add(roofTop);

  // Windshield (Front Glass)
  const windshieldGeo = new THREE.BoxGeometry(1.42, 0.48, 0.04);
  const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshield.position.set(0, 0.95, 0.72);
  windshield.rotation.x = -Math.PI / 4.2;
  bodyGroup.add(windshield);

  // Rear Window (Sloping back)
  const rearGlassGeo = new THREE.BoxGeometry(1.36, 0.68, 0.04);
  const rearGlass = new THREE.Mesh(rearGlassGeo, glassMaterial);
  rearGlass.position.set(0, 0.92, -1.05);
  rearGlass.rotation.x = Math.PI / 3.4;
  bodyGroup.add(rearGlass);

  // Side Windows
  const sideGlassLeftGeo = new THREE.BoxGeometry(0.04, 0.36, 1.45);
  const sideGlassLeft = new THREE.Mesh(sideGlassLeftGeo, glassMaterial);
  sideGlassLeft.position.set(-0.76, 0.92, -0.15);
  bodyGroup.add(sideGlassLeft);

  const sideGlassRight = sideGlassLeft.clone();
  sideGlassRight.position.x = 0.76;
  bodyGroup.add(sideGlassRight);

  // Flared Front & Rear Fenders (GT3 RS Widebody)
  const fenderGeo = new THREE.BoxGeometry(0.18, 0.45, 0.85);
  
  // Front Left Fender
  const frontLeftFender = new THREE.Mesh(fenderGeo, paintMaterial);
  frontLeftFender.position.set(-0.96, 0.52, 1.35);
  bodyGroup.add(frontLeftFender);

  // Front Right Fender
  const frontRightFender = frontLeftFender.clone();
  frontRightFender.position.x = 0.96;
  bodyGroup.add(frontRightFender);

  // GT3 RS Front Fender Louvers (carbon slats)
  for (let i = 0; i < 4; i++) {
    const louverGeo = new THREE.BoxGeometry(0.14, 0.02, 0.08);
    const louverL = new THREE.Mesh(louverGeo, carbonFiberMaterial);
    louverL.position.set(-0.96, 0.73, 1.22 + i * 0.1);
    louverL.rotation.z = -0.15;
    bodyGroup.add(louverL);

    const louverR = louverL.clone();
    louverR.position.x = 0.96;
    louverR.rotation.z = 0.15;
    bodyGroup.add(louverR);
  }

  // Rear Flared Fenders
  const rearLeftFender = new THREE.Mesh(fenderGeo, paintMaterial);
  rearLeftFender.position.set(-0.98, 0.54, -1.35);
  rearLeftFender.scale.set(1.15, 1.05, 1.15);
  bodyGroup.add(rearLeftFender);

  const rearRightFender = rearLeftFender.clone();
  rearRightFender.position.x = 0.98;
  bodyGroup.add(rearRightFender);

  // Side Air Intakes (GT3 RS side scoops)
  const sideScoopGeo = new THREE.BoxGeometry(0.12, 0.28, 0.35);
  const sideScoopL = new THREE.Mesh(sideScoopGeo, carbonFiberMaterial);
  sideScoopL.position.set(-0.97, 0.56, -0.8);
  bodyGroup.add(sideScoopL);

  const sideScoopR = sideScoopL.clone();
  sideScoopR.position.x = 0.97;
  bodyGroup.add(sideScoopR);

  // Front Bumper Splitter & Aerodynamic Aero Blades
  const frontSplitterGeo = new THREE.BoxGeometry(1.92, 0.06, 0.55);
  const frontSplitter = new THREE.Mesh(frontSplitterGeo, carbonFiberMaterial);
  frontSplitter.position.set(0, 0.16, 2.05);
  bodyGroup.add(frontSplitter);

  // Rear Bumper & Diffuser
  const rearDiffuserGeo = new THREE.BoxGeometry(1.86, 0.18, 0.45);
  const rearDiffuser = new THREE.Mesh(rearDiffuserGeo, carbonFiberMaterial);
  rearDiffuser.position.set(0, 0.22, -2.1);
  bodyGroup.add(rearDiffuser);

  // Dual Central Titanium Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.25, 16);
  const exhaustL = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustL.rotation.x = Math.PI / 2;
  exhaustL.position.set(-0.12, 0.28, -2.22);
  bodyGroup.add(exhaustL);

  const exhaustR = exhaustL.clone();
  exhaustR.position.x = 0.12;
  bodyGroup.add(exhaustR);

  // --- 2. THE ICONIC GT3 RS SWAN-NECK REAR WING (ALERÓN GIGANTE) ---
  const wingGroup = new THREE.Group();
  wingGroup.name = 'gt3_rs_swan_neck_wing';

  // Swan-Neck Curved Pylons (Mounting from top)
  const pylonCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0.6, -1.7),
    new THREE.Vector3(0, 1.45, -1.82),
    new THREE.Vector3(0, 1.42, -1.95)
  );
  const pylonTubeGeo = new THREE.TubeGeometry(pylonCurve, 16, 0.035, 8, false);
  
  const leftPylon = new THREE.Mesh(pylonTubeGeo, carbonFiberMaterial);
  leftPylon.position.x = -0.45;
  wingGroup.add(leftPylon);

  const rightPylon = leftPylon.clone();
  rightPylon.position.x = 0.45;
  wingGroup.add(rightPylon);

  // Massive Dual-Plane Carbon Aerofoil Blade
  const mainWingBladeGeo = new THREE.BoxGeometry(1.78, 0.045, 0.44);
  const mainWingBlade = new THREE.Mesh(mainWingBladeGeo, carbonFiberMaterial);
  mainWingBlade.position.set(0, 1.46, -1.95);
  mainWingBlade.rotation.x = -0.06;
  wingGroup.add(mainWingBlade);

  // DRS Secondary Flap
  const flapGeo = new THREE.BoxGeometry(1.72, 0.03, 0.18);
  const flapMesh = new THREE.Mesh(flapGeo, carbonFiberMaterial);
  flapMesh.position.set(0, 1.49, -2.12);
  flapMesh.rotation.x = -0.14;
  wingGroup.add(flapMesh);

  // Carbon Fiber Wing Endplates (Large side plates with GT3 RS style)
  const endplateGeo = new THREE.BoxGeometry(0.03, 0.32, 0.52);
  const leftEndplate = new THREE.Mesh(endplateGeo, carbonFiberMaterial);
  leftEndplate.position.set(-0.89, 1.45, -1.98);
  wingGroup.add(leftEndplate);

  const rightEndplate = leftEndplate.clone();
  rightEndplate.position.x = 0.89;
  wingGroup.add(rightEndplate);

  bodyGroup.add(wingGroup);

  // --- 3. LIGHTING (4-POINT MATRIX LEDS & FULL-WIDTH REAR LIGHT BAR) ---
  // Front 4-Point LED Headlights
  const createHeadlightGroup = (xSign: number) => {
    const hlGroup = new THREE.Group();
    const housingGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.08, 16);
    const housing = new THREE.Mesh(housingGeo, paintMaterial);
    housing.rotation.x = Math.PI / 2.8;
    hlGroup.add(housing);

    // 4 LED dots
    const ledGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const offsets = [
      [-0.04, 0.04],
      [0.04, 0.04],
      [-0.04, -0.04],
      [0.04, -0.04],
    ];
    offsets.forEach(([ox, oy]) => {
      const led = new THREE.Mesh(ledGeo, headlightMaterial);
      led.position.set(ox, oy, 0.05);
      hlGroup.add(led);
    });

    hlGroup.position.set(xSign * 0.68, 0.68, 1.88);
    return hlGroup;
  };

  bodyGroup.add(createHeadlightGroup(1));
  bodyGroup.add(createHeadlightGroup(-1));

  // Full-width continuous Rear LED Light Strip (Porsche Signature)
  const rearLightStripGeo = new THREE.BoxGeometry(1.68, 0.04, 0.04);
  const rearLightStrip = new THREE.Mesh(rearLightStripGeo, taillightMaterial);
  rearLightStrip.position.set(0, 0.72, -2.08);
  bodyGroup.add(rearLightStrip);

  // "PORSCHE" rear 3D emblem
  const badgeGeo = new THREE.BoxGeometry(0.6, 0.03, 0.02);
  const badge = new THREE.Mesh(badgeGeo, chromeMaterial);
  badge.position.set(0, 0.64, -2.1);
  bodyGroup.add(badge);

  // Side mirrors in Carbon Fiber
  const mirrorGeo = new THREE.BoxGeometry(0.22, 0.12, 0.14);
  const leftMirror = new THREE.Mesh(mirrorGeo, carbonFiberMaterial);
  leftMirror.position.set(-0.95, 0.82, 0.55);
  bodyGroup.add(leftMirror);

  const rightMirror = leftMirror.clone();
  rightMirror.position.x = 0.95;
  bodyGroup.add(rightMirror);

  // Interior: Titanium Roll Cage (Visible through back glass)
  const cageMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#df1111'), // Red roll cage
    metalness: 0.8,
    roughness: 0.2,
  });

  const cageBarGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8);
  const bar1 = new THREE.Mesh(cageBarGeo, cageMaterial);
  bar1.rotation.z = Math.PI / 4;
  bar1.position.set(0, 0.88, -0.4);
  bodyGroup.add(bar1);

  const bar2 = new THREE.Mesh(cageBarGeo, cageMaterial);
  bar2.rotation.z = -Math.PI / 4;
  bar2.position.set(0, 0.88, -0.4);
  bodyGroup.add(bar2);

  carGroup.add(bodyGroup);

  // --- 4. WHEELS (GT3 RS CENTER-LOCK WHEELS & CARBON CERAMIC BRAKES) ---
  const createWheel = (x: number, y: number, z: number, isRight: boolean) => {
    const wheelAssembly = new THREE.Group();
    wheelAssembly.name = `wheel_${x > 0 ? 'right' : 'left'}_${z > 0 ? 'front' : 'rear'}`;

    // Tire Rubber
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 28);
    const tire = new THREE.Mesh(tireGeo, tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelAssembly.add(tire);

    // Rim Outer Lip & Center-Lock
    const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.285, 24);
    const rim = new THREE.Mesh(rimGeo, wheelRimMaterial);
    rim.rotation.z = Math.PI / 2;
    wheelAssembly.add(rim);

    // 10-Spoke GT3 RS Design
    for (let i = 0; i < 5; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.04, 0.48, 0.05);
      const spoke = new THREE.Mesh(spokeGeo, wheelRimMaterial);
      spoke.position.set(isRight ? 0.08 : -0.08, 0, 0);
      spoke.rotation.x = (i * Math.PI) / 5;
      wheelAssembly.add(spoke);
    }

    // Center lock nut
    const nutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12);
    const nut = new THREE.Mesh(nutGeo, chromeMaterial);
    nut.rotation.z = Math.PI / 2;
    nut.position.set(isRight ? 0.14 : -0.14, 0, 0);
    wheelAssembly.add(nut);

    // Carbon Ceramic Brake Rotor
    const rotorGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20);
    const rotor = new THREE.Mesh(rotorGeo, brakeRotorMaterial);
    rotor.rotation.z = Math.PI / 2;
    rotor.position.set(isRight ? -0.04 : 0.04, 0, 0);
    wheelAssembly.add(rotor);

    // Yellow 6-Piston Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(0.06, 0.18, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMaterial);
    caliper.position.set(isRight ? -0.03 : 0.03, 0.12, 0.12);
    caliper.rotation.x = -Math.PI / 6;
    wheelAssembly.add(caliper);

    wheelAssembly.position.set(x, y, z);
    return wheelAssembly;
  };

  // Front Wheels
  carGroup.add(createWheel(0.92, 0.38, 1.38, true));
  carGroup.add(createWheel(-0.92, 0.38, 1.38, false));

  // Rear Wheels (Wider track for 911 GT3 RS)
  carGroup.add(createWheel(0.96, 0.38, -1.35, true));
  carGroup.add(createWheel(-0.96, 0.38, -1.35, false));

  // Underbody Shadow plane
  const shadowGeo = new THREE.PlaneGeometry(2.4, 4.8);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.7,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  carGroup.add(shadowPlane);

  return carGroup;
};
