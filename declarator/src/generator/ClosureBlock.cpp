/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "ClosureBlock.h"

namespace generator
{

namespace ts
{

ClosureBlock::ClosureBlock(const std::string& name)
    : MethodBlock(Type::CLOSURE, name, "void", false)
{
}

} // namespace ts

} // namespace generator