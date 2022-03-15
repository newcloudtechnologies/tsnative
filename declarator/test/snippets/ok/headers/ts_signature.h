/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include <std/tsarray.h>
#include <std/tsstring.h>

class TS_EXPORT FileInfo_t
{
    int m_counter;
};

class TSClosure;

class TS_EXPORT AnyWidget
{
    TS_METHOD TS_SIGNATURE("readResponse0(fInfos: FileInfo_t): void") void readResponse0(
        const Array<const FileInfo_t*>* fInfo) const;
    TS_METHOD TS_SIGNATURE("readResponse1(fInfos: readonly FileInfo_t[]): void") void readResponse1(
        const Array<const FileInfo_t*>* fInfo) const;
    TS_METHOD TS_SIGNATURE("readResponse2(fInfos: Array<FileInfo_t>): void") void readResponse2(
        const Array<const FileInfo_t*>* fInfo) const;

    template <typename U>
    TS_METHOD TS_SIGNATURE("map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[]")
        Array<U>* map(TSClosure* closure);
};

template <typename U>
TS_EXPORT TS_SIGNATURE("function mapWidget<U>(callbackfn: (value: U, index: number, array: readonly U[]) => U): U[]")
    Array<U>* mapWidget(TSClosure* closure);

TS_EXPORT TS_SIGNATURE("function someFunc(n: number, m: number): number") int someFunc(int n,
                                                                                       int m,
                                                                                       int x = -1,
                                                                                       int y = -1);
