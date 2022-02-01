#pragma once

#include "gc.h"
#include "iterable.h"
#include "tsclosure.h"
#include "tsnumber.h"
#include "tsstring.h"

#include "std/private/tsarray_p.h"

#include "iterators/arrayiterator.h"

#include <vector>
#include <sstream>

template <typename T>
class Array : public Iterable<T>
{
    static_assert(std::is_pointer<T>::value, "TS Array elements expected to be of pointer type");

public:
    Array();
    // mkrv @todo: at least copy ctor
    ~Array();

    static Array<T>* fromStdVector(const std::vector<T>& initializer)
    {
        auto array = new Array<T>;
        for (const auto& value : initializer)
        {
            array->push(value);
        }

        return GC::track(array);
    }

    Number* push(T v);

    template <typename... Ts>
    Number* push(T t, Ts... ts);

    Number* length() const;

    T operator[](Number* index) const;
    T operator[](size_t index) const;

    void forEach(TSClosure* closure) const;

    Number* indexOf(T value) const;
    Number* indexOf(T value, Number* fromIndex) const;

    // @todo: `map` have to be marked as `const`,
    // but somehow meta information have to be provided for code generator on TS side
    template <typename U>
    Array<U>* map(TSClosure* closure);

    Array<T>* splice(Number* start);
    Array<T>* splice(Number* start, Number* deleteCount);

    Array<T>* concat(Array<T> const& other) const;

    String* toString() const;

    IterableIterator<T>* iterator() override;
    IterableIterator<Number*>* keys();
    IterableIterator<T>* values();

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, Array<U>* array);

private:
    DequeueBackend<T>* _d = nullptr;
};

// All the definitions placed in header to make it possible
// to create explicit instantiations using only include of this header.
template <typename T>
Array<T>::Array()
    : _d(new DequeueBackend<T>())
{
}

template <typename T>
Array<T>::~Array()
{
    delete _d;
}

template <typename T>
Number* Array<T>::push(T t)
{
    return _d->push(t);
}

template <typename T>
Number* Array<T>::length() const
{
    return _d->length();
}

template <typename T>
T Array<T>::operator[](Number* index) const
{
    return _d->operator[](index);
}

template <typename T>
T Array<T>::operator[](size_t index) const
{
    return _d->operator[](index);
}

template <typename T>
void Array<T>::forEach(TSClosure* closure) const
{
    auto numArgs = closure->getNumArgs()->unboxed();

    size_t length = static_cast<size_t>(this->length()->unboxed());

    for (size_t i = 0; i < length; ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(operator[](i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(GC::createHeapAllocated<Number>(i), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        closure->operator()();
    }
}

template <typename T>
Number* Array<T>::indexOf(T value) const
{
    return _d->indexOf(value);
}

template <typename T>
Number* Array<T>::indexOf(T value, Number* fromIndex) const
{
    return _d->indexOf(value, fromIndex);
}

template <typename T>
Array<T>* Array<T>::splice(Number* start)
{
    return Array<T>::fromStdVector(_d->splice(start));
}

template <typename T>
Array<T>* Array<T>::splice(Number* start, Number* deleteCount)
{
    return Array<T>::fromStdVector(_d->splice(start, deleteCount));
}

template <typename T>
Array<T>* Array<T>::concat(const Array<T>& other) const
{
    return Array<T>::fromStdVector(_d->concat(other));
}

template <typename T>
String* Array<T>::toString() const
{
    std::ostringstream oss;
    oss << this;
    return GC::createHeapAllocated<String>(oss.str());
}

template <typename T>
template <typename U>
Array<U>* Array<T>::map(TSClosure* closure)
{

    static_assert(std::is_pointer<U>::value, "TS Array elements expected to be of pointer type");

    auto transformedArray = new Array<U>();
    auto numArgs = closure->getNumArgs()->unboxed();

    size_t length = static_cast<size_t>(this->length()->unboxed());

    for (size_t i = 0; i < length; ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(operator[](i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(GC::createHeapAllocated<Number>(i), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        U transformed = reinterpret_cast<U>(closure->operator()());
        transformedArray->push(transformed);
    }

    return GC::track(transformedArray);
}

template <typename T>
template <typename... Ts>
Number* Array<T>::push(T t, Ts... ts)
{
    return _d->push(t, ts...);
}

template <typename T>
IterableIterator<T>* Array<T>::iterator()
{
    auto it = new ArrayIterator<T>(this);
    return GC::track(it);
}

template <typename T>
IterableIterator<Number*>* Array<T>::keys()
{
    auto keys = _d->keys();
    auto keysArray = new Array<Number*>();

    for (auto key : keys)
    {
        keysArray->push(new Number(key));
    }

    auto it = new ArrayIterator<Number*>(keysArray);
    return GC::track(it);
}

template <typename T>
IterableIterator<T>* Array<T>::values()
{
    auto it = new ArrayIterator<T>(this);
    return GC::track(it);
}

template <typename T>
inline std::ostream& operator<<(std::ostream& os, Array<T>* array)
{
    os << array->_d;
    return os;
}
