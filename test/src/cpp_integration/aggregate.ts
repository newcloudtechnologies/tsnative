import { Point, Aggregate } from "./declarations/cpp"

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