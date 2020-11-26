#pragma once

#include <stdint.h>

class SmallPod16 {
public:
  SmallPod16();

  int16_t getValue() const;

private:
  int16_t _ = 1;
};

class SmallPod32 {
public:
  SmallPod32();

  int32_t getValue() const;

private:
  int32_t _ = 2;
};

class SmallWithVirtualDestructor {
public:
  SmallWithVirtualDestructor();
  virtual ~SmallWithVirtualDestructor();

  int16_t getValue() const;

private:
  int16_t _ = 3;
};

#pragma pack(1)
class SmallUnaligned {
public:
  SmallUnaligned();

  int16_t getValue() const;

private:
  int16_t _1 = 4;
  char _2[3];
};
#pragma pack()

class Large {
public:
  Large();

  int64_t getValue() const;

private:
  int64_t _1 = 5;
  int64_t _2 = 0;
  int64_t _3 = 0;
  int64_t _4 = 0;
  int64_t _5 = 0;
  int64_t _6 = 0;
  int64_t _7 = 0;
  int64_t _8 = 0;
  int8_t _9 = 0;
};

class ValueReturner {
public:
  ValueReturner();

  SmallPod16 getSmallPod16() const;
  SmallPod32 getSmallPod32() const;

  SmallWithVirtualDestructor getSmallWithVirtualDestructor() const;
  SmallUnaligned getSmallUnaligned() const;
  Large getLarge() const;
};
