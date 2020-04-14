#include <iostream>
#include "gc.h"
#include "string.h"

#include "console.h"

template <typename T>
class Array
{
  T *elements;
  uint32_t size;
  uint32_t capacity;

public:
  Array() : elements(nullptr), size(0), capacity(0) {}

  double length() const
  {
    return static_cast<double>(size);
  }

  void push(T value)
  {
    if (size == capacity)
    {
      expand();
    }

    elements[size] = value;
    size++;
  }

  // TODO: Return 'undefined' if index is out of bounds.
  T *operator[](double index)
  {
    if (static_cast<uint32_t>(index) < size)
    {
      return &elements[static_cast<uint32_t>(index)];
    }

    printf("Array index %lu is out of bounds, array size is %lu.\n", (unsigned long)index, (unsigned long)size);
    abort();
  }

  void print() const
  {
    for (size_t i = 0; i < size; ++i) {
      std::cout << elements[i] << std::endl;
    }
  }

private:
  void expand()
  {
    reserve(capacity ? capacity * 2 : 1);
  }

  void reserve(uint32_t minCapacity)
  {
    if (minCapacity > capacity)
    {
      elements = static_cast<T *>(gc__reallocate(elements, sizeof(T) * minCapacity));
      capacity = minCapacity;
    }
  }
};

template class Array<double>;
template class Array<bool>;
template class Array<string>;

DECLARE_PRINT_FN(Array<double>*, [](Array<double>* arr) {
  arr->print();
});

DECLARE_PRINT_FN(Array<bool>*, [](Array<bool>* arr) {
  arr->print();
});

DECLARE_PRINT_FN(Array<string>*, [](Array<string>* arr) {
  arr->print();
});