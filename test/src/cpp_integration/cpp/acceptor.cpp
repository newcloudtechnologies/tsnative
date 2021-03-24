#include "acceptor.h"

using namespace cpp;

Acceptor::Acceptor() {}

int8_t Acceptor::sumInt8(int8_t lhs, int8_t rhs) const { return lhs + rhs; }
int16_t Acceptor::sumInt16(int16_t lhs, int16_t rhs) const { return lhs + rhs; }
int32_t Acceptor::sumInt32(int32_t lhs, int32_t rhs) const { return lhs + rhs; }
int64_t Acceptor::sumInt64(int64_t lhs, int64_t rhs) const { return lhs + rhs; }

uint8_t Acceptor::sumUInt8(uint8_t lhs, uint8_t rhs) const { return lhs + rhs; }
uint16_t Acceptor::sumUInt16(uint16_t lhs, uint16_t rhs) const {
  return lhs + rhs;
}
uint32_t Acceptor::sumUInt32(uint32_t lhs, uint32_t rhs) const {
  return lhs + rhs;
}
uint64_t Acceptor::sumUInt64(uint64_t lhs, uint64_t rhs) const {
  return lhs + rhs;
}