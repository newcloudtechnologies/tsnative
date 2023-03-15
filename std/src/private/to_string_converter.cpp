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

#include "std/private/to_string_converter.h"

#include "std/private/tsnumber_p.h"
#include "std/tsnumber.h"

#include "std/private/tsdate_p.h"
#include "std/tsdate.h"

#include "std/private/tsstring_p.h"
#include "std/tsstring.h"

#include "std/private/tsarray_p.h"
#include "std/private/tsarray_std_p.h"
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

#include "std/private/algorithms.h"

constexpr int8_t PADDING_WIDTH = 2;
constexpr auto FOUND_RECURSIVE = "<Error! Found circular structure>\n";

static String* parentKey = new String("parent");

static std::string shiftLines(std::string&& str)
{
    const auto newLineWithShift = "\n" + std::string(PADDING_WIDTH, ' ');
    utils::replaceAll(str, "\n", newLineWithShift);
    return str;
}

static std::string removeEnclosingBrackets(std::string&& str)
{
    if (str.empty())
    {
        return str;
    }

    if (str[0] == '{' && str[str.size() - 1] == '}')
    {
        return str.substr(1, str.size() - 2);
    }

    assert("Cannot remove enclosing brackets to format string.");
    return str;
}

static std::string removeNewLineAtEnd(std::string&& str)
{
    if (str.size() > 0 && str[str.size() - 1] == '\n')
    {
        return str.substr(0, str.size() - 1);
    }

    return str;
}

static std::string formatParent(std::string&& parentData)
{
    return removeNewLineAtEnd(removeEnclosingBrackets(std::move(parentData)));
}

template <>
std::string ToStringConverter::toString(const Object* obj, Visited& visited)
{
    std::ostringstream oss;

    const auto& keys = obj->getKeys();

    oss << "{";

    bool parentPropsEmpty = false;

    for (const auto& key : keys)
    {
        auto value = obj->get(key);

        oss << std::endl;
        oss << std::string(PADDING_WIDTH, ' ') << "\"" << key << "\""
            << ": ";

        oss << shiftLines(ToStringConverter::convertWithCheck(value, visited));
    }

    const auto* parent = obj->_props->get(parentKey);
    if (parent && parent != Undefined::instance())
    {
        auto data = formatParent(ToStringConverter::convert(parent));
        parentPropsEmpty = data.empty();
        oss << data;
    }

    if (!keys.empty())
    {
        if (!(keys.size() == 1 && parentPropsEmpty))
        {
            oss << std::endl;
        }
    }

    oss << "}";

    return oss.str();
}

template <>
std::string ToStringConverter::toString(const NumberPrivate* np, Visited& visited)
{
    return np->toString();
}

template <>
std::string ToStringConverter::toString(const DatePrivate* date, Visited& visited)
{
    return "Date: " + date->toString();
}

template <>
std::string ToStringConverter::toString(const StringPrivate* str, Visited& visited)
{
    return "\"" + str->cpp_str() + "\"";
}

template <>
std::string ToStringConverter::toString(const MapPrivate<Object*, Object*>* map, Visited& visited)
{
    std::ostringstream ss;

    ss << "Map (" << map->orderedKeys().size() << ") {";

    bool isFirst = true;
    for (auto* key : map->orderedKeys())
    {
        const auto* value = map->get(key);

        ss << (isFirst ? "" : ", ") << ToStringConverter::convertWithCheck(key, visited) << "=>"
           << ToStringConverter::convertWithCheck(value, visited);
        isFirst = false;
    }

    ss << "}";

    return ss.str();
}

template <>
std::string ToStringConverter::toString(const ArrayPrivate<Object*>* array, Visited& visited)
{
    std::ostringstream oss;

    for (size_t i = 0; i < array->length(); ++i)
    {
        auto data = (*array)[i];
        if (data)
        {
            oss << ToStringConverter::convertWithCheck(data, visited);
        }
        else
        {
            oss << "null";
        }

        if (i != array->length() - 1)
        {
            oss << ",";
        }
    }

    return "[" + oss.str() + "]";
}

