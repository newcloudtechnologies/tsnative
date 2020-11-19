#pragma once

class Point {
public:
  Point(double x, double y);

  double x() const;
  double y() const;

private:
  double _x;
  double _y;
};