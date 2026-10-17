// ========================================
// EXTREME RACING - 3D CAR GAME
// Built with Three.js
// ========================================

const container = document.getElementById("game-container");

const speedElement = document.getElementById("speed");
const distanceElement = document.getElementById("distance");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

// ----------------------------------------
// GAME SETTINGS
// ----------------------------------------

const ROAD_WIDTH = 14;
const ROAD_LENGTH = 500;
const MAX_SPEED = 65;

let speed = 0;
let distance = 0;
let steering = 0;

let running = false;
let gameOver = false;

let lastTime = 0;

const keys = {};
const touch = {
    left: false,
    right: false,
    gas: false,
    brake: false
};

// ----------------------------------------
// THREE.JS SCENE
// ----------------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    65,
    260
);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    700
);

camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);

// ----------------------------------------
// LIGHTING
// ----------------------------------------

const hemisphereLight = new THREE.HemisphereLight(
    0xffffff,
    0x53643b,
    2.1
);

scene.add(hemisphereLight);

const sunLight = new THREE.DirectionalLight(
    0xffffff,
    3
);

sunLight.position.set(-30, 55, 25);

sunLight.castShadow = true;

sunLight.shadow.mapSize.set(1024, 1024);

sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;

scene.add(sunLight);

// ----------------------------------------
// MATERIALS
// ----------------------------------------

function material(color, roughness = 0.8, metalness = 0) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness
    });
}

const grassMaterial = material(0x478b35);
const roadMaterial = material(0x303238, 0.95);
const lineMaterial = material(0xffffff);
const dirtMaterial = material(0x92724c);

const redMaterial = material(0xe71925, 0.28, 0.25);
const blackMaterial = material(0x151922, 0.35);
const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x16394b,
    roughness: 0.18,
    metalness: 0.2,
    transparent: true,
    opacity: 0.86
});

const tireMaterial = material(0x101010);
const rimMaterial = material(0xb9c1c9, 0.3, 0.8);
const whiteMaterial = material(0xffffff, 0.25);

const treeTrunkMaterial = material(0x684023);
const leafMaterial = material(0x24652d);
const leafLightMaterial = material(0x39883c);

const mountainMaterial = material(0x697b83);

// ----------------------------------------
// BASIC OBJECT HELPER
// ----------------------------------------

function addBox(parent, width, height, depth, mat, x, y, z) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        mat
    );

    mesh.position.set(x, y, z);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
}

// ----------------------------------------
// GROUND
// ----------------------------------------

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    grassMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
ground.receiveShadow = true;

scene.add(ground);

// ----------------------------------------
// ROAD
// ----------------------------------------

const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
    roadMaterial
);

road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -180);

road.receiveShadow = true;

scene.add(road);

// Road shoulders

for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, ROAD_LENGTH),
        dirtMaterial
    );

    shoulder.rotation.x = -Math.PI / 2;

    shoulder.position.set(
        side * (ROAD_WIDTH / 2 + 0.6),
        -0.015,
        -180
    );

    scene.add(shoulder);
}

// ----------------------------------------
// ROAD EDGE LINES
// ----------------------------------------

for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, ROAD_LENGTH),
        whiteMaterial
    );

    edge.rotation.x = -Math.PI / 2;

    edge.position.set(
        side * (ROAD_WIDTH / 2 - 0.35),
        0.025,
        -180
    );

    scene.add(edge);
}

// ----------------------------------------
// ROAD DASHED LINES
// ----------------------------------------

const roadLines = [];

for (const x of [-ROAD_WIDTH / 6, ROAD_WIDTH / 6]) {
    for (let i = 0; i < 36; i++) {
        const line = new THREE.Mesh(
            new THREE.PlaneGeometry(0.13, 3.5),
            lineMaterial
        );

        line.rotation.x = -Math.PI / 2;

        line.position.set(
            x,
            0.035,
            -i * 10
        );

        scene.add(line);

        roadLines.push(line);
    }
}

