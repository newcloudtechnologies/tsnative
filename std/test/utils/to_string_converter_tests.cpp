/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"

#include "std/private/lambda_to_function_ptr.h"
#include "std/private/to_string_converter.h"

class ToStringConverterTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(ToStringConverterTest, EmptyObject)
{
    auto* o = new test::Object();
    EXPECT_EQ(ToStringConverter::convert(o), "{}");
}

TEST_F(ToStringConverterTest, Boolean)
{
    auto* f = new test::Boolean(false);
    EXPECT_EQ(ToStringConverter::convert(f), "false");

    auto* t = new test::Boolean(true);
    EXPECT_EQ(ToStringConverter::convert(t), "true");
}

TEST_F(ToStringConverterTest, Number)
{
    auto* zero = new test::Number(0.0);
    EXPECT_EQ(ToStringConverter::convert(zero), "0");

    auto* someNum = new test::Number(-100500);
    EXPECT_EQ(ToStringConverter::convert(someNum), "-100500");

    auto* doubleNum = new test::Number(5.4);
    EXPECT_EQ(ToStringConverter::convert(doubleNum), "5.4");

    EXPECT_EQ(ToStringConverter::convert(test::Number::NaN()), "NaN");
}

TEST_F(ToStringConverterTest, Null)
{
    auto* null = test::Null::instance();
    EXPECT_EQ(ToStringConverter::convert(null), "null");
}

TEST_F(ToStringConverterTest, Undefined)
{
    auto* undef = test::Undefined::instance();
    EXPECT_EQ(ToStringConverter::convert(undef), "undefined");
}

TEST_F(ToStringConverterTest, ObjectWithProps)
{
    auto* o = new test::Object();
    o->set("prop_obj", new test::Object());
    o->set("prop_str", new test::String("abcd"));
    o->set("prop_num", new test::Number(55));
    o->set("prop_bool", new test::Boolean(true));

    EXPECT_EQ(ToStringConverter::convert(o),
              "{\n"
              "  \"prop_obj\": {}\n"
              "  \"prop_str\": \"abcd\"\n"
              "  \"prop_num\": 55\n"
              "  \"prop_bool\": true\n"
              "}");
}

TEST_F(ToStringConverterTest, ObjectWithNestedObjects)
{
    auto* o = new test::Object();
    auto* nested = new test::Object();
    auto* nestedInNested = new test::Object();

    nestedInNested->set("el", new test::Object());

    nested->set("nestedInNested", nestedInNested);
    nested->set("b", new Boolean(false));

    o->set("nested", nested);
    o->set("some_value", new test::Object());

    EXPECT_EQ(ToStringConverter::convert(o),
              "{\n"
              "  \"nested\": {\n"
              "    \"nestedInNested\": {\n"
              "      \"el\": {}\n"
              "    }\n"
              "    \"b\": false\n"
              "  }\n"
              "  \"some_value\": {}\n"
              "}");
}

TEST_F(ToStringConverterTest, ObjectSuper)
{
    auto* base = new test::Object();

    auto* derived = new test::Object();
    derived->set("parent", base);

    EXPECT_EQ(ToStringConverter::convert(derived), "{}");

    base->set("el", new Boolean(true));
    derived->set("prop", new test::Boolean(false));

    EXPECT_EQ(ToStringConverter::convert(derived),
              "{\n"
              "  \"prop\": false\n"
              "  \"el\": true\n"
              "}");
}

TEST_F(ToStringConverterTest, SameObjectInChilds)
{
    auto* obj = new test::Object();
    obj->set("prop", new Boolean(true));

    auto* objToTest = new test::Object();
    objToTest->set("1", obj);
    objToTest->set("2", obj);

    EXPECT_EQ(ToStringConverter::convert(objToTest),
              "{\n"
              "  \"1\": {\n"
              "    \"prop\": true\n"
              "  }\n"
              "  \"2\": {\n"
              "    \"prop\": true\n"
              "  }\n"
              "}");
}

