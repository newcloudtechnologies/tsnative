#pragma once

#include <string>

class BooleanPrivate
{
public:
    virtual ~BooleanPrivate() = default;

    virtual bool value() const = 0;
    virtual void setValue(bool value) = 0;

    virtual std::string toString() const = 0;
};
