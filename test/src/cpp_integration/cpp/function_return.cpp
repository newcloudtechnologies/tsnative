#include "function_return.h"

SmallPod16::SmallPod16() {}
int16_t SmallPod16::getValue() const { return _; }

SmallPod32::SmallPod32() {}
int32_t SmallPod32::getValue() const { return _; }

SmallWithVirtualDestructor::SmallWithVirtualDestructor() {}
SmallWithVirtualDestructor::~SmallWithVirtualDestructor() {}

int16_t SmallWithVirtualDestructor::getValue() const { return _; }

SmallUnaligned::SmallUnaligned() {}
int16_t SmallUnaligned::getValue() const { return _1; }

Large::Large() {}
int64_t Large::getValue() const { return _1; }

ValueReturner::ValueReturner() {}

SmallPod16 ValueReturner::getSmallPod16() const { return {}; }
SmallPod32 ValueReturner::getSmallPod32() const { return {}; }

SmallWithVirtualDestructor
ValueReturner::getSmallWithVirtualDestructor() const {
  return {};
}
SmallUnaligned ValueReturner::getSmallUnaligned() const { return {}; }
Large ValueReturner::getLarge() const { return {}; }
