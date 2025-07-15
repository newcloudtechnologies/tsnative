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
