#include "std/tsstring.h"

#include "std/gc.h"
#include "std/tsarray.h"

#include "std/iterators/stringiterator.h"

#ifdef USE_STD_STRING_BACKEND
#include "std/private/tsstring_std_p.h"
#endif

#include <algorithm>
#include <iomanip>
#include <limits>


String::String()
#ifdef USE_STD_STRING_BACKEND
    : _d(new StdStringBackend())
#endif
{
}
String::String(Number* d)
{
    std::ostringstream oss;
    oss << std::setprecision(std::numeric_limits<double>::max_digits10) << std::noshowpoint << d->unboxed();

#ifdef USE_STD_STRING_BACKEND
    this->_d = new StdStringBackend(oss.str());
#endif
}
String::String(const int8_t* s)
#ifdef USE_STD_STRING_BACKEND
    : _d(new StdStringBackend(reinterpret_cast<const char*>(s)))
#endif
{
}
String::String(const std::string& s)
#ifdef USE_STD_STRING_BACKEND
    : _d(new StdStringBackend(s))
#endif
{
}
String::String(const char* s)
#ifdef USE_STD_STRING_BACKEND
    : _d(new StdStringBackend(s))
#endif
{
}

Number* String::length() const
{
    size_t length = _d->length();
    return GC::track(new Number(length));
}

String* String::concat(String* other) const
{
    std::string concatenated = _d->concat(other->cpp_str());
    return GC::track(new String(concatenated));
}

Boolean* String::startsWith(String* other) const
{
    bool result = _d->startsWith(other->cpp_str());
    return GC::track(new Boolean(result));
}

Boolean* String::startsWith(String* other, Number* startIndex) const
{
    bool result = _d->startsWith(other->cpp_str(), static_cast<int>(startIndex->unboxed()));
    return GC::track(new Boolean(result));
}

Boolean* String::endsWith(String* other) const
{
    bool result = _d->endsWith(other->cpp_str());
    return GC::track(new Boolean(result));
}

Boolean* String::endsWith(String* other, Number* startIndex) const
{
    bool result = _d->endsWith(other->cpp_str(), static_cast<int>(startIndex->unboxed()));
    return GC::track(new Boolean(result));
}

Array<String*>* String::split(String* pattern) const
{
    auto result = _d->split(pattern->cpp_str());
    std::vector<String*> boxed;
    boxed.reserve(result.size());

    std::transform(result.cbegin(),
                   result.cend(),
                   std::back_inserter(boxed),
                   [](const std::string& value) { return GC::track(new String(value)); });

    return Array<String*>::fromStdVector(boxed);
}

Array<String*>* String::split(String* pattern, Number* limit) const
{
    auto result = _d->split(pattern->cpp_str(), static_cast<int>(limit->unboxed()));
    std::vector<String*> boxed;
    boxed.reserve(result.size());

    std::transform(result.cbegin(),
                   result.cend(),
                   std::back_inserter(boxed),
                   [](const std::string& value) { return GC::track(new String(value)); });

    return Array<String*>::fromStdVector(boxed);
}

String* String::slice(Number* startIndex) const
{
    std::string result = _d->slice(static_cast<int>(startIndex->unboxed()));
    return GC::track(new String(result));
}

String* String::slice(Number* startIndex, Number* endIndex) const
{
    std::string result = _d->slice(static_cast<int>(startIndex->unboxed()), static_cast<int>(endIndex->unboxed()));
    return GC::track(new String(result));
}

String* String::substring(Number* startIndex) const
{
    std::string result = _d->substring(static_cast<int>(startIndex->unboxed()));
    return GC::track(new String(result));
}

String* String::substring(Number* startIndex, Number* endIndex) const
{
    std::string result = _d->substring(static_cast<int>(startIndex->unboxed()), static_cast<int>(endIndex->unboxed()));
    return GC::track(new String(result));
}

String* String::trim() const
{
    std::string result = _d->trim();
    return GC::track(new String(result));
}

String* String::toLowerCase() const
{
    std::string result = _d->toLowerCase();
    return GC::track(new String(result));
}

String* String::toUpperCase() const
{
    std::string result = _d->toUpperCase();
    return GC::track(new String(result));
}

Boolean* String::includes(String* pattern) const
{
    bool result = _d->includes(pattern->cpp_str());
    return GC::track(new Boolean(result));
}

Boolean* String::includes(String* pattern, Number* startIndex) const
{
    bool result = _d->includes(pattern->cpp_str(), static_cast<int>(startIndex->unboxed()));
    return GC::track(new Boolean(result));
}

Number* String::indexOf(String* pattern) const
{
    int index = _d->indexOf(pattern->cpp_str());
    return GC::track(new Number(static_cast<double>(index)));
}

Number* String::indexOf(String* pattern, Number* startIndex) const
{
    int index = _d->indexOf(pattern->cpp_str(), static_cast<double>(startIndex->unboxed()));
    return GC::track(new Number(static_cast<double>(index)));
}

Number* String::lastIndexOf(String* pattern) const
{
    int index = _d->lastIndexOf(pattern->cpp_str());
    return GC::track(new Number(static_cast<double>(index)));
}

Number* String::lastIndexOf(String* pattern, Number* startIndex) const
{
    int index = _d->lastIndexOf(pattern->cpp_str(), static_cast<double>(startIndex->unboxed()));
    return GC::track(new Number(static_cast<double>(index)));
}

Boolean* String::equals(String* other) const
{
    bool result = _d->equals(other->cpp_str());
    return GC::track(new Boolean(result));
}

String* String::operator[](Number* index) const
{
    return operator[](static_cast<size_t>(index->unboxed()));
}

String* String::operator[](size_t index) const
{
    std::string symbol = _d->operator[](index);
    return GC::track(new String(symbol));
}

IterableIterator<String*>* String::iterator()
{
    auto it = new StringIterator<String*>(this);
    return GC::track(it);
}

Boolean* String::toBool() const
{
    bool asBool = _d->toBool();
    return GC::track(new Boolean(asBool));
}

std::string String::cpp_str() const
{
    return _d->cpp_str();
}

String* String::clone() const
{
    return GC::track(new String(cpp_str()));
}

template class Array<String*>;
template class IteratorResult<String*>;
