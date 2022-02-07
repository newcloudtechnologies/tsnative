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

export class Event {
    private p0_Event: boolean;

    event(): void;
    entity(): void;

}

export class CustomEvent extends Event {
    private p0_CustomEvent: boolean;
    private p1_CustomEvent: boolean;
    private p2_CustomEvent: boolean;

    customEvent(): void;
    abc(): void;
    a(): void;
    b(): void;
    c(): void;

}