// ----------------------------------------
// MOUNTAINS
// ----------------------------------------

function createMountain(x, z, height, radius) {
    const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 5),
        mountainMaterial
    );

    mountain.position.set(
        x,
        height / 2 - 0.1,
        z
    );

    mountain.rotation.y = Math.random() * Math.PI;

    scene.add(mountain);
}

for (let i = 0; i < 16; i++) {
    createMountain(
        (Math.random() < 0.5 ? -1 : 1) *
            (30 + Math.random() * 80),
        -70 - Math.random() * 240,
        12 + Math.random() * 32,
        12 + Math.random() * 25
    );
}

// ----------------------------------------
// TREES
// ----------------------------------------

const trees = [];

function createTree(x, z, scale) {
    const tree = new THREE.Group();

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.38, 2.8, 7),
        treeTrunkMaterial
    );

    trunk.position.y = 1.4;
    trunk.castShadow = true;

    tree.add(trunk);

    const lowerLeaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.8, 3.2, 8),
        leafMaterial
    );

    lowerLeaves.position.y = 3.2;
    lowerLeaves.castShadow = true;

    tree.add(lowerLeaves);

    const upperLeaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.25, 2.7, 8),
        leafLightMaterial
    );

    upperLeaves.position.y = 5;
    upperLeaves.castShadow = true;

    tree.add(upperLeaves);

    scene.add(tree);

    trees.push(tree);
}

// A small number of large trees

for (let i = 0; i < 22; i++) {
    const side = i % 2 === 0 ? -1 : 1;

    createTree(
        side * (10 + Math.random() * 8),
        -i * 15 - 10,
        1.4 + Math.random() * 0.8
    );
}

// ----------------------------------------
// CAR MODEL
// ----------------------------------------

function createCar(colorMaterial, detailed = false) {
    const car = new THREE.Group();

    // Main body
    addBox(
        car, 2.05, 0.65, 4.1,
        colorMaterial, 0, 0.85, 0
    );

    // Front hood
    addBox(
        car, 1.9, 0.24, 1.15,
        colorMaterial, 0, 1.18, -1.35
    );

    // Cabin
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.85, 1.9),
        colorMaterial
    );

    cabin.position.set(0, 1.45, 0.25);
    cabin.castShadow = true;

    car.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(1.34, 0.58, 0.08),
        glassMaterial
    );

    windshield.position.set(0, 1.49, -0.65);
    windshield.rotation.x = -0.18;

    car.add(windshield);

    // Rear window
    const rearWindow = new THREE.Mesh(
        new THREE.BoxGeometry(1.32, 0.55, 0.08),
        glassMaterial
    );

    rearWindow.position.set(0, 1.49, 1.16);
    rearWindow.rotation.x = 0.18;

    car.add(rearWindow);

    // Front headlights
    for (const x of [-0.72, 0.72]) {
        const light = addBox(
            car, 0.42, 0.16, 0.09,
            whiteMaterial, x, 1.0, -2.07
        );
    }

    // Rear lights
    const brakeLights = [];

    for (const x of [-0.72, 0.72]) {
        const light = addBox(
            car, 0.42, 0.17, 0.09,
            material(0xff1111), x, 1.05, 2.07
        );

        brakeLights.push(light);
    }

    // Bumpers
    addBox(
        car, 1.95, 0.2, 0.2,
        blackMaterial, 0, 0.58, -2.05
    );

    addBox(
        car, 1.95, 0.2, 0.2,
        blackMaterial, 0, 0.58, 2.05
    );

    // Wheels
    const wheels = [];

    for (const x of [-1.02, 1.02]) {
        for (const z of [-1.32, 1.32]) {
            const wheel = new THREE.Group();

            wheel.position.set(x, 0.48, z);

            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.43, 0.43, 0.28, 16
                ),
                tireMaterial
            );

            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;

            wheel.add(tire);

            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.23, 0.23, 0.30, 12
                ),
                rimMaterial
            );

            rim.rotation.z = Math.PI / 2;

            wheel.add(rim);

            car.add(wheel);

            wheels.push(wheel);
        }
    }

    car.userData.wheels = wheels;
    car.userData.brakeLights = brakeLights;

    return car;
}

