cmake_minimum_required(VERSION 3.10)
project(utils LANGUAGES CXX)

set(INCLUDES
    Exception.h
    Strings.h
    Env.h
    Paths.h
    LambdaTraits.h
)

set(SOURCES
    Exception.cpp
    Strings.cpp
    Env.cpp
    Paths.cpp
)

add_library(${PROJECT_NAME} OBJECT
    ${INCLUDES}
    ${SOURCES}
)

target_link_libraries(${PROJECT_NAME})


