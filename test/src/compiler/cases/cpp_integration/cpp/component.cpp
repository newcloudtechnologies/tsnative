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
