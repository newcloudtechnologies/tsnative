import { Button, Point } from "./cpp/declarations";

const button = new Button();

let i = 0;
button.onClicked(() => ++i);
button.click();
console.assert(i === 1, "cpp closure test failed (1)");
button.click();
console.assert(i === 2, "cpp closure test failed (2)");

const point = new Point(1, 2);
button.onClickedWithPoint((point: Point) => {
    console.assert(point.x === 1, "point x test failed");
    console.assert(point.y === 2, "point y test failed");
})
button.clickWithPoint(point);