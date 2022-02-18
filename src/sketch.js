import p5, {Vector} from 'p5'
import {Segment, LightRay, extremelyLargeConst} from './lightRayTools.js'
import {checkIntersection} from 'line-intersect';

let mirrorsSketch = new p5(( s ) => {
  //color information
  const reflectiveWallColor = s.color(0, 0, 255);
  const matteWallColor = s.color(0, 125, 125);
  const bgColor = s.color(255, 255, 255);
  const reflectionVisibility = 0.1;
  const gemColor = s.color(255, 0, 0);
  const eyeColor = s.color(0, 128, 200);

  //misc
  const mirrorID = "mirror";
  const wallID = "mirror";
  const gemID = "gem";
  const eyeID = "eye";

  //scene information
  const gemPosition = s.createVector(30, 20);
  const gemSize = 15;

  const eyePosition = s.createVector(75, 100);
  const eyeSize = 15;

  const reflectionRange = 5;//number of reflection cells to render on either side of real box
  const centerCell = reflectionRange;//renaming this for readability. the reflection range number is also the index of the center cell

  const boxWidth = 150;
  const boxHeight = 100;
  const numCells = reflectionRange*2+1;//one cell at center than range on either side
  const boxOpeningSize = 25;

  let verticalFlipArrowLocations = [];//locations of arrows showing a flip
  let horizontalFlipArrowLocations = [];//locations of arrows showing a flip

  

  //segments that make up the box
  const boxSegments = [
    new Segment(0, 0, boxWidth, 0, true, mirrorID),//top segment
    new Segment(boxWidth, 0, boxWidth, boxHeight, true, mirrorID),//right segment
    new Segment(0, 0, 0, boxHeight, true, mirrorID),//left segment

    new Segment(20, 50, 40, 50, false, wallID), //matte wall
    
    new Segment(0, boxHeight, boxWidth/2 - boxOpeningSize/2, boxHeight, true, mirrorID), //lower segments
    new Segment(boxWidth/2 + boxOpeningSize/2, boxHeight, boxWidth, boxHeight, true, mirrorID),
  ];

  let barrierSegments = [];//these will be populated in setup. These segments are used for collision with the gem
  let allSegments = [];//these will be populated in setup


  //interaction
  let ray;
  let rayRenderer;
  let rayContinuation;
  let rayHitGem;

  let traversedGridCells = {}; 
  let gridCellVisibility = [];


  //a wrapper for a lightRay object. it allows for drawing and animating a light ray 
  class LightRayRenderer {
    constructor(ray, renderContinuation) {
      this.revealedLength = 0;
      this.ray = ray;
      this.rayRevealSpeed = 0.4;
      this.rayLength = this.ray.getLength();//cache these so they don't need to be calculated every frame
      this.totalRayLength = this.ray.getTotalLength();
      this.renderContinuation = renderContinuation;
      this.animationFinished = false;

      if (this.ray.reflection !== null) {
        this.reflectionRenderer = new LightRayRenderer(this.ray.reflection, false);
      }
      else {
        this.reflectionRenderer = null;
      }
    }

    draw = (color) => {
      //only run draw code if the revealed length is > 0
      if (this.revealedLength > 0) {
        //the coordinate of the end of the ray that's visible so far
        const visibleEndpoint = Vector.add(this.ray.origin, Vector.mult(this.ray.direction, Math.min(this.revealedLength, this.rayLength)));
        const continuationEndpoint = Vector.add(this.ray.origin, Vector.mult(this.ray.direction, this.revealedLength));
        s.push();
        s.stroke(color);
        s.strokeWeight(2);

        s.line(this.ray.origin.x, this.ray.origin.y, visibleEndpoint.x, visibleEndpoint.y);
        if (this.revealedLength > this.rayLength) {
          s.drawingContext.setLineDash([2, 5]);
          s.line(visibleEndpoint.x, visibleEndpoint.y, continuationEndpoint.x, continuationEndpoint.y);
          s.drawingContext.setLineDash([]);
        }
        s.pop();

        if(this.reflectionRenderer !== null) {
          this.reflectionRenderer.draw(color);
        }
      }
    }

    animate = (animationFinishedCallback) => {
      const lengthToRender = this.renderContinuation ? this.totalRayLength : this.rayLength;
      if (this.revealedLength < lengthToRender) {
        this.revealedLength = Math.min(this.revealedLength + s.deltaTime * this.rayRevealSpeed, lengthToRender);
      }
      //when the visible length exceeds the ray length, render the next ray
      if (this.ray.reflection !== null && this.revealedLength >= this.rayLength) {
        this.reflectionRenderer.animate(animationFinishedCallback);
      }
      else if (!this.animationFinished && animationFinishedCallback){
        animationFinishedCallback();
        this.animationFinished = true;
        //---------------------------------------------- need to cascade the finished animation flag back
      }
    }
  }

  //get mouse direction from the REAL gem position (center grid cell)
  let getMousePositionAtCell = (x, y) => {
    return s.createVector(s.mouseX - boxWidth * x, s.mouseY - boxHeight * y);
  }

  //used to key a dictionary of cells the ray passes through
  let getCellID = (x, y) => {
    return String(x) + String(y);
  }

  let resetLightRay = (direction) => {
    ray = new LightRay(eyePosition, direction);
    ray.propagate(allSegments, 0, allSegments.filter(seg => seg.id === eyeID));//start reflecting / colliding this ray off of the wall segments
    rayRenderer = new LightRayRenderer(ray, !ray.isTermination);

    rayHitGem = ray.getFinalSegmentID() === gemID;

    const rayContinuationEndpoint = Vector.add(ray.origin, Vector.mult(ray.direction, ray.getTotalLength()));

    const rayPixelOriginX = ray.origin.x + centerCell * boxWidth;
    const rayPixelOriginY = ray.origin.y + centerCell * boxHeight;
    const rayPixelEndpointX = rayContinuationEndpoint.x + centerCell * boxWidth;
    const rayPixelEndpointY = rayContinuationEndpoint.y + centerCell * boxHeight;

    traversedGridCells = {};
    horizontalFlipArrowLocations = [];
    verticalFlipArrowLocations = [];

    //Kinda ugly. Would prefer to use a variation of Bresenham's rasterization algorithm here but couldn't find something appropriate 
    //instead calculate intersections through horizontals and verticals of the grid to see what cells the ray will pass through
    for (let x = 1; x < numCells; x ++)
    {
        //check extended ray against a vertical line 
        let result = checkIntersection(
          x * boxWidth, 0, 
          x * boxWidth, numCells * boxHeight, 
          rayPixelOriginX, rayPixelOriginY, 
          rayPixelEndpointX, rayPixelEndpointY);

        if (result.type === 'intersecting'){
          const indexY = Math.floor(result.point.y / boxHeight);

          traversedGridCells[getCellID(x, indexY)] = true;
          traversedGridCells[getCellID(x-1, indexY)] = true;

          horizontalFlipArrowLocations.push(new Vector(x * boxWidth, indexY * boxHeight + boxHeight/2));
        }
    }
    for (let y = 1; y < numCells; y ++)
    {
      //check extended ray against a horizontal line 
      let result = checkIntersection(
        0, y * boxHeight, 
        numCells * boxWidth, y * boxHeight, 
        rayPixelOriginX, rayPixelOriginY, 
        rayPixelEndpointX, rayPixelEndpointY);

      if (result.type === 'intersecting'){
        const indexX = Math.floor(result.point.x / boxWidth);

        traversedGridCells[getCellID(indexX, y, )] = true;
        traversedGridCells[getCellID(indexX, y-1)] = true;

        verticalFlipArrowLocations.push(new Vector(indexX * boxWidth + boxWidth/2, y * boxHeight));
      }
    }
  }

  //apply the appropriate transformation to render in the correct offset / flipping for a particular cell
  //NOTE!! apply pop() after grid cell rendering is complete as this function pushes a transformation 
  //x: x coord of the cell, assume x=0,y=0 is not flipped horizontally or vertically
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

    //adds a circular polygonal barrier made of segments to the barrier segments list. 
    const addCircularBarrier = (x, y, radius, id) => {
      //add segments forming a regular polygon to stop ray at gem
      const collisionPolygonSides = 16;
      for (let i = 0; i < collisionPolygonSides; i ++) {
        const thisAngle = (i / parseFloat(collisionPolygonSides)) * Math.PI * 2;
        const nextAngle = ((i+1) / parseFloat(collisionPolygonSides)) * Math.PI * 2;

        barrierSegments.push(new Segment(
          Math.cos(thisAngle) * radius + x, 
          Math.sin(thisAngle) * radius + y, 
          Math.cos(nextAngle) * radius + x, 
          Math.sin(nextAngle) * radius + y, false, id));
      }
    }

    addCircularBarrier(gemPosition.x, gemPosition.y, gemSize/2, gemID);
    addCircularBarrier(eyePosition.x, eyePosition.y, eyeSize/2, eyeID);

    allSegments = boxSegments.concat(barrierSegments);
  };

  s.draw = () => {
    s.background(255);

    //draw grid of reflections
    s.noStroke();
    for (let x = 0; x < numCells; x ++)
    {
      for (let y = 0; y < centerCell+1; y ++)
      {
        const cellKey = getCellID(x, y);
        let centeredX = x - reflectionRange;//make the center cell with the "real" box be at x=0, y=0
        let centeredY = y - reflectionRange;
        const isRealBox = centeredX == 0 && centeredY == 0; //is this the real box? as opposed to the reflections
        
        //make sure the ray passes through or the cell is the center cell to render
        if (cellKey in traversedGridCells || isRealBox) {
          //set transformation for this grid cell 
          pushGridCellTransformation(x, y);
            //render box walls
            s.push();
            s.strokeWeight(3);
            for (let wallSeg of boxSegments) {
              s.stroke(wallSeg.reflective ? reflectiveWallColor : matteWallColor);
              s.line(wallSeg.x1, wallSeg.y1, wallSeg.x2, wallSeg.y2)
            }
            s.pop();
            
            //draw gem
            s.push();
            s.fill(gemColor);
            s.ellipse(gemPosition.x, gemPosition.y, gemSize, gemSize)
            s.pop();   
            
            //fill white box over reflected cells to make them appear transparent. 
            //definitely wonky.. But p5 doesn't have a good way of creating layers with different transparency that I know of.  
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
    }

    //draw stuff that only gets drawn once in the center
    pushGridCellTransformation(centerCell, centerCell);
      // draw ray
      rayRenderer.animate();
      if (rayHitGem) {
        rayRenderer.draw(gemColor);
      }
      else {
        rayRenderer.draw(128);
      }
      

      //draw eye
      s.push();
      s.fill(eyeColor);
      s.triangle(eyePosition.x - eyeSize, eyePosition.y, eyePosition.x + eyeSize, eyePosition.y, eyePosition.x, eyePosition.y + eyeSize*2)
      s.fill(0);
      s.ellipse(eyePosition.x, eyePosition.y, eyeSize, eyeSize);
      s.pop();   

    s.pop();
    
    s.fill(0);

    //Render arrows showcasing a flip has happened. Would be easier to use some texture here
    //instead of rendering so many triangles!

    const arrowSize = 8;
    const stemOffset = 3;
    for (let loc of verticalFlipArrowLocations) {
      if (loc.y > centerCell * boxHeight + boxHeight/2) {//I don't render the reflections below the center cell, so don't render arrows either
        continue;
      }
      s.triangle(
        loc.x - arrowSize/2, loc.y + stemOffset, 
        loc.x + arrowSize/2, loc.y + stemOffset, 
        loc.x, loc.y + arrowSize);
      s.triangle(
        loc.x - arrowSize/2, loc.y - stemOffset, 
        loc.x + arrowSize/2, loc.y - stemOffset, 
        loc.x, loc.y - arrowSize);
    }

    for (let loc of horizontalFlipArrowLocations) {
      if (loc.y > centerCell * boxHeight + boxHeight/2) {//I don't render the reflections below the center cell, so don't render arrows either
        continue;
      }
      s.triangle(
        loc.x + stemOffset, loc.y - arrowSize/2, 
        loc.x + stemOffset, loc.y + arrowSize/2, 
        loc.x + arrowSize, loc.y);
      s.triangle(
        loc.x - stemOffset, loc.y - arrowSize/2, 
        loc.x - stemOffset, loc.y + arrowSize/2, 
        loc.x - arrowSize, loc.y);
    }
  };
  
}, 'sketch1');