template <>
std::string ToStringConverter::toString(const BooleanPrivate* b, Visited& visited)
{
    return b->toString();
}

template <>
std::string ToStringConverter::toString(const Promise* p, Visited& visited)
{
    std::ostringstream ss;
    ss << "Promise. ";
    if (p->ready())
    {
        const auto* pResult = p->getResult();
        ss << "Result: " << ToStringConverter::convertWithCheck(pResult, visited);
    }
    else
    {
        ss << "Not ready";
    }

    return ss.str();
}

template <>
std::string ToStringConverter::toString(const SetPrivate<Object*>* set, Visited& visited)
{
    std::ostringstream ss;
    ss << "Set (" << set->ordered().size() << ") {";

    bool isFirst = true;
    for (const auto value : set->ordered())
    {
        ss << (isFirst ? "" : ",") << ToStringConverter::convertWithCheck(value, visited);
        isFirst = false;
    }

    ss << "}";

    return ss.str();
}

template <>
std::string ToStringConverter::toString(const Union* u, Visited& visited)
{
    std::ostringstream oss;
    oss << "Union: " << ToStringConverter::convertWithCheck(u->getValue(), visited);
    return oss.str();
}

// TODO Output should be associated with variables everywhere
std::string ToStringConverter::convert(const Object* obj)
{
    std::unordered_set<const Object*> visited;
    return convertWithCheck(obj, visited);
}

std::string ToStringConverter::convertWithCheck(const Object* obj, Visited& visited)
{
    if (visited.count(obj) > 0)
    {
        std::ostringstream oss;
        oss << FOUND_RECURSIVE;
        return oss.str();
    }
    visited.insert(obj);

    auto clean = [&visited](const Object* obj) { visited.erase(obj); };

    std::unique_ptr<const Object, decltype(clean)> cleaner(obj, clean);

    if (obj->isNumberCpp())
    {
        const auto* number = static_cast<const Number*>(obj);
        return toString(number->_d, visited);
    }

    if (obj->isDateCpp())
    {
        const auto* date = static_cast<const Date*>(obj);
        return toString(date->_d, visited);
    }

    if (obj->isStringCpp())
    {
        const auto* str = static_cast<const String*>(obj);
        return toString(str->_d, visited);
    }

    if (obj->isBooleanCpp())
    {
        const auto* boolean = static_cast<const Boolean*>(obj);
        return toString(boolean->_d, visited);
    }

    if (obj->isPromiseCpp())
    {
        const auto* promise = static_cast<const Promise*>(obj);
        return toString(promise, visited);
    }

    if (obj->isNullCpp())
    {
        return "null";
    }

    if (obj->isUndefinedCpp())
    {
        return "undefined";
    }

    if (obj->isClosureCpp())
    {
        const auto* closure = static_cast<const TSClosure*>(obj);
        return "Closure. " + std::string("ArgsCount: ") + ToStringConverter::convert(closure->getNumArgs());
    }

    if (obj->isLazyClosureCpp())
    {
        return "Lazy closure";
    }

    if (obj->isTimerCpp())
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

    if (obj->isArrayCpp())
    {
        const auto* arr = static_cast<const Array<Object*>*>(obj);
        return toString(arr->_d, visited);
    }

    if (obj->isMapCpp())
    {
        const auto* mapping = static_cast<const Map<Object*, Object*>*>(obj);
        return toString(mapping->_d, visited);
    }

    if (obj->isSetCpp())
    {
        const auto* set = static_cast<const Set<Object*>*>(obj);
        return toString(set->_d, visited);
    }

    if (obj->isUnionCpp())
    {
        const auto* u = static_cast<const Union*>(obj);
        return toString(u, visited);
    }

    if (obj->isTupleCpp())
    {
        const auto* t = static_cast<const Tuple*>(obj);
        return toString(t->_d, visited);
    }

    if (obj->isObjectCpp())
    {
        return toString(obj, visited);
    }

    throw std::runtime_error("Unsupported object type");
}