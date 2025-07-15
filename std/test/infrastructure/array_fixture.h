#include "../infrastructure/object_wrappers.h"
#include "std/tsarray.h"

#include <gtest/gtest.h>
#include <string>
#include <vector>

class ArrayFixture : public test::GlobalTestAllocatorFixture
{
public:
    auto* getEmptyNumberArray() const
    {
        auto* numbers = new test::Array<test::Number*>();
        return numbers;
    }

    auto* getFilledNumberArray() const
    {
        auto* numbers = new test::Array<test::Number*>();
        numbers->push(new test::Number(10));
        numbers->push(new test::Number(20));
        numbers->push(new test::Number(30));
        numbers->push(new test::Number(40));
        return numbers;
    }

    auto* getUnorderedNumberArray() const
    {
        auto* numbers = new test::Array<test::Number*>();
        numbers->push(new test::Number(44));
        numbers->push(new test::Number(16));
        numbers->push(new test::Number(32));
        numbers->push(new test::Number(78));
        numbers->push(new test::Number(1));
        numbers->push(new test::Number(36));
        numbers->push(new test::Number(8));
        numbers->push(new test::Number(17));
        numbers->push(new test::Number(6));
        numbers->push(new test::Number(12));
        return numbers;
    }

    auto* getUnorderedStringArray() const
    {
        auto* strings = new test::Array<test::String*>();
        strings->push(new test::String("red"));
        strings->push(new test::String("green"));
        strings->push(new test::String("yellow"));
        strings->push(new test::String("white"));
        strings->push(new test::String("blue"));
        strings->push(new test::String("black"));
        strings->push(new test::String("pink"));
        strings->push(new test::String("brown"));
        strings->push(new test::String("cyan"));
        strings->push(new test::String("gray"));
        strings->push(new test::String("magenta"));
        return strings;
    }
};

template <typename R, template <typename> class A>
struct Serializer
{
    template <typename T>
    static std::vector<R> toVector(const A<T*>* array)
    {
        std::vector<R> result;

        for (const auto& it : array->toStdVector())
        {
            result.push_back(static_cast<R>(it->unboxed()));
        }

        return result;
    }
};

template <template <typename> class A>
struct Serializer<std::string, A>
{
    template <typename T>
    static std::vector<std::string> toVector(const A<T*>* array)
    {
        std::vector<std::string> result;

        for (const auto& it : array->toStdVector())
        {
            result.push_back(it->cpp_str());
        }

        return result;
    }
};

using IntArray = Serializer<int, test::Array>;
using StringArray = Serializer<std::string, test::Array>;
