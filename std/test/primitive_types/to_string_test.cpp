#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"
#include "std/private/lambda_to_function_ptr.h"

class ToStringTest : public test::GlobalTestAllocatorFixture
{
};

template <class T>
void checkStr(const T* obj, const std::string& reference)
{
    auto* str = obj->toString();
    EXPECT_EQ(str->cpp_str(), reference);
}

TEST_F(ToStringTest, Boolean)
{
    auto* f = new test::Boolean(false);
    checkStr(f, "false");

    auto* t = new test::Boolean(true);
    checkStr(t, "true");
}

TEST_F(ToStringTest, Number)
{
    auto* zero = new test::Number(0.0);
    checkStr(zero, "0");

    auto* someNum = new test::Number(-100500);
    checkStr(someNum, "-100500");

    auto* doubleNum = new test::Number(5.4);
    checkStr(doubleNum, "5.4");

    checkStr(test::Number::NaN(), "NaN");
}

TEST_F(ToStringTest, Object)
{
    auto* obj = new test::Object();
    checkStr(obj, "[object Object]");

    obj->set("prop", new test::Boolean(true));
    checkStr(obj, "[object Object]");
}

TEST_F(ToStringTest, Null)
{
    auto* null = test::Null::instance();
    checkStr(null, "null");
}

TEST_F(ToStringTest, Undefined)
{
    auto* undef = test::Undefined::instance();
    checkStr(undef, "undefined");
}

TEST_F(ToStringTest, Array)
{
    auto* array = new test::Array<Object*>();
    checkStr(array, "");

    array->push(new test::Object());
    array->push(new test::Object());
    checkStr(array, "[object Object],[object Object]");
}

TEST_F(ToStringTest, Tuple)
{
    auto* tuple = new test::Tuple();
    checkStr(tuple, "");

    tuple->push(new test::Object());
    tuple->push(new test::Boolean(true));
    checkStr(tuple, "[object Object],true");
}

TEST_F(ToStringTest, String)
{
    auto* empty = new test::String("");
    checkStr(empty, "");

    auto* str = new test::String("Abc d");
    checkStr(str, "Abc d");
}

TEST_F(ToStringTest, Union)
{
    auto* empty = new test::Union();
    checkStr(empty, "undefined");

    auto* un = new test::Union(new test::String("****"));
    checkStr(un, "****");
}

TEST_F(ToStringTest, Map)
{
    auto* map = new test::Map<test::Number*, test::Boolean*>();
    map->set(new test::Number(1), new test::Boolean(true));
    map->set(new test::Number(-8), new test::Boolean(false));
    checkStr(map, "[object Map]");
}

TEST_F(ToStringTest, Set)
{
    auto* map = new test::Set<test::Number*>();
    map->add(new test::Number(1));
    map->add(new test::Number(-8));
    checkStr(map, "[object Set]");
}

TEST_F(ToStringTest, Promise)
{
    void*** env = (void***)malloc(sizeof(void**));
    env[0] = (void**)malloc(sizeof(void**));
    *(env[0]) = new test::Union();

    auto* envLength = new test::Number{1.0};
    auto* numArgs = new test::Number{1.0};
    auto* opt = new test::Number{0.f};

    auto fn = toFunctionPtr([]() { return nullptr; });

    auto closure = new test::Closure{(void*)fn, env, envLength, numArgs, opt};
    auto* promise = new test::Promise(closure);

    checkStr(promise, "[object Promise]");

    free(env[0]);
}

//
// Need to fix https://jira.ncloudtech.ru:8090/browse/TSN-456

// TEST_F(ToStringTest, Date)
// {
//     auto* date = new test::Date(new test::String("1995-12-17T07:24:00"));
//     auto* str = date->toString();

//     // date formatting is platform dependent
//     EXPECT_TRUE(str->cpp_str().find("95") != std::string::npos);
//     EXPECT_TRUE(str->cpp_str().find("17") != std::string::npos);

//     delete static_cast<Object*>(str);
// }
