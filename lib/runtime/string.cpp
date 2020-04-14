#include <cstdint>
#include <cstring>
#include "string.h"
#include "gc.h"

extern "C" {

string string__concat(string a, string b) {
  auto length = a.length + b.length;
  auto* data = static_cast<uint8_t*>(gc__allocate(length));
  memcpy(data, a.data, a.length);
  memcpy(data + a.length, b.data, b.length);
  return { data, length };
}

bool string__compare(string a, string b) {
  return strcmp((const char*)a.data, (const char*)b.data) == 0;
}

uint32_t string__length(string s) {
  return s.length;
}

}
