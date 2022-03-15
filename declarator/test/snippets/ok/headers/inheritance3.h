/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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

class Entity
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

class TS_EXPORT Event : public Entity
{
public:
    Event() = default;
    TS_METHOD void event();
};

class A
{
    int m_iA;

public:
    A() = default;
    ~A() = default;
    TS_METHOD void a();
};

class B
{
public:
    B() = default;
    ~B() = default;
    TS_METHOD void b();
};

class C
{
public:
    C() = default;
    ~C() = default;
    TS_METHOD void c();
};

class Abc : public A, public B, public C
{
public:
    Abc() = default;
    ~Abc() = default;
    TS_METHOD void abc();
};

class TS_EXPORT CustomEvent : public Event, public Abc
{
public:
    ~CustomEvent() = default;
    TS_METHOD void customEvent();
};
