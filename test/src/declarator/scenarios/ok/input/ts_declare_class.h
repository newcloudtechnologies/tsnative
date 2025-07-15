#pragma once

#include <TS.h>
#include <std/tsobject.h>

class TS_DECLARE MyOuterClass : public Object
{
public:
    TS_METHOD MyOuterClass();
};

class TS_EXPORT TS_DECLARE ExportAndDeclareClass : public Object
{
public:
    TS_METHOD ExportAndDeclareClass();
};

namespace exts IS_TS_DECLARED_NAMESPACE
{

class TS_DECLARE MyInnerClass : public Object
{
public:
    TS_METHOD MyInnerClass();
};

} // namespace IS_TS_DECLARED_NAMESPACE
