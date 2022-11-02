/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include "std/private/tsnumber_p.h"

class NumberCXXBuiltinPrivate : public NumberPrivate
{
public:
    NumberCXXBuiltinPrivate() = default;
    NumberCXXBuiltinPrivate(double v);
    ~NumberCXXBuiltinPrivate() = default;

    double add(double other) const override;
    double sub(double other) const override;
    double mul(double other) const override;
    double div(double other) const override;
    double mod(double other) const override;

    void addInplace(double other) override;
    void subInplace(double other) override;
    void mulInplace(double other) override;
    void divInplace(double other) override;
    void modInplace(double other) override;

    void negate() override;

    void prefixIncrement() override;
    double postfixIncrement() override;

    void prefixDecrement() override;
    double postfixDecrement() override;

    uint64_t bitwiseAnd(uint64_t other) const override;
    uint64_t bitwiseOr(uint64_t other) const override;
    uint64_t bitwiseXor(uint64_t other) const override;
    uint64_t bitwiseLeftShift(uint64_t other) const override;
    uint64_t bitwiseRightShift(uint64_t other) const override;

    void bitwiseAndInplace(uint64_t other) override;
    void bitwiseOrInplace(uint64_t other) override;
    void bitwiseXorInplace(uint64_t other) override;
    void bitwiseLeftShiftInplace(uint64_t other) override;
    void bitwiseRightShiftInplace(uint64_t other) override;

    bool equals(double other) const override;
    bool lessThan(double other) const override;
    bool lessEqualsThan(double other) const override;
    bool greaterThan(double other) const override;
    bool greaterEqualsThan(double other) const override;

    bool toBool() const override;

    double unboxed() const override;

private:
    double _value = 0.0;
};