TEST_F(ToStringConverterTest, CircularDependency)
{
    auto* first = new test::Object();
    auto* second = new test::Object();

    first->set("toSecond", second);
    second->set("toFirst", first);

    auto res = ToStringConverter::convert(first);

    EXPECT_TRUE(res.find("<Error! Found circular structure>") != std::string::npos);
}

TEST_F(ToStringConverterTest, Array)
{
    auto* array = new test::Array<Object*>();
    EXPECT_EQ(ToStringConverter::convert(array), "[]");

    auto* object = new test::Object();
    object->set("el", new test::Boolean(true));
    array->push(object);
    array->push(new test::Object());
    array->push(new test::Object());

    EXPECT_EQ(ToStringConverter::convert(array),
              "[{\n"
              "  \"el\": true\n"
              "}, {}, {}]");
}

TEST_F(ToStringConverterTest, ArrayWithSameObject)
{
    auto* array = new test::Array<Object*>();
    EXPECT_EQ(ToStringConverter::convert(array), "[]");

    auto* num = new Number(1234);
    array->push(num);
    array->push(num);
    array->push(num);

    EXPECT_EQ(ToStringConverter::convert(array), "[1234, 1234, 1234]");
}

TEST_F(ToStringConverterTest, Tuple)
{
    auto* tuple = new test::Tuple();
    EXPECT_EQ(ToStringConverter::convert(tuple), "[]");

    tuple->push(new test::Object());
    tuple->push(new test::Boolean(true));
    EXPECT_EQ(ToStringConverter::convert(tuple), "[{}, true]");
}

TEST_F(ToStringConverterTest, String)
{
    auto* empty = new test::String("");
    EXPECT_EQ(ToStringConverter::convert(empty), "\"\"");

    auto* str = new test::String("Abc d");
    EXPECT_EQ(ToStringConverter::convert(str), "\"Abc d\"");
}

TEST_F(ToStringConverterTest, Union)
{
    auto* empty = new test::Union();
    EXPECT_EQ(ToStringConverter::convert(empty), "Union: undefined");

    auto* un = new test::Union(new test::String("****"));
    EXPECT_EQ(ToStringConverter::convert(un), "Union: \"****\"");
}

TEST_F(ToStringConverterTest, Map)
{
    auto* map = new test::Map<test::Number*, test::Boolean*>();
    EXPECT_EQ(ToStringConverter::convert(map), "Map (0) {}");

    map->set(new test::Number(1), new test::Boolean(true));
    map->set(new test::Number(-8), new test::Boolean(false));

    EXPECT_EQ(ToStringConverter::convert(map), "Map (2) {1=>true, -8=>false}");
}

TEST_F(ToStringConverterTest, Set)
{
    auto* set = new test::Set<test::Number*>();
    EXPECT_EQ(ToStringConverter::convert(set), "Set (0) {}");

    set->add(new test::Number(1));
    set->add(new test::Number(-8));

    EXPECT_EQ(ToStringConverter::convert(set), "Set (2) {1, -8}");
}

TEST_F(ToStringConverterTest, Promise)
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

    EXPECT_EQ(ToStringConverter::convert(promise), "Promise. Not ready");

    auto resolvedProm = promise->resolve(new test::Union());
    EXPECT_EQ(ToStringConverter::convert(resolvedProm), "Promise. Result: undefined");

    free(env[0]);
}

TEST_F(ToStringConverterTest, Date)
{
    auto date = new Date(new test::String("1995-12-17T07:24:00"));
    auto converted = ToStringConverter::convert(date);

    // Need to fix https://jira.ncloudtech.ru:8090/browse/TSN-456

    // // date formatting is platform dependent
    // EXPECT_TRUE(converted.find("95") != std::string::npos);
    // EXPECT_TRUE(converted.find("17") != std::string::npos);
    EXPECT_TRUE(converted.find("Date: ") != std::string::npos);
}