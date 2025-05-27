/*
	Morph #WCCChallenge 250318 
	https://openprocessing.org/sketch/2581806
	#generativeart #creativecoding #p5js

  Dear Raph and creative coding community,
	
	animation of particles forming different shapes: 
	circles, rectangles and triangles 
	varying form, position and size
	
	Join the Birb's Nest Discord for friendly creative coding community
	and future challenges and contributions: https://discord.gg/S8c7qcjw2b
	WCCC-Contributions: https://openprocessing.org/curation/78544
*/

let morphObjs = [],
  rot;

function setup() {
  createCanvas(windowWidth, windowHeight);
  describe(
    "morphing of particles forming different shapes: circles, rectangles and triangles varying form, position and size"
  );
  frameRate(60);
  pixelDensity(1);
  // frameCount = ~~random(1111,111111);

  morphObjs = [];
  for (let i = 0; i < 3; i++) {
    morphObjs.push(
      new Morph(
        ~~random(min(width, height), max(width, height)), // NUM
        ~~random(1200, 240), // ITER
        i % 3 // type
      )
    );
  }

  strokeWeight(3);
  background(32);
}

function draw() {
  background(2, 2, 12, 96);

  for (const morphObj of morphObjs) {
    morphObj.update();
    morphObj.show();
  }
}
