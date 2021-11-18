#
# Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
#
# You can not use the contents of the file in any way without
# Laboratory of Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
# at http://cloudtechlab.ru/#contacts
#

cmake_minimum_required(VERSION 3.10)

include(FindPackageHandleStandardArgs)

get_filename_component(TS_COMPILER_DIR
                       "${CMAKE_CURRENT_LIST_DIR}/../pkg"
                       ABSOLUTE)

get_filename_component(TS_COMPILER_CMAKE_DIR
                       "${CMAKE_CURRENT_LIST_DIR}/../cmake"
                       ABSOLUTE)

set(TS_COMPILER "${TS_COMPILER_DIR}/compiler${CMAKE_EXECUTABLE_SUFFIX}")

set(TS_COMPILER_CMAKE_UTILS "${TS_COMPILER_CMAKE_DIR}/utils.cmake")

find_package_handle_standard_args(TsCompiler DEFAULT_MSG
  TS_COMPILER TS_COMPILER_CMAKE_UTILS)



