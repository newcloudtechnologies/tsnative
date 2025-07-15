import { Documents } from "./class_import"; // this import adds 'Documents.TextDocPageGenerator' to current scope
import { TextDocPageGenerator } from "./func_import";

function f() {
    return TextDocPageGenerator();
}
