#include <TS.h>

#include <std/tsobject.h>

namespace cpp_integration IS_TS_MODULE
{
namespace N2 IS_TS_NAMESPACE
{

class TS_EXPORT Clazz : public Object
{
public:
    TS_METHOD Clazz();
};

TS_EXPORT void takesClazz(Clazz* c);

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE