#pragma once

#include "std/tsobject.h"
#include "std/tsarray.h"
#include "std/tsnull.h"
#include "std/tsboolean.h"
#include "std/tsundefined.h"
#include "std/tsstring.h"
#include "std/tsnumber.h"
#include "std/tsset.h"
#include "std/tsmap.h"
#include "std/tsunion.h"
#include "std/tstuple.h"
#include "std/tsdate.h"
#include "std/tsclosure.h"

#include "global_test_allocator_fixture.h"

namespace test
{
template<typename T>
class GloballyAllocatedObjectWrapper : public T
{
public:
    using T::T;

    void* operator new (std::size_t n)
    {
        return GlobalTestAllocatorFixture::getAllocator().allocate(n);
    }
};

using Object = GloballyAllocatedObjectWrapper<::Object>;
using Boolean = GloballyAllocatedObjectWrapper<::Boolean>;
using Null = GloballyAllocatedObjectWrapper<::Null>;
using Undefined = GloballyAllocatedObjectWrapper<::Undefined>;
using String = GloballyAllocatedObjectWrapper<::String>;
using Number = GloballyAllocatedObjectWrapper<::Number>;
using Tuple = GloballyAllocatedObjectWrapper<::Tuple>;
using Date = GloballyAllocatedObjectWrapper<::Date>;
using Union = GloballyAllocatedObjectWrapper<::Union>;
using Closure = GloballyAllocatedObjectWrapper<::TSClosure>;

template<typename T>
using Array = GloballyAllocatedObjectWrapper<::Array<T>>;

template<typename T>
using Set = GloballyAllocatedObjectWrapper<::Set<T>>;

template<typename K, typename V>
using Map = GloballyAllocatedObjectWrapper<::Map<K, V>>;

} // test