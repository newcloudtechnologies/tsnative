#pragma once

class Object;

template <class T>
T tryCast(Object* obj) noexcept
{
    return dynamic_cast<T>(obj);
}

template <class T>
const T tryCast(const Object* obj) noexcept
{
    return dynamic_cast<const T>(obj);
}