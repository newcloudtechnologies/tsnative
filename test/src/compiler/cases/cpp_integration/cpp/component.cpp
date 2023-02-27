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

#include "component.h"

#include <std/tsnumber.h>

#include <iostream>

using namespace cpp_integration;

Component::Component()
{
    set("m", new Number(222));
}

void Component::test()
{
    std::cout << "Component::test" << std::endl;
}

void Component::render()
{
    std::cout << "default Component::render" << std::endl;
}

AnotherWidget::AnotherWidget()
{
    std::cout << "AnotherWidget::AnotherWidget" << std::endl;
}

Handler::Handler()
{
}

void Handler::handle(Component* c)
{
    c->render();
    c->draw();
}
