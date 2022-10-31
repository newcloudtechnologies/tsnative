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

import { CXXSymbolExtractor } from "../mangling";

let cxxSymbolsStorage: CXXSymbolsStorage | undefined;

export function CXXSymbols() {
    if (!cxxSymbolsStorage) {
        throw new Error(`CXX symbols storage is not initialized. Call 'initCXXSymbols' first`);
    }

    return cxxSymbolsStorage;
}

export function initCXXSymbols(demangledFiles: string[], mangledFiles: string[]) {
    const extractor = new CXXSymbolExtractor();
    const { demangledSymbols, mangledSymbols } = extractor.readSymbols(demangledFiles, mangledFiles);
    cxxSymbolsStorage = new CXXSymbolsStorage(demangledSymbols, mangledSymbols);
}

export class CXXSymbol {
    constructor(private _demangled: string, private _mangled: string) { }

    get demangled() {
        return this._demangled;
    }

    get mangled() {
        return this._mangled;
    }
}

class CXXSymbolsStorage {
    private readonly symbols = new Map<string, CXXSymbol[]>();

    constructor(demangledLines: string[], mangledLines: string[]) {
        if (mangledLines.length !== demangledLines.length) {
            throw new Error("Symbols tables size mismatch");
        }

        for (let i = 0; i < demangledLines.length; ++i) {
            const symbol = demangledLines[i];
            const firstLetter = this.getCXXSymbolFirstLetter(symbol);
            const lowered = firstLetter.toLocaleLowerCase();

            if (!this.symbols.has(lowered)) {
                this.symbols.set(lowered, []);
            }

            this.symbols.get(lowered)!.push(new CXXSymbol(symbol, mangledLines[i]));
        }

        this.symbols.delete("."); // drop all the internal stuff
    }

    getOrCreate(key: string) {
        if (!key) {
            throw new Error("Empty string requested as a key at CXXSymbolsStorage.get");
        }

        key = key[0].toLowerCase();

        if (!this.symbols.has(key)) {
            this.symbols.set(key, []);
        }

        return this.symbols.get(key)!;
    }

    getVTableSymbolFor(className: string) {
        const candidates = this.getOrCreate("v");

        const cxxSymbol = candidates.find((cxxSymbol) => cxxSymbol.demangled === `vtable for ${className}`);
        if (!cxxSymbol) {
            throw new Error(`Unable to find vtable for '${className}'`);
        }

        return cxxSymbol.mangled;
    }

    private getSignatureMeaningPart(line: string) {
        const OPEN_BRACKET = "(";

        const openBracketIndex = line.lastIndexOf(OPEN_BRACKET);
        if (openBracketIndex === -1) {
            return line;
        }

        const signaturePart = line.substring(0, openBracketIndex);
        return signaturePart;
    }

    private removeSpacesFromTemplates(line: string) {
        const OPEN_ANGLE_BRACKET = "<";
        const CLOSE_ANGLE_BRACKET = ">";

        let result = "";

        const stack: number[] = [];

        const isInTemplate = () => stack.length > 0;

        for (const char of line) {
            if (char === OPEN_ANGLE_BRACKET) {
                stack.push(0);
            } else if (char === CLOSE_ANGLE_BRACKET) {
                stack.pop();
            }

            if (isInTemplate() && char === " ") {
                continue;
            }

            result += char;
        }

        return result;
    }

    private getCXXSymbolFirstLetter(line: string) {
        // demangled template includes return type in signature unlike non-template:
        // void console::log<Number*, Number*>(Number*)
        // in general:
        // T<U, W<X, Y>>::N f<T<M, N>, Z>(...)
        //
        // 1. take substring from beginning to open bracket '('
        // 2. remove all the whitespaces in angle brackets
        // 3. split the result by white space:
        //          if there is return type is signature, splitting will give exactly two parts
        //          if there is not return type is signature, splitting will give exactly one part
        //          some internal CXX stuff is also demangled. use it as is

        line = line.trim();
        if (!line) {
            return line;
        }

        const signatureMeaningPart = this.getSignatureMeaningPart(line);
        const signatureMeaningPartWithoutTemplateSpaces = this.removeSpacesFromTemplates(signatureMeaningPart);

        const parts = signatureMeaningPartWithoutTemplateSpaces.split(" ");

        let part: string = "";

        if (parts.length === 1) {
            part = parts[0];
        } else if (parts.length === 2) {
            part = parts[1];
        } else {
            part = line;
        }

        return part.length > 0 ? part[0] : "";
    }
}
