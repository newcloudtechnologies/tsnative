#pragma once

#include <TS.h>

#include <std/tsnumber.h>
#include <std/tsobject.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

template <typename T>
class TS_EXPORT IndexableEntity : public Object
{
public:
    TS_METHOD IndexableEntity();
    ~IndexableEntity();

    TS_METHOD TS_SIGNATURE("[index: number]: T") T* operator[](Number* index) const;
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
