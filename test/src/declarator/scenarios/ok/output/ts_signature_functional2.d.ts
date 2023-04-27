//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class TestPromise {
    finally2(onFinally?: () => void): Promise;
    finally3(onFinally?: (_: any) => void): Promise;
}
