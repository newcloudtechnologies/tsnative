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
