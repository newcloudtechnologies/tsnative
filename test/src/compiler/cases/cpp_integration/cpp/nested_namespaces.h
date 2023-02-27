/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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