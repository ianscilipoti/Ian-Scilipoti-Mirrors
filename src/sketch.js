import p5, {Vector} from 'p5'
import {Segment, LightRay} from './lightRayTools.js'
//TODO:
//address inconsistencies with vectors and pairs of variables 
//add geometry class
//add ray renderer 
//better transparency for reflections

let sketch1 = new p5(( s ) => {
  //color information
  const wallColor = s.color(0, 0, 255);
  const bgColor = s.color(255, 255, 255);
  const reflectionVisibility = 0.1;
  const gemColor = s.color(255, 0, 0);
  const eyeColor = s.color(0, 0, 255);

  //scene information
  const gemPosition = s.createVector(30, 20);
  const gemSize = 20;

  const eyePosition = s.createVector(100, 140);
  const eyeSize = 20;

  const reflectionRange = 2;//number of reflection cells to render on either side of real box
  const centerCell = reflectionRange;//renaming this for readability. the reflection range number is also the index of the center cell

  const boxWidth = 200;
  const boxHeight = 150;
  const numCells = reflectionRange*2+1;//one cell at center than range on either side
  const boxOpeningSize = 50;
  const wallThickness = 3;

  //segments that make up the wall
  const reflectiveSegments = [
    new Segment(0, 0, boxWidth, 0),//top segment
    new Segment(boxWidth, 0, boxWidth, boxHeight),//right segment
    new Segment(0, 0, 0, boxHeight),//left segment
    
    new Segment(0, boxHeight, boxWidth/2 - boxOpeningSize/2, boxHeight), //lower segments
    new Segment(boxWidth/2 + boxOpeningSize/2, boxHeight, boxWidth, boxHeight),
  ];

  let matteSegments = [];//these will be populated in setup


  //interaction
  let ray;
  let rayRenderer;
  let rayContinuation;


  //a wrapper for a lightRay object. it allows for drawing and animating a light ray 
  class LightRayRenderer {
    constructor(rayToRender, color, renderContinuation) {
      this.visibleLength = 0;
      this.rayToRender = rayToRender;
      this.color = color;
      this.rayRevealSpeed = 0.4;
      this.rayLength = Vector.dist(rayToRender.getEndPoint(), rayToRender.origin);
      this.renderContinuation = renderContinuation;

      if (this.rayToRender.reflection !== null) {
        this.reflectionRenderer = new LightRayRenderer(this.rayToRender.reflection, color, false);
      }
      else {
        this.reflectionRenderer = null;
      }
    }

    draw = () => {
      if (this.visibleLength > 0) {
        //the coordinate of the end of the ray that's visible so far
        const visibleEndpoint = Vector.add(this.rayToRender.origin, p5.Vector.mult(this.rayToRender.direction, this.visibleLength));
        s.push();
        s.stroke(this.color);
        s.strokeWeight(2);

        s.line(this.rayToRender.origin.x, this.rayToRender.origin.y, visibleEndpoint.x, visibleEndpoint.y);
        s.pop();

        if(this.reflectionRenderer !== null) {
          this.reflectionRenderer.draw();
        }
      }
    }

    animate = () => {
      if (this.visibleLength < this.rayLength || this.renderContinuation) {
        this.visibleLength = this.visibleLength + s.deltaTime * this.rayRevealSpeed, this.rayLength;

        //if we aren't rendering a continuation, ensure the visible length does not exceed the length of the ray
        if (!this.renderContinuation) {
          this.visibleLength = Math.min(this.visibleLength, this.rayLength);
        }
      }
      //when the visible length exceeds the ray length, render the next ray
      if (this.reflectionRenderer !== null && this.visibleLength >= this.rayLength) {
        this.reflectionRenderer.animate();
      }
    }
  }

  //get mouse direction from the REAL gem position (center grid cell)
  let getMousePositionAtCell = (x, y) => {
    return s.createVector(s.mouseX - boxWidth * x, s.mouseY - boxHeight * y);
  }

  let resetLightRay = (direction) => {
    ray = new LightRay(eyePosition, direction);
    ray.propagate(reflectiveSegments, 0);//start reflecting this ray off of the wall segments
    rayRenderer = new LightRayRenderer(ray, eyeColor, true);
  }

  //apply the appropriate transformation to render in the correct offset / flipping for a particular cell
  //NOTE!! apply pop() after grid cell rendering is complete 
  //x: x coord of the cell, assume x=0 is not flipped
  let pushGridCellTransformation = (x, y) => {
    //---------not ideal.. recalculating this value here
    let centeredX = x - reflectionRange;//make the non-reflection cell indexed at x=0, y=0
    let centeredY = y - reflectionRange;

    //move coordinate system to cell position and adjust scale to flip 
    s.push();
    let xScale = (1 - (centeredX & 1)) * 2 - 1;
    let yScale = (1 - (centeredY & 1)) * 2 - 1;   

    s.translate(x * boxWidth + boxWidth / 2, y * boxHeight + boxHeight / 2);
    s.scale(xScale, yScale);
    s.translate(-boxWidth/2, -boxHeight/2);
    //at this point the coordinate system for the center cell is as expected and 0,0 is at the top left corner
  }

  //reset ray when mouse is clicked
  s.mouseClicked = () => {
    resetLightRay(getMousePositionAtCell(centerCell, centerCell).sub(eyePosition));
  }

  s.setup = () => {
    const canvasWidth = numCells * boxWidth;
    const canvasHeight = numCells * boxHeight;
    s.createCanvas(canvasWidth, canvasHeight);

    resetLightRay(s.createVector(100, 200));

    //add segments forming a regular polygon to stop ray at gem
    const collisionPolygonSides = 8;
    const collisionPolygonRadius = gemSize / 2;
    for(let i = 0; i < collisionPolygonSides; i ++) {
      const thisAngle = (i / parseFloat(cllisionPolygonSides)) * Math.PI * 2;
      const nextAngle = ((i+1) / parseFloat(cllisionPolygonSides)) * Math.PI * 2;

      matteSegments.push(new Segment(
        Math.cos(thisAngle) * collisionPolygonRadius, 
        Math.sin(thisAngle) * collisionPolygonRadius, 
        Math.cos(nextAngle) * collisionPolygonRadius, 
        math.sin(nextAngle) * collisionPolygonRadius));
    } 
  };

  s.draw = () => {
    s.background(255);


    //draw grid of reflections
    s.noStroke();
    for (let x = 0; x < numCells; x ++)
    {
      for (let y = 0; y < numCells; y ++)
      {
        let centeredX = x - reflectionRange;//make the center cell with the "real" box be at x=0, y=0
        let centeredY = y - reflectionRange;

        pushGridCellTransformation(x, y);
          const isRealBox = centeredX == 0 && centeredY == 0; //is this the real box? as opposed to the reflections
          //render box walls
          s.push();
          s.strokeWeight(3);
          s.stroke(wallColor);
          for (let wallSeg of reflectiveSegments) {
            s.line(wallSeg.x1, wallSeg.y1, wallSeg.x2, wallSeg.y2)
          }
          s.pop();
          
          //draw gem
          s.push();
          s.fill(gemColor);
          s.ellipse(gemPosition.x, gemPosition.y, gemSize, gemSize)
          s.pop();   
          
          //fill white box over reflected cells to make them appear transparent. 
          //definitely wonky.. But p5 doesn't have a good way of layering transparency.  
          if (!isRealBox)
          {
            s.push();
            s.noStroke();
            s.fill(255, 255, 255, 255 - reflectionVisibility * 255);
            s.rect(0, 0, boxWidth, boxHeight);
            s.pop();
          }
        s.pop();
      }
    }

    //draw stuff that only gets drawn once in the center
    pushGridCellTransformation(centerCell, centerCell);
      // draw ray
      rayRenderer.animate();
      rayRenderer.draw();

      //draw eye
      s.push();
      s.fill(eyeColor);
      s.ellipse(eyePosition.x, eyePosition.y, eyeSize, eyeSize)
      s.pop();   

    s.pop();

  };
}, 'sketch1');

