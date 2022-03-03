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

@NoFields
@MapTo("Pi", 3.14)
export class Entity {
    private p0_Entity: boolean;

    constructor();
    @Function(1, 2, "str", 3.14)
    @NoRet
    @MapsTo("iterator")
    update(): void;
}