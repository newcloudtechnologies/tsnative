#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

# TODO: hardcore for correct work on Windows build with MinGW GCC (CMake default hard use only MSVC)
if(WIN32)
    set(CMAKE_GENERATOR "MinGW Makefiles" CACHE INTERNAL "" FORCE)
endif()
