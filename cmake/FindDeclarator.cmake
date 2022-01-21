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

get_filename_component(TS_DECLARATOR_INCLUDE_DIR "${CMAKE_CURRENT_LIST_DIR}/../declarator/include" REALPATH)
get_filename_component(TS_DECLARATOR_BIN_DIR "${CMAKE_CURRENT_LIST_DIR}/../bin" REALPATH)

set(TS_DECLARATOR "${TS_DECLARATOR_BIN_DIR}/declarator${CMAKE_EXECUTABLE_SUFFIX}")

find_package_handle_standard_args(Declarator DEFAULT_MSG
    TS_DECLARATOR TS_DECLARATOR_INCLUDE_DIR)

message(STATUS "Declarator INCLUDE dir: ${TS_DECLARATOR_INCLUDE_DIR}")
message(STATUS "Declarator found: ${TS_DECLARATOR}")
