// import { MyFPContentView } from "./name_collision_support_files/tsn386_support_file1";
// import { filter } from "./name_collision_support_files/tsn386_support_file2"

// function openFile() {
//     const filter: number = 5;
//     MyFPContentView({
//         filter: filter,
//     })

//     console.assert(filter === 5, "");
// }

// openFile()
// console.assert(filter === undefined, "");

// function MyFPContentView() {
//     const contentArgs = {
//         filter: 10,
//     };
//     // console.assert(contentArgs.filter === 10, "");
// }

// let filter: string | undefined = "abacaba";

function openFile(nn: string) {
    const filter: number = 5;
    let z = 100;

    let t: [string, number] = ["adas", 20];
    let [t1, t2] = t;
    {
        let z = 200;
    }
    // MyFPContentView();
    // console.assert(filter === 5, "Name collision: filter is not equal to 5");
}

let a = 10;

openFile("abacaba")