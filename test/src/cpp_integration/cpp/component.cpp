#include <iostream>

class Component
{
public:
    Component();
    virtual ~Component() = default;

    virtual void draw() = 0;
    virtual void render();

    void test();

private:
    double m = 999;
};

class AnotherWidget
{
public:
    AnotherWidget();
};

class Handler
{
public:
    Handler();

    void handle(Component *c);
};


Component::Component()
{
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

void Handler::handle(Component *c)
{
    c->render();
    c->draw();
}
