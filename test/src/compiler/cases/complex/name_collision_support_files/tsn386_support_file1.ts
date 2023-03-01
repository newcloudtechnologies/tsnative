import {
    currentDirectoryItem,
} from "./tsn386_support_file2";

type ContentView_arg = {
    filter?: number;
};

export function MyFPContentView(val: ContentView_arg) {
    const contentArgs: ContentView_arg = {
        filter: val.filter,
    };

}