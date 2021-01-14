#pragma once

namespace cpp {

class Point {
public:
  Point(double x, double y);

  double x() const;
  double y() const;

  void setX(double x);
  void setY(double y);

  Point clone() const;

private:
  double _x;
  double _y;
};

} // namespace cpp