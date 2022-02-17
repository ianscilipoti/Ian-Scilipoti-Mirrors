import {checkIntersection, colinearPointWithinSegment} from 'line-intersect';
import {Vector} from 'p5'

const maxReflections = 20;//for safety 
export const extremelyLargeConst = 10000;

export class Segment {
    constructor(x1, y1, x2, y2, reflective, id) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.reflective = reflective;
      this.id = id;
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
        //if this ray hits a segment, endPoint will equal the intersection point
        this.endPoint = Vector.add(this.origin, Vector.mult(this.direction, extremelyLargeConst));
        this.reflection = null;//the next segment formed if a reflection happens
        this.isTermination = false; //does this ray instance terminate (not bounce or go to infinity)
        this.finalSegmentID = null;
    }

    propagate = (segments, numReflections, ignoreSegment) => {
              
        let nearesetIntersectionDist = extremelyLargeConst;
        let nearestIntersectedSegment = null;
        let nearestIntersection = null;

        //calculate intersections and find closest intersection
        for (let seg of segments) {
            if (seg === ignoreSegment) {
                continue;//used to avoid ray intersecting with most recently intersected segment
            }
            const result = checkIntersection(seg.x1, seg.y1, seg.x2, seg.y2, this.origin.x, this.origin.y, this.endPoint.x, this.endPoint.y);
            if (result.type === 'intersecting'){
                const intersectionPoint = new Vector(result.point.x, result.point.y);
                const intersectionDist = Vector.dist(this.origin, intersectionPoint);

                if (intersectionDist < nearesetIntersectionDist) {
                    nearesetIntersectionDist = intersectionDist;
                    nearestIntersection = intersectionPoint;
                    nearestIntersectedSegment = seg;
                }
            }
        }
        
        if (nearestIntersection !== null) {
            this.endPoint = nearestIntersection;
            
            if(!nearestIntersectedSegment.reflective) {
                this.isTermination = true;
                this.finalSegmentID = nearestIntersectedSegment.id;
            }

            if (numReflections < maxReflections && nearestIntersectedSegment.reflective) {
                const normal = nearestIntersectedSegment.getNormal();
                const newDirection = this.direction.copy().reflect(normal);
                this.reflection = new LightRay(nearestIntersection, newDirection);
                this.reflection.propagate(segments, numReflections+1, nearestIntersectedSegment);
            }
        }
    }

    //returns either a distant point if this ray goes to infinity or the point of next reflection
    getEndPoint = () => {
        if (this.reflection === null) {
            return this.endPoint;
        }
        else {
            return this.reflection.origin;
        }

    }
    //gets the length. If this ray extends to infinity than return a very large number
    getLength = () => {
        return Vector.dist(this.origin, this.endPoint);
    }

    //gets length ray and all its reflection
    getTotalLength = () => {
        const thisSegmentLength = this.getLength();
        if (this.reflection !== null) {
            return thisSegmentLength + this.reflection.getTotalLength();
        }
        else {
            //capture the case of a termination and infinite ray since getLength will return the right value in either case
            return thisSegmentLength;
        }
    }

    //gets the segment id where this ray terminated, returns null if this ray and its reflections doesn't terminate
    getFinalSegmentID = () => {
        if (this.isTermination) {
            return this.finalSegmentID;
        }
        else if (this.reflection !== null) {
            return this.reflection.getFinalSegmentID();
        }
        else {
            return null;
        }
    }
  }