import { Point, Aggregate } from "./declarations/cpp"

const point = new Point(1, 1);

const array = ["this", "is", "string", "array"];
const s = "this is string";
const d = 1;
const i: int8_t = 17;

const aggregate = new Aggregate(point, array, s, d, i);

console.assert(aggregate.getPoint().x() === 1, "Aggregate.getPoint.x failed");
console.assert(aggregate.getPoint().y() === 1, "Aggregate.getPoint.y failed");
console.assert(aggregate.getString() === "this is string", "Aggregate.getString failed");
console.assert(aggregate.getDouble() === 1, "Aggregate.getDouble failed");
console.assert(aggregate.getInt8() === 17, "Aggregate.getInt8 failed");

const stringArrayFromAggregate = aggregate.getStringArray();
for (let i = 0; i < stringArrayFromAggregate.length; ++i) {
    console.assert(stringArrayFromAggregate[i] === array[i], "Aggregate.getStringArray failed");
}