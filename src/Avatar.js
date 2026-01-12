import * as THREE from "three";

export class Avatar {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    this.initMaterials();
    this.buildBody();
    this.state = "idle"; // idle, wave, nod
    this.time = 0;
  }

  initMaterials() {
    this.skinMaterial = new THREE.MeshToonMaterial({ color: 0xffdbac }); // Light skin tone
    this.eyeMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });
    this.pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xaa3333 });
    this.hairMaterial = new THREE.MeshToonMaterial({ color: 0x3e2723 });
  }

  buildBody() {
    // Head
    const headGeo = new THREE.SphereGeometry(1, 32, 32);
    this.head = new THREE.Mesh(headGeo, this.skinMaterial);
    this.mesh.add(this.head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.2, 32, 32);

    this.leftEye = new THREE.Group();
    const leftEyeBall = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.leftEye.add(leftEyeBall);

    // Pupil
    const pupilGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeo, this.pupilMaterial);
    leftPupil.position.z = 0.15;
    this.leftEye.add(leftPupil);

    this.leftEye.position.set(-0.35, 0.1, 0.85);
    this.head.add(this.leftEye);

    this.rightEye = this.leftEye.clone();
    this.rightEye.position.set(0.35, 0.1, 0.85);
    this.head.add(this.rightEye);

    // Mouth (Torus half visible?)
    // Let's use a scaled sphere for now for a smile
    const mouthGeo = new THREE.TorusGeometry(0.2, 0.05, 16, 32, Math.PI);
    this.mouth = new THREE.Mesh(mouthGeo, this.mouthMaterial);
    this.mouth.rotation.x = Math.PI; // Smile down
    this.mouth.position.set(0, -0.3, 0.9);
    this.head.add(this.mouth);

    // Hair (Simple hemisphere cap)
    const hairGeo = new THREE.SphereGeometry(
      1.05,
      32,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    this.hair = new THREE.Mesh(hairGeo, this.hairMaterial);
    this.hair.rotation.x = -Math.PI / 2; // Sit on top
    this.hair.position.y = 0.1;
    this.head.add(this.hair);

    // Hands (Simple spheres)
    const handGeo = new THREE.SphereGeometry(0.25, 32, 32);
    this.leftHand = new THREE.Mesh(handGeo, this.skinMaterial);
    this.leftHand.position.set(-1.5, -1, 0);
    this.mesh.add(this.leftHand);

    this.rightHand = new THREE.Mesh(handGeo, this.skinMaterial);
    this.rightHand.position.set(1.5, -1, 0);
    this.mesh.add(this.rightHand);
  }

  update(dt) {
    this.time += dt;

    // Idle animation: Head float
    this.head.position.y = Math.sin(this.time * 2) * 0.05;

    // Blink
    if (this.time % 4 > 3.8) {
      this.leftEye.scale.y = 0.1;
      this.rightEye.scale.y = 0.1;
    } else {
      this.leftEye.scale.y = 1;
      this.rightEye.scale.y = 1;
    }

    // State animations
    if (this.state === "wave") {
      this.animateWave(this.time);
    } else if (this.state === "nod") {
      this.animateNod(this.time);
    } else if (this.state === "speaking") {
      this.animateSpeaking(this.time);
    } else {
      // Return hands to neutral
      this.rightHand.position.lerp(new THREE.Vector3(1.5, -1, 0), dt * 5);
      this.head.rotation.x = THREE.MathUtils.lerp(
        this.head.rotation.x,
        0,
        dt * 5
      );
      this.mouth.scale.y = THREE.MathUtils.lerp(this.mouth.scale.y, 1, dt * 5);
    }
  }

  animateWave(t) {
    // Wave right hand
    const waveAngle = Math.sin(t * 10) * 0.5;
    this.rightHand.position.set(
      1.5 + waveAngle * 0.2,
      0 + Math.abs(waveAngle) * 0.2,
      0.5
    );
  }

  animateNod(t) {
    // Nod head
    const nodAngle = Math.sin(t * 10) * 0.2;
    this.head.rotation.x = nodAngle;
  }

  animateSpeaking(t) {
    // Simple mouth flap
    const mouthScale = 1 + Math.sin(t * 15) * 0.5;
    this.mouth.scale.y = mouthScale;
  }

  setAnimation(animName) {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }

    this.state = animName;

    // Auto-reset for short animations like wave/nod
    if (animName === "wave" || animName === "nod") {
      this.animationTimer = setTimeout(() => {
        this.state = "idle";
        this.animationTimer = null;
      }, 3000);
    }
  }
}
