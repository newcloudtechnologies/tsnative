// import { MyFPContentView } from "./name_collision_support_files/tsn386_support_file1";
// import { filter } from "./name_collision_support_files/tsn386_support_file2"

// function openFile() {
//     const filter: number = 5;
//     MyFPContentView({
//         filter: filter,
//     })

//     // console.assert(filter === 5, "");
// }

// openFile()
// console.assert(filter === undefined, "");


type ContentView_arg = {
    filter?: number;
};

function MyFPContentView(val: ContentView_arg) {
    const contentArgs: ContentView_arg = {
        filter: val.filter,
    };

    // console.assert(contentArgs.filter === val.filter, "");
}

let filter: number | undefined = 1000;

function openFile() {
    const filter: number = 5;

    MyFPContentView({
    	filter: filter
    });
    
    console.log(filter);
    console.assert(filter === 5, "Name collision: filter is not equal to 5");
}

openFile()