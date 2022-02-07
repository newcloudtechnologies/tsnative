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

export class FileInfo_t {
    private p0_FileInfo_t: boolean;
    private p1_FileInfo_t: boolean;
    private p2_FileInfo_t: boolean;
    private p3_FileInfo_t: boolean;


}

export class AnyWidget {
    private p0_AnyWidget: boolean;

    readResponse0(fInfos: FileInfo_t): void;
    readResponse1(fInfos: readonly FileInfo_t[]): void;
    readResponse2(fInfos: Array<FileInfo_t>): void;

}
