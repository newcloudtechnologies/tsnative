#include "button.h"
#include "point.h"

#include <std/tsclosure.h>

Button::Button() {}

void Button::onClicked(TSClosure *closure)
{
  set("onClicked", closure);
}

void Button::onClickedWithPoint(TSClosure *closure)
{
  set("onClickedWithPoint", closure);
}

void Button::click() const
{
  auto closure = get<TSClosure *>("onClicked");
  closure->call();
}

void Button::clickWithPoint(Point *point) const
{
  auto closure = get<TSClosure *>("onClickedWithPoint");

  closure->setEnvironmentElement(point, 0);
  closure->call();
}
