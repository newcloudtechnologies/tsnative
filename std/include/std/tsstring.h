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

#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsboolean.h"
#include "std/tsobject.h"

#include <ostream>
#include <string>

template <typename T>
class Array;
class Number;
class Union;

class StringPrivate;
class GCStringConverter;

// add TS_DECLARE to template specialization
template class TS_DECLARE Iterable<String*>;

class TS_DECLARE String : public Iterable<String*>
{
public:
    TS_METHOD TS_SIGNATURE("constructor(initializer?: any)") String();
    String(Number* d);
    String(const std::string& s);
    String(const char* s);

protected:
    ~String() override;

public:
    TS_METHOD TS_GETTER Number* length() const;
    TS_METHOD String* concat(String* other) const;

    TS_METHOD TS_SIGNATURE("startsWith(string: string, start?: number): boolean") Boolean* startsWith(
        String* other, Union* maybeStartIndex) const;
    TS_METHOD TS_SIGNATURE("endsWith(string: string, start?: number): boolean") Boolean* endsWith(
        String* other, Union* maybeStartIndex) const;

    TS_METHOD TS_SIGNATURE("split(pattern: string, limit?: number): string[]") Array<String*>* split(
        String* pattern, Union* maybeLimit) const;

    TS_METHOD TS_SIGNATURE("slice(start: number, end?: number): string") String* slice(Number* startIndex,
                                                                                       Union* maybeEndIndex) const;

    TS_METHOD String* trim() const;

    TS_METHOD String* toLowerCase() const;
    TS_METHOD String* toUpperCase() const;

    TS_METHOD TS_SIGNATURE("substring(start: number, end?: number): string") String* substring(
        Number* startIndex, Union* maybeEndIndex) const;

    TS_METHOD TS_SIGNATURE("includes(pattern: string, start?: number): boolean") Boolean* includes(
        String* pattern, Union* maybeStartIndex) const;

    TS_METHOD String* replace(String* substr, String* newSubstr) const;

    TS_METHOD TS_SIGNATURE("indexOf(pattern: string, start?: number): number") Number* indexOf(
        String* pattern, Union* maybeStartIndex) const;
    TS_METHOD TS_SIGNATURE("lastIndexOf(pattern: string, start?: number): number") Number* lastIndexOf(
        String* pattern, Union* maybeStartIndex) const;

    TS_METHOD Boolean* equals(Object* other) const override;

    String* operator[](Number* index) const;
    String* operator[](size_t index) const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    const std::string& cpp_str() const;

    TS_METHOD TS_SIGNATURE("[Symbol.iterator](): StringIterator<string>")
        TS_DECORATOR("MapsTo('iterator')") IterableIterator<String*>* iterator() override;

    TS_METHOD String* clone() const;

    Array<String*>* getKeysArray() const override;

private:
    StringPrivate* _d = nullptr;

private:
    friend class GCStringConverter;
};

TS_CODE("// @ts-ignore\n"
        "declare type string = String;\n");

inline std::ostream& operator<<(std::ostream& os, const String* s)
{
    os << s->cpp_str();
    return os;
}
