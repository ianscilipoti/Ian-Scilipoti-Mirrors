import {checkIntersection, colinearPointWithinSegment} from 'line-intersect';
import {Vector} from 'p5'

const maxReflections = 30;//for safety 

export class Segment {
    constructor(x1, y1, x2, y2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    }
    //normal being orthogonal and facing left of the vector from point 1 to point 2 
    getNormal = () => {
        return new Vector(y1 - y2, x2 - x1);
    }
}

export class LightRay {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    //   this.visiblePercentage = 0;
        this.reflection = null;//the next segment formed if a reflection happens
    }

    propagateRay = (mirrorSegments, numReflections) => {
        //need an endpoint to use line-intersect 
        const extremelyLargeConst = 10000;
        //essentially a ray. A line segment extending out far past the sketch area
        const tempEndPoint = Vector.add(this.origin, Vector.mult(this.direction, extremelyLargeConst));
        
        let nearesetIntersectionDist = extremelyLargeConst;
        let nearestIntersectedSegment = null;
        let nearestIntersection = null;

        //calculate intersections and find closest intersection
        for (let mSeg in mirrorSegments) {
            const result = checkIntersection(mSeg.x1, mSeg.y1, mSeg.x2, mSeg.y2, origin.x, origin.y, tempEndPoint.x, tempEndPoint.y);
            if (result.type === 'intersecting'){
                const intersectionPoint = new Vector(result.point.x, result.point.y);
                const intersectionDist = Vector.dist(origin, intersectionPoint);
                if (intersectionDist < nearesetIntersectionDist) {
                    nearesetIntersectionDist = intersectionDist;
                    nearestIntersection = intersectionPoint;
                    nearestIntersectedSegment = mSeg;
                }
            }
        }
        
        if (nearestIntersection !== null && numReflections < maxReflections)
        {
            const normal = nearestIntersectedSegment.getNormal();
            const newDirection = this.direction.copy().reflect(normal);
            this.reflection = new LightRay(nearestIntersection, newDirection);
            this.reflection.propagateRay(mirrorSegments, numReflections+1);
        }
    }

    // getVisibleEndpoint = () => {
    //   return p5.Vector.add(this.origin, p5.Vector.mult(this.delta, this.visiblePercentage));
    // }

    // draw = () => {
    //   //the coordinate of the end of the ray that's visible so far
    //   const visibleEndpoint = this.getVisibleEndpoint();
    //   s.push();
    //   s.stroke(gemColor);
    //   s.strokeWeight(3);

    //   s.line(this.origin.x, this.origin.y, visibleEndpoint.x, visibleEndpoint.y);
    //   s.pop();
    // }

    // animate = () => {
    //   this.visiblePercentage += (s.deltaTime / this.delta.mag()) * rayRevealSpeed;
    //   this.visiblePercentage = Math.min(1, this.visiblePercentage);
    // }
  }