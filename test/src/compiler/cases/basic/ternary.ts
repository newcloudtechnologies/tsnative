/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

// Return User literal
{
    type FileInfo_t = {
        _type: string,
    }

    function lol(a: string, b: string, c: boolean): FileInfo_t {
        return {
            _type: c ? a : b,
        };
    }

    const message = "Object property is not initialized properly by the ternary expression"
    console.assert(lol("folder", "file", false)._type === "file" && lol("folder", "file", true)._type === "folder", message);
}

// Create user object and pass as argument to factory function
{
    interface RxButton_args {
        text: string
    }

    class RxButton_t  {
        readonly text: string;
        constructor(text: string) { 
            this.text = text;
        }
    }

    function RxButton(args: RxButton_args): RxButton_t {
        console.log(args.text)
        return new RxButton_t(args.text);
    }

    const qqq = RxButton({
        text: true ? "Log In" : "Processing...",
    })

    console.assert(qqq.text === "Log In", "Ternary: text property is not equal");
}

// Simple ternary with flag
{
    const a = true ? "a" : "b";
    console.assert(a === "a", "Ternary: simple ternary is not equal");
}

// Expression as conditional
{
    let a = (1 + 2) ? "a" : "b";
    console.assert(a === "a", "Ternary: Expression as conditional ternary is not equal");
}

// Nested ternary
{
    let a = true ? (true ? "a" : "c") : "b";
    console.assert(a === "a", "Ternary: Nested ternary is not equal");
}

// // Ternary with unions
// {
//     function foo(): number|string {
//         return 10;
//     }

//     let a = true ? foo() : "b";
//     console.assert(a === 10, "Ternary: Ternary with unions is not equal");

//     a = "abacaba";
//     console.assert(a === "abacaba", "Ternary: Ternary with unions is not equal");
// }

// // Ternary with object literals and unions
// {
//     function foo(): number|string {
//         return 10;
//     }

//     let a = {
//         text: true ? foo() : "b"
//     }
//     console.assert(a.text === 10, "Ternary: Ternary with unions is not equal");

//     a.text = "abacaba";
//     console.assert(a.text === "abacaba", "Ternary: Ternary with unions is not equal");
// }

// // Create user object with ternary and pass directly to the constructor
// {
//     const flag = true;

//     interface RxText_args {
//         text: string
//     }

//     class RxText {
//         readonly text: string;
//         constructor(args: RxText_args) {
//             this.text = args.text;
//         }
//     }

//     const rxText = new RxText(
//         {
//             text: (flag ? "title1" : "title2")
//         });

//     console.assert(rxText.text === "title1", "Ternary: text property is not equal");
// }

// {
//     const AUTOSELECTED_RENDER_TYPE = 22;

//     function getAutoselectedRenderType() {
//         return AUTOSELECTED_RENDER_TYPE;
//     }

//     type AType = {
//         renderType?: number
//     }

//     function f(args: AType) {
//         const renderType = args.renderType ? args.renderType : getAutoselectedRenderType();
//         return renderType;
//     }

//     const defaultRenderType = f({});
//     console.assert(defaultRenderType === AUTOSELECTED_RENDER_TYPE, "Non-provided optional property in ternary should behave correctly");

//     const CUSTOM_RENDER_TYPE = 901;
//     const customRenderType = f({ renderType: CUSTOM_RENDER_TYPE });

//     console.assert(customRenderType === CUSTOM_RENDER_TYPE, "Provided optional property in ternary should be narrowed correctly");
// }
