//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class FileInfo_t {
}

//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class AnyWidget {
    readResponse0(fInfos: data.FileInfo_t): void;
    readResponse1(fInfos: readonly data.FileInfo_t[]): void;
    readResponse2(fInfos: Array<data.FileInfo_t>): void;
    readResponse3(fInfos: Array<data.FileInfo_t>): data.FileInfo_t[];
    readResponse4(fInfos: Array<FileInfo_t>): FileInfo_t[];
    setChildren(val: data.FileInfo_t[]): void;

    map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[];
    map2<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): data.U[];
}

export function mapWidget<U>(callbackfn: (value: U, index: number, array: readonly U[]) => U): U[];

export function mapWidget2<U>(callbackfn: (value: U, index: number, array: readonly U[]) => U): data.U[];

export function someFunc(n: number, m: number): number;

export function someFunc2(n: number, m: number): data.FileInfo_t[];

//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Multiline {
    static multiline(arg1: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number, arg7: number): number;
}

export function multiline(arg1: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number, arg7: number): number;