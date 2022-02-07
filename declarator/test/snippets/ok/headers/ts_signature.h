#pragma once

#include <TS.h>

#include <std/tsarray.h>
#include <std/tsstring.h>

class TS_EXPORT FileInfo_t
{
    int m_counter;
};

class TS_EXPORT AnyWidget
{
    TS_METHOD TS_SIGNATURE ("readResponse0(fInfos: FileInfo_t): void") void readResponse0(const Array<const FileInfo_t*>* fInfo) const;
    TS_METHOD TS_SIGNATURE ("readResponse1(fInfos: readonly FileInfo_t[]): void") void readResponse1(const Array<const FileInfo_t*>* fInfo) const;
    TS_METHOD TS_SIGNATURE ("readResponse2(fInfos: Array<FileInfo_t>): void") void readResponse2(const Array<const FileInfo_t*>* fInfo) const;
};
