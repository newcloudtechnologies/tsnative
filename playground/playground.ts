function myFunc(arg?: string) {
    if (arg !== undefined) {
        console.log("ups", arg);
    } else {
        console.log("else", arg);
    }
}

myFunc();