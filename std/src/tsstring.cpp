#include "std/tsstring.h"

#include "std/gc.h"
#include "std/tsarray.h"

#include "std/iterators/stringiterator.h"

#include "std/private/tsstring_p.h"

#include <iomanip>
#include <limits>

String::String()
    : _d(new StdStringBackend())
{
}
String::String(Number* d)
{
    std::ostringstream oss;
    oss << std::setprecision(std::numeric_limits<double>::max_digits10) << std::noshowpoint << d->unboxed();
    this->_d = new StdStringBackend(oss.str());
}
String::String(const int8_t* s)
    : _d(new StdStringBackend(reinterpret_cast<const char*>(s)))
{
}
String::String(const std::string& s)
    : _d(new StdStringBackend(s))
{
}
String::String(const char* s)
    : _d(new StdStringBackend(s))
{
}

Number* String::length() const
{
    return _d->length();
}

String* String::concat(String* other) const
{
    return _d->concat(other);
}

Boolean* String::startsWith(String* other) const
{
    return startsWith(other, GC::createHeapAllocated<Number>(0.0));
}

Boolean* String::startsWith(String* other, Number* startIndex) const
{
    return _d->startsWith(other, startIndex);
}

Boolean* String::endsWith(String* other) const
{
    return _d->endsWith(other);
}

Boolean* String::endsWith(String* other, Number* startIndex) const
{
    return _d->endsWith(other, startIndex);
}

Array<String*>* String::split(String* pattern) const
{
    return _d->split(pattern);
}

Array<String*>* String::split(String* pattern, Number* limit) const
{
    return _d->split(pattern, limit);
}

String* String::slice(Number* startIndex) const
{
    return _d->slice(startIndex);
}

String* String::slice(Number* startIndex, Number* endIndex) const
{
    return _d->slice(startIndex, endIndex);
}

String* String::substring(Number* startIndex) const
{
    return _d->substring(startIndex);
}

String* String::substring(Number* startIndex, Number* endIndex) const
{
    return _d->substring(startIndex, endIndex);
}

String* String::trim() const
{
    return _d->trim();
}

String* String::toLowerCase() const
{
    return _d->toLowerCase();
}

String* String::toUpperCase() const
{
    return _d->toUpperCase();
}

Boolean* String::includes(String* pattern) const
{
    return _d->includes(pattern);
}

Boolean* String::includes(String* pattern, Number* startIndex) const
{
    return _d->includes(pattern, startIndex);
}

Number* String::indexOf(String* pattern) const
{
    return _d->indexOf(pattern);
}

Number* String::indexOf(String* pattern, Number* startIndex) const
{
    return _d->indexOf(pattern, startIndex);
}

Boolean* String::equals(String* other) const
{
    return _d->equals(other);
}

Number* String::lastIndexOf(String* pattern) const
{
    return _d->lastIndexOf(pattern);
}

Number* String::lastIndexOf(String* pattern, Number* startIndex) const
{
    return _d->lastIndexOf(pattern, startIndex);
}

String* String::operator+(String* other) const
{
    return concat(other);
}

String* String::operator[](Number* index) const
{
    return _d->operator[](index);
}

String* String::operator[](size_t index) const
{
    return _d->operator[](index);
}

IterableIterator<String*>* String::iterator()
{
    auto it = new StringIterator<String*>(this);
    return GC::track(it);
}

Boolean* String::toBool() const
{
    return _d->toBool();
}

std::string String::cpp_str() const
{
    return _d->cpp_str();
}

String* String::clone() const
{
    return GC::track(new String(this->cpp_str()));
}

template class Array<String*>;
template class IteratorResult<String*>;
