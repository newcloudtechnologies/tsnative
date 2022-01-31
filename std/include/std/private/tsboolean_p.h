#pragma once

class BooleanPrivate
{
public:
    BooleanPrivate();
    BooleanPrivate(bool value);

    bool value() const;
    void setValue(bool value);

private:
    bool _value = false;
};
