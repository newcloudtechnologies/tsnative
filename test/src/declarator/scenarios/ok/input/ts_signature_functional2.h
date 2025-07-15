#pragma once

#include <TS.h>
#include <std/tsobject.h>
#include <std/tspromise.h>
#include <std/tsunion.h>

class TS_EXPORT TestPromise : public Object
{
public:
    TestPromise() = default;
    ~TestPromise() = default;

    TS_METHOD TS_SIGNATURE("finally2(onFinally?: () => void): Promise") Promise* finally2(Union* onFinally);
    TS_METHOD TS_SIGNATURE("finally3(onFinally?: (_: any) => void): Promise") Promise* finally3(Union* onFinally);
};