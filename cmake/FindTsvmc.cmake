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

get_filename_component(Tsvmc_DIR
                       "${CMAKE_CURRENT_LIST_DIR}/../bin"
                       ABSOLUTE)

get_filename_component(Tsvmc_CMAKE_DIR
                       "${CMAKE_CURRENT_LIST_DIR}/../cmake"
                       ABSOLUTE)

set(Tsvmc_COMPILER "${Tsvmc_DIR}/tsvmc")
set(Tsvmc_CMAKE_UTILS "${Tsvmc_CMAKE_DIR}/utils.cmake")

find_package_handle_standard_args(Tsvmc DEFAULT_MSG
  Tsvmc_COMPILER Tsvmc_CMAKE_UTILS)



