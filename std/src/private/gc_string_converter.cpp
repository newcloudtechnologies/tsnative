/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/private/gc_string_converter.h"

#include "std/private/tsnumber_p.h"
#include "std/tsnumber.h"

#include "std/private/tsdate_p.h"
#include "std/tsdate.h"

#include "std/private/tsstring_p.h"
#include "std/tsstring.h"

#include "std/private/tsarray_p.h"
#include "std/tsarray.h"

#include "std/private/tsboolean_p.h"
#include "std/tsboolean.h"

#include "std/tspromise.h"

#include "std/private/tsmap_p.h"
#include "std/tsmap.h"

#include "std/private/tsset_p.h"
#include "std/tsset.h"

#include "std/tsunion.h"

#include "std/tsnull.h"
#include "std/tsundefined.h"

#include "std/tstuple.h"

#include "std/timer_object.h"

#include "std/diagnostics.h"
#include "std/event_loop.h"
#include "std/gc.h"
#include "std/memory_diagnostics.h"
#include "std/runtime.h"
#include "std/tsmath.h"

namespace
{
template <typename O>
std::string toString(const O*);

template <>
std::string toString(const NumberPrivate* np)
{
    return np->toString();
}

template <>
std::string toString(const DatePrivate* date)
{
    return date->toString();
}

template <>
std::string toString(const StringPrivate* str)
{
    return str->cpp_str();
}

template <>
std::string toString(const ArrayPrivate<Object*>* array)
{
    std::ostringstream oss;
    oss << "Array\n";

    return oss.str();
}

template <>
std::string toString(const BooleanPrivate* b)
{
    return b->toString();
}

template <>
std::string toString(const Promise* p)
{
    std::ostringstream ss;
    ss << "Promise\n";
    if (p->ready())
    {
        const auto* pResult = p->getResult();
        ss << "Result: " << GCStringConverter::convert(pResult);
    }
    else
    {
        ss << "Not ready";
    }

    return ss.str();
}

template <typename K, typename V>
std::string toString(const MapPrivate<K, V>* mapping)
{
    std::ostringstream oss;
    oss << "Map:\n";

    return oss.str();
}

template <>
std::string toString(const SetPrivate<Object*>* set)
{
    std::ostringstream oss;
    oss << "Set:\n";

    return oss.str();
}

template <>
std::string toString(const Union* u)
{
    std::ostringstream oss;
    oss << "Union:\n";

    return oss.str();
}

} // namespace

// TODO Output should be associated with variables everywhere
std::string GCStringConverter::convert(const Object* obj)
{
    if (obj->isNumber())
    {
        const auto* number = static_cast<const Number*>(obj);
        return toString(number->_d);
    }

    if (obj->isDate())
    {
        const auto* date = static_cast<const Date*>(obj);
        return toString(date->_d);
    }

    if (obj->isString())
    {
        const auto* str = static_cast<const String*>(obj);
        return toString(str->_d);
    }

    if (obj->isArray())
    {
        const auto* arr = static_cast<const Array<Object*>*>(obj);
        return "Array:\n" + toString(arr->_d);
    }

    if (obj->isBoolean())
    {
        const auto* boolean = static_cast<const Boolean*>(obj);
        return toString(boolean->_d);
    }

    if (obj->isPromise())
    {
        const auto* promise = static_cast<const Promise*>(obj);
        return toString(promise);
    }

    if (obj->isMap())
    {
        const auto* mapping = static_cast<const Map<Object*, Object*>*>(obj);
        return toString(mapping->_d);
    }

    if (obj->isSet())
    {
        const auto* set = static_cast<const Set<Object*>*>(obj);
        return toString(set->_d);
    }

    if (obj->isUnion())
    {
        const auto* u = static_cast<const Union*>(obj);
        return toString(u);
    }

    if (obj->isTuple())
    {
        const auto* t = static_cast<const Tuple*>(obj);
        return "Tuple:\n" + toString(t->_d);
    }

    if (obj->isNull())
    {
        return "null";
    }

    if (obj->isUndefined())
    {
        return "undefined";
    }

    if (obj->isClosure())
    {
        const auto* closure = static_cast<const TSClosure*>(obj);
        return "Closure:\n" + std::string("ArgsCount: ") + GCStringConverter::convert(closure->getNumArgs());
    }

    if (obj->isLazy())
    {
        return "Lazy closure";
    }

    if (obj->isTimer())
    {
        const auto* timer = static_cast<const TimerObject*>(obj);
        return "Timer:\n" + std::to_string(timer->due().count());
    }

    if (dynamic_cast<const Math*>(obj))
    {
        return "Math";
    }

    if (dynamic_cast<const Runtime*>(obj))
    {
        return "Runtime";
    }

    if (dynamic_cast<const Diagnostics*>(obj))
    {
        return "Diagnostics";
    }

    if (dynamic_cast<const MemoryDiagnostics*>(obj))
    {
        return "Memory Diagnostics";
    }

    if (dynamic_cast<const EventLoop*>(obj))
    {
        return "Event loop wrapper";
    }

    if (dynamic_cast<const GC*>(obj))
    {
        return "GC Wrapper";
    }

    if (obj->isObject())
    {
        if (obj->_props)
        {
            return "Object:\n" + toString(obj->_props);
        }

        return "Object:\nProps are nullptr";
    }

    throw std::runtime_error("Unsupported object type");
}
