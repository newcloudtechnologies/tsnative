# TODO: hardcore for correct work on Windows build with MinGW GCC (CMake default hard use only MSVC)
if(WIN32)
    set(CMAKE_GENERATOR "MinGW Makefiles" CACHE INTERNAL "" FORCE)
endif()
