//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class FileInfo_t {
    private p0_FileInfo_t: number;
    private p1_FileInfo_t: number;
    private p2_FileInfo_t: number;
}

//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class AnyWidget {
    private p0_AnyWidget: number;
    private p1_AnyWidget: number;
    private p2_AnyWidget: number;

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
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Multiline {
    private p0_Multiline: number;
    private p1_Multiline: number;
    private p2_Multiline: number;

    static multiline(arg1: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number, arg7: number): number;
}

export function multiline(arg1: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number, arg7: number): number;
