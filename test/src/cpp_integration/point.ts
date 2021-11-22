import { Point, Rect } from "./declarations/cpp";

const p1 = new Point(1, 1);
console.assert(p1.x() === 1, "Point 'x' test failed");
console.assert(p1.x() === p1.y(), "Point 'x' & 'y' test failed");

const p2 = p1.clone();
console.assert(p2.x() === 1, "Point.clone 'x' test failed");
console.assert(p2.x() === p2.y(), "Point.clone 'x' & 'y' test failed");

p1.setX(2);
p1.setY(2);
console.assert(p1.x() === 2, "Point.setX test failed");
console.assert(p1.x() === p1.y(), "Point.setX/setY test failed");

p2.setY(p2.y() - 1);
console.assert(p2.x() !== p2.y(), "Point x/y not equals test failed");

console.assert(p1 !== p2, "C++ objects comparison test failed");

const rect0 = new Rect(p1, p2);
const rectDiagonal = rect0.getDiagonal();
console.assert(rectDiagonal.length === 2, "Point array providing test #1 failed");

function isPointEqual(rhs: Point, lhs: Point) {
  return (rhs.x() === lhs.x()) && (rhs.y() === lhs.y());
}
console.assert(isPointEqual(rectDiagonal[0], p1) && isPointEqual(rectDiagonal[1], p2), "Point array providing test #2 failed");
