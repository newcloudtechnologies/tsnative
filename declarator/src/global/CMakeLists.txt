#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.10)
project(global LANGUAGES CXX)

set(INCLUDES
    Annotations.h
    Settings.h
)

set(SOURCES
    Settings.cpp
)

add_library(${PROJECT_NAME} OBJECT
    ${INCLUDES}
    ${SOURCES}
)

target_link_libraries(${PROJECT_NAME})