// Player car

const player = createCar(redMaterial, true);

player.position.set(0, 0, 5);

scene.add(player);

// ----------------------------------------
// TRAFFIC CARS
// ----------------------------------------

const traffic = [];

const trafficMaterials = [
    material(0x1565c0, 0.3, 0.2),
    material(0xf5f5f5, 0.3, 0.1),
    material(0xffb300, 0.3, 0.1),
    material(0x292929, 0.3, 0.2)
];

function spawnTraffic(z) {
    const lanes = [-4, 0, 4];

    const car = createCar(
        trafficMaterials[
            Math.floor(Math.random() * trafficMaterials.length)
        ]
    );

    car.position.set(
        lanes[Math.floor(Math.random() * lanes.length)],
        0,
        z
    );

    car.scale.setScalar(0.9);

    scene.add(car);

    traffic.push(car);
}

for (let i = 0; i < 5; i++) {
    spawnTraffic(-55 - i * 55);
}

// ----------------------------------------
// INPUT
// ----------------------------------------

window.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;

    if (
        ["arrowleft", "arrowright", "arrowup", "arrowdown", " "]
        .includes(event.key.toLowerCase())
    ) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

function bindButton(id, property) {
    const button = document.getElementById(id);

    const press = event => {
        event.preventDefault();
        touch[property] = true;
    };

    const release = event => {
        event.preventDefault();
        touch[property] = false;
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
}

bindButton("left-button", "left");
bindButton("right-button", "right");
bindButton("gas-button", "gas");
bindButton("brake-button", "brake");

// ----------------------------------------
// START / RESTART
// ----------------------------------------

function resetGame() {
    speed = 0;
    distance = 0;
    steering = 0;

    player.position.set(0, 0, 5);
    player.rotation.set(0, 0, 0);

    traffic.forEach((car, i) => {
        car.position.x = [-4, 0, 4][i % 3];
        car.position.z = -55 - i * 55;
    });

    roadLines.forEach((line, i) => {
        const row = Math.floor(i / 2);
        line.position.z = -row * 10;
    });

    trees.forEach((tree, i) => {
        const side = i % 2 === 0 ? -1 : 1;

        tree.position.x =
            side * (10 + Math.random() * 8);

        tree.position.z = -i * 15 - 10;
    });

    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

    Object.keys(touch).forEach(key => {
        touch[key] = false;
    });

    gameOver = false;
    running = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    lastTime = performance.now();
}

function endGame() {
    if (gameOver) return;

    gameOver = true;
    running = false;

    gameOverScreen.classList.remove("hidden");
}

startButton.addEventListener("click", resetGame);
restartButton.addEventListener("click", resetGame);

// ----------------------------------------
// CAMERA
// ----------------------------------------

const cameraTarget = new THREE.Vector3();

function updateCamera(delta) {
    const desiredPosition = new THREE.Vector3(
        player.position.x * 0.55,
        4.5 + speed * 0.008,
        player.position.z + 9
    );

    camera.position.lerp(
        desiredPosition,
        Math.min(1, delta * 3.5)
    );

    cameraTarget.set(
        player.position.x * 0.35,
        1.0,
        player.position.z - 8
    );

    camera.lookAt(cameraTarget);
}

// ----------------------------------------
// COLLISION DETECTION
// ----------------------------------------

function checkCollisions() {
    for (const car of traffic) {
        const dx = Math.abs(player.position.x - car.position.x);
        const dz = Math.abs(player.position.z - car.position.z);

        if (dx < 1.8 && dz < 3.1) {
            endGame();
            return;
        }
    }
}

// ----------------------------------------
// MAIN UPDATE
// ----------------------------------------

function updateGame(delta) {
    if (!running || gameOver) return;

    const gas =
        keys["w"] ||
        keys["arrowup"] ||
        touch.gas;

    const brake =
        keys["s"] ||
        keys["arrowdown"] ||
        touch.brake;

    const left =
        keys["a"] ||
        keys["arrowleft"] ||
        touch.left;

    const right =
        keys["d"] ||
        keys["arrowright"] ||
        touch.right;

    // Acceleration and braking

    if (gas) {
        speed += 28 * delta;
    } else {
        speed -= 7 * delta;
    }

    if (brake) {
        speed -= 48 * delta;
    }

    speed = THREE.MathUtils.clamp(
        speed,
        0,
        MAX_SPEED
    );

    // Steering

    let steerInput = 0;

    if (left) steerInput += 1;
    if (right) steerInput -= 1;

    steering = THREE.MathUtils.damp(
        steering,
        steerInput,
        7,
        delta
    );

    const speedFactor = 0.35 + speed / MAX_SPEED;

    player.position.x +=
        steering * 10 * speedFactor * delta;

    // Road boundaries

    const roadLimit = ROAD_WIDTH / 2 - 1.4;

    if (player.position.x > roadLimit) {
        player.position.x = roadLimit;
        speed *= 0.98;
    }

    if (player.position.x < -roadLimit) {
        player.position.x = -roadLimit;
        speed *= 0.98;
    }

    // Car body tilt while steering

    player.rotation.z = THREE.MathUtils.damp(
        player.rotation.z,
        steering * 0.10,
        5,
        delta
    );

    player.rotation.y = THREE.MathUtils.damp(
        player.rotation.y,
        steering * 0.07,
        5,
        delta
    );

    // Wheel rotation

    player.userData.wheels.forEach(wheel => {
        wheel.rotation.x -= speed * delta * 0.15;
    });

    // Brake lights

    player.userData.brakeLights.forEach(light => {
        light.material.color.set(
            brake ? 0xff3333 : 0xff1111
        );
    });

    // Move road markings toward the player

    for (const line of roadLines) {
        line.position.z += speed * delta * 1.8;

        if (line.position.z > 15) {
            line.position.z -= 180;
        }
    }

    // Move trees toward the player

    for (const tree of trees) {
        tree.position.z += speed * delta * 1.8;

        if (tree.position.z > 20) {
            tree.position.z -= 330;

            const side = Math.random() < 0.5 ? -1 : 1;

            tree.position.x =
                side * (10 + Math.random() * 8);
        }
    }

    // Traffic movement

    for (const car of traffic) {
        car.position.z += speed * delta * 1.8;

        car.userData.wheels.forEach(wheel => {
            wheel.rotation.x -= speed * delta * 0.15;
        });

        if (car.position.z > 18) {
            car.position.z -= 300;

            const lanes = [-4, 0, 4];

            car.position.x =
                lanes[Math.floor(Math.random() * lanes.length)];
        }
    }

    // Distance

    distance += speed * delta * 0.45;

    speedElement.textContent =
        Math.round(speed * 3.6);

    distanceElement.textContent =
        Math.floor(distance);

    checkCollisions();
}

// ----------------------------------------
// RENDER LOOP
// ----------------------------------------

function animate(time) {
    requestAnimationFrame(animate);

    const delta = Math.min(
        (time - lastTime) / 1000 || 0,
        0.05
    );

    lastTime = time;

    if (running) {
        updateGame(delta);
    }

    updateCamera(delta);

    renderer.render(scene, camera);
}

lastTime = performance.now();

animate(lastTime);

// ----------------------------------------
// RESIZE
// ----------------------------------------

window.addEventListener("resize", () => {
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );
});
