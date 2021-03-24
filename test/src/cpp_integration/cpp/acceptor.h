#pragma once

#include <cstdint>

namespace cpp {

class Acceptor {
public:
  Acceptor();

  int8_t sumInt8(int8_t lhs, int8_t rhs) const;
  int16_t sumInt16(int16_t lhs, int16_t rhs) const;
  int32_t sumInt32(int32_t lhs, int32_t rhs) const;
  int64_t sumInt64(int64_t lhs, int64_t rhs) const;

  uint8_t sumUInt8(uint8_t lhs, uint8_t rhs) const;
  uint16_t sumUInt16(uint16_t lhs, uint16_t rhs) const;
  uint32_t sumUInt32(uint32_t lhs, uint32_t rhs) const;
  uint64_t sumUInt64(uint64_t lhs, uint64_t rhs) const;
};

} // namespace cpp