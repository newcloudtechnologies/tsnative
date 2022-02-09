#pragma once

class Number;
class String;

template <typename T>
class TSOptional;

namespace cpp
{
    class WithOptionalArgs
    {
    public:
        WithOptionalArgs(Number *n, TSOptional<String *> *s);

        void setValues(TSOptional<Number *> *n, TSOptional<String *> *s);

        Number *getNumber() const;
        String *getString() const;

        Number* getDefaultNumber() const;
        String* getDefaultString() const;

    private:
        Number *_n = nullptr;
        String *_s = nullptr;
    };
} // namespace cpp
