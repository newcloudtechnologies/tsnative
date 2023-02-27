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

template <typename... F>
struct Visitor;

template <typename F1>
struct Visitor<F1> : public F1
{
    Visitor(const F1&& f1)
        : F1{f1}
    {
    }
    Visitor(F1&& f1)
        : F1{std::move(f1)}
    {
    }

    using F1::operator();
};

template <typename F1, typename... F>
struct Visitor<F1, F...> : public F1, public Visitor<F...>
{
    Visitor(const F1& f1, F&&... f)
        : F1{f1}
        , Visitor<F...>{std::forward<F>(f)...}
    {
    }
    Visitor(F1&& f1, F&&... f)
        : F1{std::move(f1)}
        , Visitor<F...>{std::forward<F>(f)...}
    {
    }

    using F1::operator();
};

template <typename... F>
auto makeVisitors(F&&... f)
{
    return Visitor<F...>(std::forward<F>(f)...);
}
