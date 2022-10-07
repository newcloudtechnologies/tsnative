declare module "poc" {
    export namespace exts {
        export class FileInfo_t {
            constructor(path: string, name: string, isFolder: boolean);
        }
    }
}
