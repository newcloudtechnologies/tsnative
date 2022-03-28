#pragma once

template <typename... Ts>
class TuplePrivate
{
public:
    virtual ~TuplePrivate() = default;

    virtual int length() const = 0;
    virtual void* operator[](int index) = 0;
};
