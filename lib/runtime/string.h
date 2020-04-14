#pragma once

#include <cstdint>
#include <ostream>

extern "C" {

struct string {
  uint8_t* data;
  uint32_t length;
};

}

inline std::ostream& operator<<(std::ostream& os, const string& s)
{
    os << s.data << std::endl;
    return os;
}
