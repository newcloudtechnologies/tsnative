#pragma once

#include <std-typescript-llvm/include/tsclosure.h>

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
