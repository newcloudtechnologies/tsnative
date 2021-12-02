#include "button.h"
#include "point.h"

Button::Button() {}

void Button::onClicked(TSClosure *handler) { this->onClickedHandler = handler; }

void Button::onClickedWithPoint(TSClosure *handler) {
  this->onClickedWithPointHandler = handler;
}

void Button::click() const { (*onClickedHandler)(); }

void Button::clickWithPoint(Point *point) const {
  onClickedWithPointHandler->setEnvironmentElement(point, 0);
  (*onClickedWithPointHandler)();
}
