//@ts-ignore
@Size(5)
export class BasicRect<T> {
    constructor(width: T, height: T);
    width(): T;
    height(): T;
}