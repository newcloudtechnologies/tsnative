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

#include "fileinfo.h"

namespace cpp_integration
{
namespace exts
{

FileInfo_t::FileInfo_t(String* path, String* name, Boolean* isFolder)
    : _path(path->cpp_str())
    , _name(name->cpp_str())
    , _isFolder(false)
{
}

} // namespace exts
} // namespace cpp_integration
