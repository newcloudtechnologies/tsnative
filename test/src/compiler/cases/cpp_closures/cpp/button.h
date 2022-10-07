#pragma once

#include <std/tsobject.h>

class Point;
class TSClosure;

class Button : public Object
{
public:
  Button();

  void onClicked(TSClosure *);
  void onClickedWithPoint(TSClosure *);

  void click() const;
  void clickWithPoint(Point *) const;
};
