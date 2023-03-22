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

#include "std/tsstring.h"
#include "std/tsarray.h"
#include "std/tsnumber.h"
#include "std/tsunion.h"

#include "std/iterators/stringiterator.h"

#ifdef USE_STD_STRING_BACKEND
#include "std/private/tsstring_std_p.h"
#endif

#include "std/private/logger.h"
#include "std/private/number_parser.h"
#include "std/private/tsnumber_p.h"

#include <algorithm>
#include <iomanip>
#include <limits>

String::String()
    : Iterable<String*>(TSTypeID::String)
#ifdef USE_STD_STRING_BACKEND
    , _d(new StdStringBackend())
#endif
{
    LOG_ADDRESS("Calling string default ctor ", this);
}

String::String(Number* d)
    : Iterable<String*>(TSTypeID::String)
{
    std::ostringstream oss;
    oss << std::setprecision(std::numeric_limits<double>::max_digits10) << std::noshowpoint << d->unboxed();

#ifdef USE_STD_STRING_BACKEND
    this->_d = new StdStringBackend(oss.str());
#endif

    LOG_INFO("Calling string ctor from number " + std::to_string(d->unboxed()));
    LOG_ADDRESS("This address: ", this);
}

String::String(const std::string& s)
    : Iterable<String*>(TSTypeID::String)
#ifdef USE_STD_STRING_BACKEND
    , _d(new StdStringBackend(s))
#endif
{
    LOG_INFO("Calling string ctor from const string& " + s);
    LOG_ADDRESS("This address: ", this);
}

String::String(const char* s)
    : Iterable<String*>(TSTypeID::String)
#ifdef USE_STD_STRING_BACKEND
    , _d(new StdStringBackend(s))
#endif
{
    LOG_INFO("Calling string ctor from const char* " + std::string{s});
    LOG_ADDRESS("This address: ", this);
}

String::~String()
{
    LOG_INFO("String _d address for " + cpp_str());
    LOG_ADDRESS("_d address: ", _d);

    delete _d;

    LOG_INFO("Finishing string dtor");
}

Number* String::length() const
{
    size_t length = _d->length();
    return new Number(length);
}

String* String::concat(String* other) const
{
    std::string concatenated = _d->concat(other->cpp_str());
    return new String(concatenated);
}

Boolean* String::startsWith(String* other, Union* maybeStartIndex) const
{
    bool result = false;

    if (!maybeStartIndex->hasValue())
    {
        result = _d->startsWith(other->cpp_str());
    }
    else
    {
        auto startIndex = static_cast<Number*>(maybeStartIndex->getValue());
        result = _d->startsWith(other->cpp_str(), static_cast<int>(startIndex->unboxed()));
    }

    return new Boolean(result);
}

Boolean* String::endsWith(String* other, Union* maybeStartIndex) const
{
    bool result = false;

    if (!maybeStartIndex->hasValue())
    {
        result = _d->endsWith(other->cpp_str());
    }
    else
    {
        auto startIndex = static_cast<Number*>(maybeStartIndex->getValue());
        result = _d->endsWith(other->cpp_str(), static_cast<int>(startIndex->unboxed()));
    }

    return new Boolean(result);
}

Array<String*>* String::split(String* pattern, Union* maybeLimit) const
{
    std::vector<std::string> result;

    if (!maybeLimit->hasValue())
    {
        result = _d->split(pattern->cpp_str());
    }
    else
    {
        auto limit = static_cast<Number*>(maybeLimit->getValue());
        result = _d->split(pattern->cpp_str(), static_cast<int>(limit->unboxed()));
    }

    std::vector<String*> boxed;
    boxed.reserve(result.size());

    std::transform(result.cbegin(),
                   result.cend(),
                   std::back_inserter(boxed),
                   [](const std::string& value) { return new String(value); });

    return Array<String*>::fromStdVector(boxed);
}

String* String::slice(Number* startIndex, Union* maybeEndIndex) const
{
    std::string result;

    if (!maybeEndIndex->hasValue())
    {
        result = _d->slice(static_cast<int>(startIndex->unboxed()));
    }
    else
    {
        auto endIndex = static_cast<Number*>(maybeEndIndex->getValue());
        result = _d->slice(static_cast<int>(startIndex->unboxed()), static_cast<int>(endIndex->unboxed()));
    }
    return new String(result);
}

