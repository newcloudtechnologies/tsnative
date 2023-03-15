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

#include <algorithm>
#include <string>
#include <tuple>
#include <unordered_map>

namespace utils
{

namespace details
{
template <class Tuple, std::size_t I, class = void>
struct DoForEachInTuple
{
    template <class UnaryFunction>
    static void apply(Tuple&& tp, UnaryFunction& f)
    {
        f(std::get<I>(std::forward<Tuple>(tp)));
        DoForEachInTuple<Tuple, I + 1u>::apply(std::forward<Tuple>(tp), f);
    }
};

template <class Tuple, std::size_t I>
struct DoForEachInTuple<Tuple, I, typename std::enable_if_t<I == std::tuple_size<typename std::decay_t<Tuple>>::value>>
{
    template <class UnaryFunction>
    static void apply(Tuple&&, UnaryFunction&)
    {
    }
};
} // namespace details

template <class Tuple, class UnaryFunction>
void forEachInTuple(Tuple&& tp, UnaryFunction f)
{
    details::DoForEachInTuple<Tuple, 0u>::apply(std::forward<Tuple>(tp), f);
}

template <typename Key, typename T, typename Compare, typename Alloc, typename Pred>
void eraseIf(std::unordered_map<Key, T, Compare, Alloc>& c, Pred pred)
{
    for (auto i = c.begin(), last = c.end(); i != last;)
    {
        if (pred(*i))
        {
            i = c.erase(i);
        }
        else
        {
            ++i;
        }
    }
}

template <typename Container, typename Predicate>
Container filter(const Container& container, Predicate&& predicate)
{
    Container result{};
    std::copy_if(std::cbegin(container), std::cend(container), std::inserter(result, std::end(result)), predicate);

    return result;
}

void replaceAll(std::string& str, const std::string& substrToReplace, const std::string& replacer);

template <class Container, class TEl>
void eraseAll(Container& container, const TEl& element)
{
    container.erase(std::remove(container.begin(), container.end(), element), container.end());
}

} // namespace utils