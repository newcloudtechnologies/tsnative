#pragma once

#include <TS.h>
#include <std/tsobject.h>

class Entity
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

class TS_EXPORT Event : public Object, public Entity
{
public:
    Event() = default;
    TS_METHOD void event();
};

class Ak
{
public:
    TS_METHOD void ak();
};

class Al
{
public:
    TS_METHOD void al();
};

class Am
{
public:
    TS_METHOD void am();
};

class A : public Ak, public Al, public Am
{
    int m_iA;

public:
    A() = default;
    ~A() = default;
    TS_METHOD void a();
};

class Bk
{
public:
    TS_METHOD void bk();
};

class B : public Bk
{
public:
    B() = default;
    ~B() = default;
    TS_METHOD void b();
};

class Ck
{
public:
    TS_METHOD void ck();
};

class Cl
{
public:
    TS_METHOD void cl();
};

class C : public Ck, public Cl
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

class D
{
public:
    TS_METHOD void d();
};

class E
{
public:
    TS_METHOD void e();
};

class De : public D, public E
{
public:
    De() = default;
    ~De() = default;
    TS_METHOD void de();
};

class TS_EXPORT CustomEvent : public Event, public Abc, public De
{
public:
    ~CustomEvent() = default;
    TS_METHOD void customEvent();
};