String* String::substring(Number* startIndex, Union* maybeEndIndex) const
{
    std::string result;

    if (!maybeEndIndex->hasValue())
    {
        result = _d->substring(static_cast<int>(startIndex->unboxed()));
    }
    else
    {
        auto endIndex = static_cast<Number*>(maybeEndIndex->getValue());
        result = _d->substring(static_cast<int>(startIndex->unboxed()), static_cast<int>(endIndex->unboxed()));
    }

    return new String(result);
}

String* String::replace(String* substr, String* newSubstr) const
{
    return new String(_d->replace(substr->cpp_str(), newSubstr->cpp_str()));
}

String* String::trim() const
{
    std::string result = _d->trim();
    return new String(result);
}

String* String::toLowerCase() const
{
    std::string result = _d->toLowerCase();
    return new String(result);
}

String* String::toUpperCase() const
{
    std::string result = _d->toUpperCase();
    return new String(result);
}

Boolean* String::includes(String* pattern, Union* maybeStartIndex) const
{
    bool result = false;

    if (!maybeStartIndex->hasValue())
    {
        result = _d->includes(pattern->cpp_str());
    }
    else
    {
        auto startIndex = static_cast<Number*>(maybeStartIndex->getValue());
        result = _d->includes(pattern->cpp_str(), static_cast<int>(startIndex->unboxed()));
    }

    return new Boolean(result);
}

Number* String::indexOf(String* pattern, Union* maybeStartIndex) const
{
    int index = -1;

    if (!maybeStartIndex->hasValue())
    {
        index = _d->indexOf(pattern->cpp_str());
    }
    else
    {
        auto startIndex = static_cast<Number*>(maybeStartIndex->getValue());
        index = _d->indexOf(pattern->cpp_str(), static_cast<int>(startIndex->unboxed()));
    }

    return new Number(static_cast<double>(index));
}

Number* String::lastIndexOf(String* pattern, Union* maybeStartIndex) const
{
    int index = -1;

    if (!maybeStartIndex->hasValue())
    {
        index = _d->lastIndexOf(pattern->cpp_str());
    }
    else
    {
        auto startIndex = static_cast<Number*>(maybeStartIndex->getValue());
        index = _d->lastIndexOf(pattern->cpp_str(), static_cast<int>(startIndex->unboxed()));
    }

    return new Number(static_cast<double>(index));
}

Boolean* String::equals(Object* other) const
{
    if (!other->isStringCpp())
    {
        return new Boolean(false);
    }

    auto asString = static_cast<String*>(other);
    bool result = _d->equals(asString->cpp_str());
    return new Boolean(result);
}

String* String::operator[](Number* index) const
{
    if (index->unboxed() < 0)
    {
        throw std::runtime_error("Invalid string index");
    }
    return operator[](static_cast<size_t>(index->unboxed()));
}

String* String::operator[](size_t index) const
{
    std::string symbol = _d->operator[](index);
    return new String(symbol);
}

IterableIterator<String*>* String::iterator()
{
    return new StringIterator<String*>(this);
}

const std::string& String::cpp_str() const
{
    return _d->cpp_str();
}

String* String::toString() const
{
    return new String(cpp_str());
}

Boolean* String::toBool() const
{
    return new Boolean(_d->toBool());
}

String* String::clone() const
{
    LOG_INFO("Calling String::clone for " + cpp_str());
    LOG_ADDRESS("This address: ", this);
    return new String(cpp_str());
}

Array<String*>* String::getKeysArray() const
{
    auto result = new Array<String*>();
    for (std::size_t i = 0; i < length()->unboxed(); ++i)
    {
        auto n = new Number(i);
        result->push(n->toString());
    }

    return result;
}

TS_METHOD Number* String::negate() const
{
    const auto trimmed = this->_d->trim();
    if (trimmed.empty())
    {
        return new Number{0.0};
    }

    const auto parsed = NumberParser::parseFloat(trimmed);
    if (parsed == NumberPrivate::NaN())
    {
        return new Number{parsed};
    }

    return new Number{-parsed};
}