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
  const reflectionVisibility = 0.2;
  const gemColor = s.color(255, 0, 0);

  //geometry information
  const gemPosition = s.createVector(30, 20);
  const gemSize = 20;

  const reflectionRange = 2;//number of reflection cells to render on either side of real box
  const centerCell = reflectionRange;//renaming this for readability. the reflection range number is also the index of the center cell

  const boxWidth = 200;
  const boxHeight = 150;
  const numCells = reflectionRange*2+1;//one cell at center than range on either side
  const boxOpeningSize = 50;
  const wallThickness = 3;

  const reflectiveSegments = [
    new Segment(0, 0, boxWidth, 0),//top segment
    new Segment(boxWidth, 0, boxWidth, boxHeight),//right segment
    new Segment(0, 0, 0, boxHeight),//left segment
    
    new Segment(0, boxHeight, boxWidth/2 - boxOpeningSize/2, boxHeight), //lower segments
    new Segment(boxWidth/2 + boxOpeningSize/2, boxHeight, boxWidth, boxHeight),
  ];

  //interaction
  const rayRevealSpeed = 0.4;
  let ray;






  //get mouse direction from the REAL gem position (center grid cell)
  let getMousePositionAtCell = (x, y) => {
    return s.createVector(s.mouseX - boxWidth * x, s.mouseY - boxHeight * y);
  }

  let resetLightRay = (direction) => {
    ray = new LightRay(gemPosition, direction);
    ray.propagate(reflectiveSegments, 0);//start reflecting this ray off of the wall segments
  }
  
  //reset ray when mouse is clicked
  s.mouseClicked = () => {
    resetLightRay(getMousePositionAtCell(centerCell, centerCell).sub(gemPosition));
  }

  s.setup = () => {
    const canvasWidth = numCells * boxWidth;
    const canvasHeight = numCells * boxHeight;
    s.createCanvas(canvasWidth, canvasHeight);

    resetLightRay(s.createVector(100, 200));
  };

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

  let renderBox = () => {
    //render walls
    s.rect(0, 0, boxWidth, wallThickness);//top wall

    s.rect(0,                           boxHeight - wallThickness, boxWidth / 2 - boxOpeningSize / 2, wallThickness);//bottom wall 1
    s.rect(boxWidth/2 + boxOpeningSize/2, boxHeight - wallThickness, boxWidth / 2 - boxOpeningSize / 2, wallThickness);//bottom wall 2

    s.rect(0, 0, wallThickness, boxHeight);
    s.rect(boxWidth - wallThickness, 0, wallThickness, boxHeight);
    //render boundary black line
    s.push();
    s.noFill();
    s.stroke(0);
    s.rect(0, 0, boxWidth, boxHeight);
    s.pop();
  }

  let drawLightRay = (ray) => {
    pushGridCellTransformation(centerCell, centerCell);
      
      s.stroke(gemColor);
      s.strokeWeight(3);
      
      let curRay = ray;

      while(curRay !== null) {
        const endPoint = curRay.getEndPoint();
        s.line(curRay.origin.x, curRay.origin.y, endPoint.x, endPoint.y);
        curRay = curRay.reflection;
      } 


    s.pop();
  }

  s.draw = () => {
    s.background(255);

    drawLightRay(ray)
    // //draw ray
    // pushGridCellTransformation(centerCell, centerCell);
    // ray.draw();
    // ray.animate();
    // s.pop();


    //draw grid
    s.noStroke();
    for (let x = 0; x < numCells; x ++)
    {
      for (let y = 0; y < numCells; y ++)
      {
        let centeredX = x - reflectionRange;//make the center cell with the "real" box be at x=0, y=0
        let centeredY = y - reflectionRange;

        pushGridCellTransformation(x, y);
          const isRealBox = centeredX == 0 && centeredY == 0; //is this the real box? as opposed to the reflections
          s.fill(wallColor);
          
          renderBox();

          //draw gem
          s.push();
          s.fill(gemColor);
          s.ellipse(gemPosition.x, gemPosition.y, gemSize, gemSize)
          s.pop();   
          
          //fill
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

    

  };
}, 'sketch1');

