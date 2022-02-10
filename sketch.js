let draggable 


let sketch1 = new p5(( s ) => {

  //animation
  const rayRevealSpeed = 10;

  //color information
  const wallColor = s.color(0, 0, 255);
  const bgColor = s.color(255, 255, 255);
  const reflectionVisibility = 0.2;
  const gemColor = s.color(255, 0, 0);

  //geometry information
  const gemPosition = s.createVector(30, 20);
  const gemSize = 20;

  const reflectionRange = 2;//number of reflection cells to render on either side of real box

    //---------------------- make these vectors
  const boxWidth = 200;
  const boxHeight = 150;
  const numCells = reflectionRange*2+1;//one cell at center than range on either side
  const boxOpeningSize = 20;
  const wallThickness = 3;

  class RaySegment {
    constructor(origin, delta) {
      this.origin = origin;
      this.delta = delta;
      this.visiblePercentage = 0;
    }

    restartDrawing = () => {
      this.visiblePercentage = 0;
    }

    getVisibleEndpoint = () => {
      return origin.add(delta.mult(this.visiblePercentage));
    }

    continueDrawing = () => {
      //the coordinate of the end of the ray that's visible so far
      const visibleEndpoint = this.getVisibleEndpoint();

      s.push();
      s.line(this.origin.x, this.origin.y, visibleEndpoint.x, visibleEndpoint.y);
      s.pop();

      this.visiblePercentage += (s.deltaTime / this.delta.mag()) * rayRevealSpeed;
    }
  }

  s.setup = () => {

    const canvasWidth = numCells * boxWidth;
    const canvasHeight = numCells * boxHeight;
    s.createCanvas(canvasWidth, canvasHeight);

    for (let x = 0; x < numCells; x ++)
    {
        let xCentered = x - reflectionRange;
        let xScaled = (1 - (xCentered & 1)) * 2 - 1;
        console.log((1 - (xCentered & 1)) * 2 - 1);
    }
  };

  //apply the appropriate transformation to render in the correct offset / flipping for a particular cell
  //NOTE!! apply pop() after grid cell rendering is complete 
  //x: x coord of the cell, assume x=0 is not flipped
  let pushGridCellTransformation = (x, y) => {
    //---------not ideal.. recalculating this value here
    let xCentered = x - reflectionRange;//make the center cell with the "real" box be at x=0, y=0
    let yCentered = y - reflectionRange;
    //move coordinate system to cell position and adjust scale to flip 
    s.push();
    let xScale = (1 - (xCentered & 1)) * 2 - 1;
    let yScale = (1 - (yCentered & 1)) * 2 - 1;        
    s.translate(x * boxWidth + boxWidth / 2, y * boxHeight + boxHeight / 2);
    s.scale(xScale, yScale);
    s.translate(-boxWidth/2, -boxHeight/2);
    //at this point the coordinate system for the center cell is as expected and 0,0 is at the top left corner
  }

  let renderBox = (isRealBox) => {
    //render walls
    s.rect(0, 0, boxWidth, wallThickness);//top wall
    s.rect(0, boxHeight - wallThickness, boxWidth / 2 - boxOpeningSize / 2, wallThickness);//bottom wall 1
    s.rect(boxWidth/2 + boxOpeningSize, boxHeight - wallThickness, boxWidth / 2 - boxOpeningSize, wallThickness);//bottom wall 2
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
    s.noStroke();
    for (let x = 0; x < numCells; x ++)
    {
      for (let y = 0; y < numCells; y ++)
      {
        let xCentered = x - reflectionRange;//make the center cell with the "real" box be at x=0, y=0
        let yCentered = y - reflectionRange;

        pushGridCellTransformation(x, y);

        const isRealBox = xCentered == 0 && yCentered == 0; //is this the real box? as opposed to the reflections
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

        

        // s.rect(s.mouseX, s.mouseY, 10, 10);
       
        s.pop();
        
      }
    }

    

  };
}, 'sketch1');

