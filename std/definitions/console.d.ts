/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 * 
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 * 
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 * 
 * This file is created automatically.
 * Don't edit this file.
*/

declare namespace console {
    export function log(message: any, ...optionalParams: any[]): void;

    export function assert(assumption: any, ...optionalParams: any[]): void;
}

declare type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;