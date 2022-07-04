#pragma once

#include <TS.h>
#include <std/tsstring.h>
#include <std/tsboolean.h>
#include <std/tsobject.h>

namespace poc IS_TS_MODULE
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
            TS_METHOD explicit FileInfo_t(String *path, String *name, Boolean *isFolder);
        };

    } // namespace exts
} // namespace poc
