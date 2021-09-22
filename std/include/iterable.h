#pragma once

template <typename T>
class IteratorResult
{
public:
    IteratorResult(bool done, T value);

    bool done() const;
    T value() const;

private:
    bool _done;
    T _value;
};

template <typename T>
IteratorResult<T>::IteratorResult(bool done, T value)
    : _done(done)
    , _value(value)
{
}

template <typename T>
bool IteratorResult<T>::done() const
{
    return _done;
}

template <typename T>
T IteratorResult<T>::value() const
{
    return _value;
}

template <typename T>
class Iterator
{
public:
    virtual IteratorResult<T>* next() = 0;
};

template <typename T>
class Iterable
{
    virtual Iterator<T>* iterator() = 0;
};

template <typename T>
class IterableIterator : public Iterator<T>
{
};
