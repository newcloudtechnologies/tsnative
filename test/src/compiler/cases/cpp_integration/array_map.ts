import { Point } from "cpp_integration_exts";

{
    const coords = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }];
    const points = coords.map((pos) => new Point(pos.x, pos.y));
    console.assert(points.length === 3, "Array.map return type")
}