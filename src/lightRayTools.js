import {checkIntersection, colinearPointWithinSegment} from 'line-intersect';
import {Vector} from 'p5'

const maxReflections = 20;//for safety 
const extremelyLargeConst = 10000;

export class Segment {
    constructor(x1, y1, x2, y2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    }
    //normal being orthogonal and facing left of the vector from point 1 to point 2 
    getNormal = () => {
        return new Vector(this.y1 - this.y2, this.x2 - this.x1);
    }
}

export class LightRay {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = Vector.normalize(direction);
        //essentially a ray. An endpoint extending out far past the sketch area
        this.endPoint = Vector.add(this.origin, Vector.mult(this.direction, extremelyLargeConst));
    //   this.visiblePercentage = 0;
        this.reflection = null;//the next segment formed if a reflection happens
    }

    propagate = (mirrorSegments, numReflections, ignoreSegment) => {
        //need an endpoint to use line-intersect 
        
                
        let nearesetIntersectionDist = extremelyLargeConst;
        let nearestIntersectedSegment = null;
        let nearestIntersection = null;

        //calculate intersections and find closest intersection
        for (let mSeg of mirrorSegments) {
            if (mSeg === ignoreSegment) {
                continue;//used to avoid ray intersecting with most recently intersected segment
            }
            const result = checkIntersection(mSeg.x1, mSeg.y1, mSeg.x2, mSeg.y2, this.origin.x, this.origin.y, this.endPoint.x, this.endPoint.y);
            if (result.type === 'intersecting'){
                const intersectionPoint = new Vector(result.point.x, result.point.y);
                const intersectionDist = Vector.dist(this.origin, intersectionPoint);
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
            this.reflection.propagate(mirrorSegments, numReflections+1, nearestIntersectedSegment);
        }
    }

    //returns either a distant 
    getEndPoint = () => {
        if (this.reflection === null) {
            return this.endPoint;
        }
        else {
            return this.reflection.origin;
        }

    }
  }