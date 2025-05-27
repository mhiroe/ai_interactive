////////////////////////////////////////////////
class Element {
  constructor(props = {}) {
    this.id = props.id ?? 0;
    this.isDisplay = props.isDisplay ?? true;
    this.originX = props.originX ?? 0;
    this.originY = props.originY ?? 0;
    this.originZ = props.originZ ?? 0;
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.z = props.z ?? 0;
    if (props.baseSize !== undefined) {
      this.baseSize = props.baseSize;
      this.w = this.baseSize;
      this.h = this.baseSize;
      this.d = this.baseSize;
      this.radius = this.baseSize;
    } else {
      this.w = props.w ?? 100;
      this.h = props.h ?? 100;
      this.d = props.d ?? 100;
      this.radius = props.radius ?? 100;
    }
    this.detailX = props.detailX ?? 1;
    this.detailY = props.detailY ?? 1;
    this.detailZ = props.detailZ ?? 1;
    this.scaleX = props.scaleX ?? 1;
    this.scaleY = props.scaleY ?? 1;
    this.scaleZ = props.scaleZ ?? 1;
    this.angleX = props.angleX ?? 0;
    this.angleY = props.angleY ?? 0;
    this.angleZ = props.angleZ ?? 0;
    this.tubeRadius = props.tubeRadius ?? 10;
    this.angleXAccel = props.angleXAccel ?? 0.01;
    this.angleYAccel = props.angleYAccel ?? 0.01;
    this.angleZAccel = props.angleZAccel ?? 0.01;

    this.colors = generateColorScheme(palette.colors[randomInt(0, palette.colors.length - 1)], 'monochromatic');
    this.colors = shuffleArray(this.colors);
    this.gradientShader = new GradientShader(vertShader, flexibleFragShader);
    this.gradientShader.setColors(this.colors);
    this.gradientShader.setGradientType(0);
    this.gradientShader.setAnimationType(5);
    this.gradientShader.setSpeed(random(-2, 2));

    this.amplitudeSize = 50;
    this.phaseShiftX = random(-PI, PI);
    this.phaseShiftY = random(-PI, PI);
    this.phaseShiftZ = random(-PI, PI);
    this.targetW = random(500, 1000);
    this.targetH = random(500, 1000);
    this.targetD = random(500, 1000);
  }

  run = () => {
    if (!this.isDisplay) return;
    this.gradientShader.apply();
    push();
    translate(this.originX, this.originY, this.originZ);
    scale(this.scaleX, this.scaleY, this.scaleZ);
    rotateX(this.angleX);
    rotateY(this.angleY);
    rotateZ(this.angleZ);
    this.w = this.amplitudeSize * cos(frameCount * 0.05 + this.phaseShiftX) + this.targetW;
    this.h = this.amplitudeSize * cos(frameCount * 0.07 + this.phaseShiftY) + this.targetH;
    this.d = this.amplitudeSize * cos(frameCount * 0.03 + this.phaseShiftZ) + this.targetD;
    ellipsoid(this.w, this.h, this.d, 5, 2);
    pop();
    resetShader();
  }
}

////////////////////////////////////////////////
class Motif {
  constructor(props = {}) {
    this.id = props.id ?? 0;
    this.isDisplay = props.isDisplay ?? true;
    this.originX = props.originX ?? 0;
    this.originY = props.originY ?? 0;
    this.originZ = props.originZ ?? 0;
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.z = props.z ?? 0;
    if (props.baseSize !== undefined) {
      this.baseSize = props.baseSize;
      this.w = this.baseSize;
      this.h = this.baseSize;
      this.d = this.baseSize;
      this.radius = this.baseSize;
    } else {
      this.w = props.w ?? 100;
      this.h = props.h ?? 100;
      this.d = props.d ?? 100;
      this.radius = props.radius ?? 100;
    }
    this.detailX = props.detailX ?? 1;
    this.detailY = props.detailY ?? 1;
    this.detailZ = props.detailZ ?? 1;
    this.scaleX = props.scaleX ?? 1;
    this.scaleY = props.scaleY ?? 1;
    this.scaleZ = props.scaleZ ?? 1;
    this.angleX = props.angleX ?? 0;
    this.angleY = props.angleY ?? 0;
    this.angleZ = props.angleZ ?? 0;
    this.tubeRadius = props.tubeRadius ?? 10;
    this.angleXAccel = props.angleXAccel ?? random(-0.01, 0.01);
    this.angleYAccel = props.angleYAccel ?? random(-0.01, 0.01);
    this.angleZAccel = props.angleZAccel ?? random(-0.01, 0.01);
    this.elements = [];
    this.repeatX = props.repeatX || 8;
    this.repeatY = props.repeatY || 8;
    this.repeatZ = props.repeatZ || 8;
    for (var k = 0; k < this.repeatZ; k++) {
      for (var j = 0; j < this.repeatY; j++) {
        for (var i = 0; i < this.repeatX; i++) {
          const element = new Element({})
          this.elements.push(element)
        }
      }
    }
  }

  run = () => {
    if (!this.isDisplay) return;
    push();
    translate(this.originX, this.originY, this.originZ);
    scale(this.scaleX, this.scaleY, this.scaleZ);
    this.angleX += this.angleXAccel;
    this.angleY += this.angleYAccel;
    this.angleZ += this.angleZAccel;
    rotateX(this.angleX);
    rotateY(this.angleY);
    rotateZ(this.angleZ);
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      element.run();
    }
    pop();
  }
}
