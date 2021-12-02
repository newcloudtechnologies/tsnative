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

get_filename_component(Declarator_INCLUDE_DIR "${CMAKE_CURRENT_LIST_DIR}/../declarator/include" REALPATH)

find_program(Declarator_BIN
  NAME declarator declarator.exe
  PATHS
    ${CMAKE_CURRENT_LIST_DIR}/../bin
    ${CMAKE_CURRENT_LIST_DIR}/../bin/Release
    ${CMAKE_CURRENT_LIST_DIR}/../bin/Debug
)

find_package_handle_standard_args(Declarator DEFAULT_MSG
  Declarator_BIN Declarator_INCLUDE_DIR)

message(STATUS "Declarator found: ${Declarator_BIN}")
