const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 2.5);
camera.lookAt(0, 1.4, 0);

const renderer = new THREE.WebGLRenderer({ alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("scene").appendChild(renderer.domElement);

// LIGHT
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1,2,3);
scene.add(light);

// LOAD MODEL
const loader = new THREE.GLTFLoader();
let girl, mixer, idleAnim, talkAnim;

loader.load(
  "girl.glb",
  function (gltf) {
    girl = gltf.scene;
    scene.add(girl);

    mixer = new THREE.AnimationMixer(girl);

    if (gltf.animations.length > 0) {
      idleAnim = mixer.clipAction(gltf.animations[0]);
      idleAnim.play();
    }
  },
  undefined,
  function (error) {
    console.error("GLB LOAD ERROR:", error);
    alert("Model failed to load");
  }
);

function startTalking(){
  idleAnim.fadeOut(0.3);
  talkAnim.reset().fadeIn(0.3).play();
}

function stopTalking(){
  talkAnim.fadeOut(0.3);
  idleAnim.reset().fadeIn(0.3).play();
}

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

let faceMesh;

scene.traverse(obj => {
  if (obj.morphTargetDictionary) faceMesh = obj;
});

function lipSync(){
  if(!faceMesh) return;

  analyser.getByteFrequencyData(dataArray);
  let volume = dataArray.reduce((a,b)=>a+b)/dataArray.length;

  const open = Math.min(volume / 100, 1);
  const index = faceMesh.morphTargetDictionary["viseme_aa"];
  if(index !== undefined){
    faceMesh.morphTargetInfluences[index] = open;
  }
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

function startListening(){
  recognition.start();
}

recognition.onresult = e => {
  const text = e.results[0][0].transcript;
  document.getElementById("text").innerText = text;
  speak("Hello, nice to meet you");
};

function speak(text){
  startTalking();

  const utter = new SpeechSynthesisUtterance(text);
  utter.onend = stopTalking;
  speechSynthesis.speak(utter);
}

let outfit = false;

function changeOutfit(){
  outfit = !outfit;
  girl.scale.set(outfit ? 1.05 : 1, 1, 1);
}

function animate(){
  requestAnimationFrame(animate);
  if(mixer) mixer.update(0.016);
  lipSync();
  renderer.render(scene, camera);
  renderer.setClearColor(0x111111, 1);
}
animate();
