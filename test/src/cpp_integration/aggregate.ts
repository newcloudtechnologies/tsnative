import { Point, Aggregate, LargerAggregate } from "./declarations/cpp"

const point = new Point(1, 1);

const array = ["this", "is", "string", "array"];
const s = "this is string";
const n = 1;

const aggregate = new Aggregate(point, array, s, n);

console.assert(aggregate.getPoint().x() === 1, "Aggregate.getPoint.x failed");
console.assert(aggregate.getPoint().y() === 1, "Aggregate.getPoint.y failed");

console.assert(aggregate.getString() === "this is string", "Aggregate.getString failed");
console.assert(aggregate.getNumber() === 1, "Aggregate.getNumber failed");

const stringArrayFromAggregate = aggregate.getStringArray();
for (let i = 0; i < stringArrayFromAggregate.length; ++i) {
    console.assert(stringArrayFromAggregate[i] === array[i], "Aggregate.getStringArray failed");
}

const m = new LargerAggregate(1, 1, 11, 11);
const r = m.getRect();
console.assert(r.getSquare() === 100, "Square test failed");

const topLeft = m.getTopLeft();
console.assert(topLeft.x() === 1, "Top left x test failed");
console.assert(topLeft.y() === 1, "Top left y test failed");

const bottomRight = m.getBottomRight();
console.assert(bottomRight.x() === 11, "Bottom right x test failed");
console.assert(bottomRight.y() === 11, "Bottom right y test failed");

const scaled = m.getScaled(10);
console.assert(scaled.getRect().getSquare() === 10000, "Scaled square test failed");

const scaledTopLeft = scaled.getTopLeft();
console.assert(scaledTopLeft.x() === 10, "Scaled top left x test failed");
console.assert(scaledTopLeft.y() === 10, "Scaled top left y test failed");

const scaledBottomRight = scaled.getBottomRight();
console.assert(scaledBottomRight.x() === 110, "Scaled bottom right x test failed");
console.assert(scaledBottomRight.y() === 110, "Scaled bottom right y test failed");
