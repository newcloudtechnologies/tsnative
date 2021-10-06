declare class IteratorResult<T> {
    get done(): boolean;
    get value(): T;

    private _done: boolean;
    private _value: number; // primitive or a pointer to value
}

declare class Iterator<T> {
    next(): IteratorResult<T>;
}

declare class Iterable<T> {
    iterator(): Iterator<T>;
}

declare class IterableIterator<T> extends Iterator<T> {
    iterator(): IterableIterator<T>;
}

declare class ArrayIterator<T> extends IterableIterator<T> {
    next(): IteratorResult<T>;
}

declare class StringIterator<T> extends IterableIterator<T> {
    next(): IteratorResult<T>;
}

declare class SetIterator<T> extends IterableIterator<T> {
    next(): IteratorResult<T>;
}

declare class MapIterator<T> extends IterableIterator<T> {
    next(): IteratorResult<T>;
}
