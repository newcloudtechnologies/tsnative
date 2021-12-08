#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.10)

include(FindPackageHandleStandardArgs)

set(CMAKE_FIND_LIBRARY_PREFIXES "lib")
set(CMAKE_FIND_LIBRARY_SUFFIXES ".a" ".so")

find_path(
    StdLib_INCLUDE_DIR
    NAMES std/gc.h std/array.h std/stdstring.h std/tsclosure.h std/console.h std/map.h std/set.h
    PATHS ${CMAKE_CURRENT_LIST_DIR}/../include)

find_library(StdLib_LIBRARY
    NAMES libtsnative-std.a
    PATHS ${CMAKE_CURRENT_LIST_DIR}/../lib)

find_package_handle_standard_args(StdLib DEFAULT_MSG
  StdLib_INCLUDE_DIR StdLib_LIBRARY)

