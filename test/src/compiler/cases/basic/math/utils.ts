export const EPS = Number.EPSILON;

export const equals = function (x: number, y: number, tolerance: number = Number.EPSILON): boolean {
    return Math.abs(x - y) < tolerance;
};