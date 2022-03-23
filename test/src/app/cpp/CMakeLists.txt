#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

set (EXTS_TARGET cpp)  # test_app_ext

include(TsDeclaratorUtils)

find_package(StdLib REQUIRED)

set (SOURCES "${CMAKE_CURRENT_LIST_DIR}/Ext.cpp")
set (HEADERS "${CMAKE_CURRENT_LIST_DIR}/Ext.h")

ts_build_extension(${EXTS_TARGET}
    SOURCES ${SOURCES} ${HEADERS}
    INCLUDE_DIRECTORIES ${CMAKE_CURRENT_SOURCE_DIR} ${StdLib_INCLUDE_DIR}
)
