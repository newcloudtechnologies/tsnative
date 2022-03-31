#pragma once

#include "std/private/options.h"

#include "std/gc.h"
#include "std/iterable.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#ifdef USE_STD_ARRAY_BACKEND
#include "std/private/tsarray_std_p.h"
#endif

#include "std/iterators/arrayiterator.h"

#include <sstream>
#include <vector>

template <typename T>
class Array : public Object, public Iterable<T>
{
    static_assert(std::is_pointer<T>::value, "TS Array elements expected to be of pointer type");

public:
    Array();
    // mkrv @todo: at least copy ctor
    ~Array() override;

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
    void length(Number* value);

    T operator[](Number* index) const;
    T operator[](size_t index) const;

    void forEach(TSClosure* closure) const;

    Number* indexOf(T value, Union* maybeFromIndex) const;

    // @todo: `map` have to be marked as `const`,
    // but somehow meta information have to be provided for code generator on TS side
    template <typename U>
    Array<U>* map(TSClosure* closure);

    Array<T>* splice(Number* start, Union* maybeDeleteCount);

    Array<T>* concat(Array<T>* other) const;

    std::vector<T> toStdVector() const;

    String* toString() const override;

    IterableIterator<T>* iterator() override;
    IterableIterator<Number*>* keys();
    IterableIterator<T>* values();

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, const Array<U>* array);

private:
    ArrayPrivate<T>* _d = nullptr;
};

// All the definitions placed in header to make it possible
// to create explicit instantiations using only include of this header.
template <typename T>
Array<T>::Array()
#ifdef USE_STD_ARRAY_BACKEND
    : _d(new DequeueBackend<T>())
#endif
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
    int result = _d->push(t);
    return GC::track(new Number(static_cast<double>(result)));
}

template <typename T>
Number* Array<T>::length() const
{
    int result = _d->length();
    return GC::track(new Number(static_cast<double>(result)));
}

template <typename T>
void Array<T>::length(Number* value)
{
    _d->length(static_cast<int>(value->unboxed()));
}

template <typename T>
T Array<T>::operator[](Number* index) const
{
    return _d->operator[](static_cast<int>(index->unboxed()));
}

template <typename T>
T Array<T>::operator[](size_t index) const
{
    return _d->operator[](static_cast<int>(index));
}

template <typename T>
void Array<T>::forEach(TSClosure* closure) const
{
    auto numArgs = closure->getNumArgs()->unboxed();

    size_t length = static_cast<size_t>(_d->length());

    for (size_t i = 0; i < length; ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(operator[](i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(GC::track(new Number(static_cast<double>(i))), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        closure->operator()();
    }
}

template <typename T>
Number* Array<T>::indexOf(T value, Union* maybeFromIndex) const
{
    int result = -1;
    if (!maybeFromIndex->hasValue())
    {
        result = _d->indexOf(value);
    }
    else
    {
        auto fromIndex = static_cast<Number*>(maybeFromIndex->getValue());
        result = _d->indexOf(value, static_cast<int>(fromIndex->unboxed()));
    }

    return GC::track(new Number(static_cast<double>(result)));
}

template <typename T>
Array<T>* Array<T>::splice(Number* start, Union* maybeDeleteCount)
{
    std::vector<T> result;

    if (!maybeDeleteCount->hasValue())
    {
        result = _d->splice(static_cast<int>(start->unboxed()));
    }
    else
    {
        auto deleteCount = static_cast<Number*>(maybeDeleteCount->getValue());
        result = _d->splice(static_cast<int>(start->unboxed()), static_cast<int>(deleteCount->unboxed()));
    }

    return Array<T>::fromStdVector(result);
}

template <typename T>
Array<T>* Array<T>::concat(Array<T>* other) const
{
    return Array<T>::fromStdVector(_d->concat(other->toStdVector()));
}

template <typename T>
std::vector<T> Array<T>::toStdVector() const
{
    return _d->toStdVector();
}

template <typename T>
String* Array<T>::toString() const
{
    std::string result = _d->toString();
    return GC::track(new String(result));
}

template <typename T>
template <typename U>
Array<U>* Array<T>::map(TSClosure* closure)
{

    static_assert(std::is_pointer<U>::value, "TS Array elements expected to be of pointer type");

    auto transformedArray = new Array<U>();
    auto numArgs = closure->getNumArgs()->unboxed();

    size_t length = static_cast<size_t>(_d->length());

    for (size_t i = 0; i < length; ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(operator[](i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(GC::track(new Number(static_cast<double>(i))), 1);
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
#ifdef USE_STD_ARRAY_BACKEND
    int result = static_cast<DequeueBackend<T>*>(_d)->push(t, ts...);
    return GC::track(new Number(static_cast<double>(result)));
#endif
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
        keysArray->push(new Number(static_cast<double>(key)));
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
inline std::ostream& operator<<(std::ostream& os, const Array<T>* array)
{
    os << array->_d->toString();
    return os;
}
