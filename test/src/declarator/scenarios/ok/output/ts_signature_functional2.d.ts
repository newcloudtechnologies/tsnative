//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(10)
//@ts-ignore
@VirtualDestructor
export class TestPromise {
    finally2(onFinally?: () => void): Promise;
    finally3(onFinally?: (_: any) => void): Promise;
}
