#pragma once

template <typename... F>
struct Visitor;

template <typename F1>
struct Visitor<F1>: public F1 {
    Visitor(const F1 && f1): F1{f1} {}
    Visitor(F1 && f1): F1{std::move(f1)} {}

    using F1::operator();
};

template <typename F1, typename... F>
struct Visitor<F1, F...>: public F1, public Visitor<F...> {
    Visitor(const F1 & f1, F &&... f): F1{f1}, Visitor<F...>{std::forward<F>(f)...} {}
    Visitor(F1 && f1, F &&... f): F1{std::move(f1)}, Visitor<F...>{std::forward<F>(f)...} {}

    using F1::operator();
};

template <typename... F>
auto makeVisitors(F &&... f) {
    return Visitor<F...>(std::forward<F>(f)...);
}
