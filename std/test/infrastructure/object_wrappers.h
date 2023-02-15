/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include "std/private/uv_timer_adapter.h"
#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsdate.h"
#include "std/tsmap.h"
#include "std/tsnull.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tsset.h"
#include "std/tsstring.h"
#include "std/tstuple.h"
#include "std/tsundefined.h"
#include "std/tsunion.h"

#include "global_test_allocator_fixture.h"

namespace test
{
template <typename T>
class GloballyAllocatedObjectWrapper : public T
{
public:
    using T::T;

    void* operator new(std::size_t n)
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
using Timer = GloballyAllocatedObjectWrapper<::UVTimerAdapter>;

template <typename T>
using Array = GloballyAllocatedObjectWrapper<::Array<T>>;

template <typename T>
using Set = GloballyAllocatedObjectWrapper<::Set<T>>;

template <typename K, typename V>
using Map = GloballyAllocatedObjectWrapper<::Map<K, V>>;

} // namespace test