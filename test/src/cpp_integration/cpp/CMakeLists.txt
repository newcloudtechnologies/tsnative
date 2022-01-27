#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

# TODO: Create intermediate lib that acts as an extesion and links this one.
# This way we won't need to recompile this lib for every cpp_integration test

set (EXTS_TARGET cpp_integration_exts)

set(INCLUDES
    aggregate.h
    rect.h
    acceptor.h
    point.h
    printable.h
    dummy_base.h
    inheritance.h
)

set(SOURCES
    aggregate.cpp
    nested_namespaces.cpp
    point.cpp
    rect.cpp
    acceptor.cpp
    generics.cpp
    printable.cpp
    dummy_base.cpp
    inheritance.cpp
    component.cpp
)

list(TRANSFORM SOURCES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")
list(TRANSFORM INCLUDES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")

ts_build_extension ( ${EXTS_TARGET}
    SOURCES ${SOURCES} ${INCLUDES}
    INCLUDE_PATHS ${CMAKE_CURRENT_LIST_DIR}
)
