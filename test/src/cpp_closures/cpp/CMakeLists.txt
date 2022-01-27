#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

set (EXTS_TARGET cpp_exts)

set(INCLUDES
    button.h
    point.h
)

set(SOURCES
    button.cpp
    point.cpp
)

list(TRANSFORM SOURCES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")
list(TRANSFORM INCLUDES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")

ts_build_extension ( ${EXTS_TARGET}
    SOURCES ${SOURCES} ${INCLUDES}
    INCLUDE_PATHS ${CMAKE_CURRENT_LIST_DIR}
)
