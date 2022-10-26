/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include <std/tsboolean.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

namespace cpp_integration IS_TS_MODULE
{
namespace exts IS_TS_NAMESPACE
{

class TS_EXPORT FileInfo_t : public Object
{
private:
    std::string _path;
    std::string _name;
    bool _isFolder;

public:
    TS_METHOD explicit FileInfo_t(String* path, String* name, Boolean* isFolder);
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
