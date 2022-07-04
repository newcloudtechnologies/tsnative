#include "fileinfo.h"

namespace poc
{
    namespace exts
    {

        FileInfo_t::FileInfo_t(String *path, String *name, Boolean *isFolder)
            : _path(path->cpp_str()), _name(name->cpp_str()), _isFolder(false)
        {
        }

    } // namespace exts
} // namespace poc
