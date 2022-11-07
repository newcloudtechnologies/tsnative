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
#include <stdexcept>
#include <utility>

template <typename T, typename E>
class Expected final
{
public:
    using ValueType = T;
    using ErrorType = E;

protected:
    union
    {
        T _value;
        E _error;
    };
    bool _isValid{};
    Expected()
    {
    }

public:
    ~Expected();

    Expected(const Expected& other);

    Expected(Expected&& other) noexcept;

    Expected& operator=(Expected other);

    void swap(Expected& other) noexcept;

    template <typename... Args>
    static Expected makeValue(Args&&... args);

    template <typename... Args>
    static Expected makeError(Args&&... args);

    explicit operator bool() const;

    bool isValid() const;

    T& get();

    const T& get() const;

    T* getIf() noexcept;

    const T* getIf() const noexcept;

    T* operator->();

    const T* operator->() const;

    E& getError();

    const E& getError() const;

    T& operator*();

    const T& operator*() const;

    template <typename F>
    void visit(F f);
};
template <typename E>
class Expected<void, E> final
{
private:
    E _error;
    bool _isValid{};
    Expected()
    {
    }

public:
    ~Expected();

    Expected(const Expected& other);

    Expected(Expected&& other) noexcept;

    Expected& operator=(Expected other);

    void swap(Expected& other) noexcept;

    static Expected makeValue();

    template <typename... Args>

    static Expected makeError(Args&&... args);

    explicit operator bool() const;

    bool isValid() const;

    E& getError();

    const E& getError() const;
};
// ====================== Expected<T, E> ===============================================
//
template <typename T, typename E>
Expected<T, E>::~Expected()
{
    if (_isValid)
    {
        _value.~T();
    }
    else
    {
        _error.~E();
    }
}

template <typename T, typename E>
Expected<T, E>::Expected(const Expected& other)
    : _isValid{other._isValid}
{
    if (_isValid)
    {
        new (&_value) T{other._value};
    }
    else
    {
        new (&_error) E{other._error};
    }
}

template <typename T, typename E>
Expected<T, E>::Expected(Expected&& other) noexcept
    : _isValid{other._isValid}
{
    if (_isValid)
    {
        new (&_value) T{std::move(other._value)};
    }
    else
    {
        new (&_error) E{std::move(other._error)};
    }
}

template <typename T, typename E>
Expected<T, E>& Expected<T, E>::operator=(Expected other)
{
    swap(other);
    return *this;
}

template <typename T, typename E>
void Expected<T, E>::swap(Expected& other) noexcept
{
    using std::swap;
    if (_isValid)
    {
        if (other._isValid)
        {
            swap(_value, other._value);
        }
        else
        {
            auto temp = std::move(other._error);
            other._error.~E();
            new (&other._value) T{std::move(_value)};
            _value.~T();
            new (&_error) E{std::move(temp)};
            std::swap(_isValid, other._isValid);
        }
    }
    else
    {
        if (other._isValid)
        {
            other.swap(*this);
        }
        else
        {
            swap(_error, other._error);
            std::swap(_isValid, other._isValid);
        }
    }
}

template <typename T, typename E>
template <typename... Args>
Expected<T, E> Expected<T, E>::makeValue(Args&&... args)
{
    Expected result;
    result._isValid = true;
    new (&result._value) T{std::forward<Args>(args)...};
    return result;
}

template <typename T, typename E>
template <typename... Args>
Expected<T, E> Expected<T, E>::makeError(Args&&... args)
{
    Expected result;
    result._isValid = false;
    new (&result._error) E{std::forward<Args>(args)...};
    return result;
}

template <typename T, typename E>
Expected<T, E>::operator bool() const
{
    return _isValid;
}

template <typename T, typename E>
bool Expected<T, E>::isValid() const
{
    return _isValid;
}

template <typename T, typename E>
T& Expected<T, E>::get()
{
    return const_cast<T&>(const_cast<const Expected<T, E>*>(this)->get());
}

template <typename T, typename E>
const T& Expected<T, E>::get() const
{
    if (!_isValid)
    {
        throw std::logic_error("Expected<T, E> contains no value. Missing value");
    }
    return _value;
}

template <typename T, typename E>
T* Expected<T, E>::operator->()
{
    return &get();
}

template <typename T, typename E>
const T* Expected<T, E>::operator->() const
{
    return &get();
}

template <typename T, typename E>
E& Expected<T, E>::getError()
{
    return const_cast<E&>(const_cast<const Expected<T, E>*>(this)->getError());
}

template <typename T, typename E>
const E& Expected<T, E>::getError() const
{
    if (_isValid)
    {
        throw std::logic_error("There is no error in this Expected<T, E>");
    }
    return _error;
}

template <typename T, typename E>
template <typename F>
void Expected<T, E>::visit(F f)
{
    f(_isValid ? _value : _error);
}

template <typename T, typename E>
T& Expected<T, E>::operator*()
{
    return get();
}

template <typename T, typename E>
const T& Expected<T, E>::operator*() const
{
    return get();
}

template <typename T, typename E>
T* Expected<T, E>::getIf() noexcept
{
    return const_cast<T*>(const_cast<const Expected<T, E>*>(this)->getIf());
}

template <typename T, typename E>
const T* Expected<T, E>::getIf() const noexcept
{
    if (!_isValid)
    {
        return nullptr;
    }
    return &_value;
}
//
// ====================== end Expected<T, E> ============================================
// ====================== Expected<void, E> =============================================
//
template <typename E>
Expected<void, E>& Expected<void, E>::operator=(Expected other)
{
    swap(other);
    return *this;
}

template <typename E>
void Expected<void, E>::swap(Expected& other) noexcept
{
    using std::swap;
    if (_isValid)
    {
        if (!other._isValid)
        {
            auto temp = std::move(other._error);
            other._error.~E();
            new (&_error) E(std::move(temp));
            std::swap(_isValid, other._isValid);
        }
    }
    else
    {
        if (other._isValid)
        {
            other.swap(*this);
        }
        else
        {
            swap(_error, other._error);
            std::swap(_isValid, other._isValid);
        }
    }
}

template <typename E>
Expected<void, E> Expected<void, E>::makeValue()
{
    Expected result;
    result._isValid = true;
    return result;
}

template <typename E>
Expected<void, E>::Expected(Expected&& other) noexcept
    : _isValid(other._isValid)
{
    if (!_isValid)
    {
        new (&_error) E(std::move(other._error));
    }
}

template <typename E>
Expected<void, E>::Expected(const Expected& other)
    : _isValid(other._isValid)
{
    if (!_isValid)
    {
        new (&_error) E(other._error);
    }
}

template <typename E>
template <typename... Args>
Expected<void, E> Expected<void, E>::makeError(Args&&... args)
{
    Expected result;
    result._isValid = false;
    new (&result._error) E{std::forward<Args>(args)...};
    return result;
}

template <typename E>
Expected<void, E>::operator bool() const
{
    return _isValid;
}

template <typename E>
bool Expected<void, E>::isValid() const
{
    return _isValid;
}

template <typename E>
Expected<void, E>::~Expected()
{
    if (!_isValid)
    {
        _error.~E();
    }
}

template <typename E>
E& Expected<void, E>::getError()
{
    if (_isValid)
    {
        throw std::logic_error("There is no error in this Expected<void, E>");
    }
    return _error;
}

template <typename E>
const E& Expected<void, E>::getError() const
{
    if (_isValid)
    {
        throw std::logic_error("There is no error in this Expected<void, E>");
    }
    return _error;
}
// ====================== end Expected<void, E> ============================================
