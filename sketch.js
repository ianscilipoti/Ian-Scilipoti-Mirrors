let draggable 


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

    //---------------------- make these vectors
  const boxWidth = 200;
  const boxHeight = 150;
  const numCells = reflectionRange*2+1;//one cell at center than range on either side
  const boxOpeningSize = 20;
  const wallThickness = 3;

  //interaction
  const rayRevealSpeed = 0.4;
  let ray;

  class RaySegment {
    constructor(origin, delta) {
      this.origin = origin;
      this.delta = delta;
      this.visiblePercentage = 0;
    }


    getVisibleEndpoint = () => {
      return p5.Vector.add(this.origin, p5.Vector.mult(this.delta, this.visiblePercentage));
    }

    draw = () => {
      //the coordinate of the end of the ray that's visible so far
      const visibleEndpoint = this.getVisibleEndpoint();
      s.push();
      s.stroke(gemColor);
      s.strokeWeight(3);

      s.line(this.origin.x, this.origin.y, visibleEndpoint.x, visibleEndpoint.y);
      s.pop();
    }

    animate = () => {
      this.visiblePercentage += (s.deltaTime / this.delta.mag()) * rayRevealSpeed;
      this.visiblePercentage = Math.min(1, this.visiblePercentage);
    }
  }

  //get mouse direction from the REAL gem position (center grid cell)
  let getMousePositionAtCell = (x, y) => {
    return s.createVector(s.mouseX - boxWidth * x, s.mouseY - boxHeight * y);
  }
  
  //reset ray when mouse is clicked
  s.mouseClicked = () => {
    ray = new RaySegment(gemPosition, getMousePositionAtCell(centerCell, centerCell).sub(gemPosition));
  }

  s.setup = () => {
    const canvasWidth = numCells * boxWidth;
    const canvasHeight = numCells * boxHeight;
    s.createCanvas(canvasWidth, canvasHeight);
    s.frameRate(30);
    //reset 
    ray = new RaySegment(gemPosition, s.createVector(100, 200));
  };

  //apply the appropriate transformation to render in the correct offset / flipping for a particular cell
  //NOTE!! apply pop() after grid cell rendering is complete 
  //x: x coord of the cell, assume x=0 is not flipped
  let pushGridCellTransformation = (x, y) => {
    //---------not ideal.. recalculating this value here
    let centeredX = x - reflectionRange;//make the center cell with the "real" box be at x=0, y=0
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

  let renderBox = (isRealBox) => {
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

  s.draw = () => {
    s.background(255);
    //draw ray
    pushGridCellTransformation(centerCell, centerCell);
    ray.draw();
    ray.animate();
    s.pop();


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
          if (isRealBox)
          {
            s.fill(wallColor);
          }
          else
          {
            s.fill(s.lerpColor(bgColor, wallColor, reflectionVisibility));
          }
          
          renderBox(isRealBox);

          //draw gem
          s.push();
          s.fill(gemColor);
          s.ellipse(gemPosition.x, gemPosition.y, gemSize, gemSize)
          s.pop();        
        s.pop();
      }
    }

    

  };
}, 'sketch1');

