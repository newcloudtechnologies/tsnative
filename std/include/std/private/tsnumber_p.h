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

#include <cstdint>

class NumberPrivate
{
public:
    virtual ~NumberPrivate() = default;

    virtual double add(double other) const = 0;
    virtual double sub(double other) const = 0;
    virtual double mul(double other) const = 0;
    virtual double div(double other) const = 0;
    virtual double mod(double other) const = 0;

    virtual void addInplace(double other) = 0;
    virtual void subInplace(double other) = 0;
    virtual void mulInplace(double other) = 0;
    virtual void divInplace(double other) = 0;
    virtual void modInplace(double other) = 0;

    virtual void negate() = 0;

    virtual void prefixIncrement() = 0;
    virtual double postfixIncrement() = 0;

    virtual void prefixDecrement() = 0;
    virtual double postfixDecrement() = 0;

    virtual uint64_t bitwiseAnd(uint64_t other) const = 0;
    virtual uint64_t bitwiseOr(uint64_t other) const = 0;
    virtual uint64_t bitwiseXor(uint64_t other) const = 0;
    virtual uint64_t bitwiseLeftShift(uint64_t other) const = 0;
    virtual uint64_t bitwiseRightShift(uint64_t other) const = 0;

    virtual void bitwiseAndInplace(uint64_t other) = 0;
    virtual void bitwiseOrInplace(uint64_t other) = 0;
    virtual void bitwiseXorInplace(uint64_t other) = 0;
    virtual void bitwiseLeftShiftInplace(uint64_t other) = 0;
    virtual void bitwiseRightShiftInplace(uint64_t other) = 0;

    virtual bool equals(double other) const = 0;
    virtual bool lessThan(double other) const = 0;
    virtual bool lessEqualsThan(double other) const = 0;
    virtual bool greaterThan(double other) const = 0;
    virtual bool greaterEqualsThan(double other) const = 0;

    virtual bool toBool() const = 0;

    virtual double unboxed() const = 0;
};
