//@ts-ignore
@Size(4)
export class BasicRect<T> {
    constructor(width: T, height: T);
    width(): T;
    height(): T;
}