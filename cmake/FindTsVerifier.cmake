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

get_filename_component(TS_VERIFIER_DIR
                       "${CMAKE_CURRENT_LIST_DIR}/../bin"
                       ABSOLUTE)

set(TS_VERIFIER "${TS_VERIFIER_DIR}/verifier${CMAKE_EXECUTABLE_SUFFIX}")

find_package_handle_standard_args(TsVerifier DEFAULT_MSG
  TS_VERIFIER)

