/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

{
    enum RxMargins_e {
        Top = 1,
        Right = 4,
    }

    let edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;
    let val: number = <number>edges;
    console.assert(val === 5, "Cast using type assertion");
}

{
    interface LoadDataAction_i {
        type: number
    }

    interface SaveDataAction_i {
        type: number,
        urlToSave?: string,
    }

    type FileDataAction_ut = LoadDataAction_i | SaveDataAction_i;

    function loadFile(): FileDataAction_ut {
        return {
            type: 0
        }
    }

    const FileStore_loadFile = () => {
        const action = loadFile();
        console.assert((action as LoadDataAction_i).type === 0, "Property access root must be processed correctly at ConciseBody.getFunctionEnvironment");
    }

    FileStore_loadFile();
}
