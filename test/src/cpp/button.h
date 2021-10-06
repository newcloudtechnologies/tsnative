#pragma once

#include <std/tsclosure.h>

class Point;

class Button {
public:
  Button();

  void onClicked(TSClosure *);
  void onClickedWithPoint(TSClosure *);

  void click() const;
  void clickWithPoint(Point *) const;

private:
  TSClosure *onClickedHandler = nullptr;
  TSClosure *onClickedWithPointHandler = nullptr;
};
