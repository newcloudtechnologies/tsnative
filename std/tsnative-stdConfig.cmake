#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

message(STATUS "Found tsnative-std")

include(CMakeFindDependencyMacro)
find_dependency(absl REQUIRED)

include ("${CMAKE_CURRENT_LIST_DIR}/tsnative-stdTargets.cmake")

# We assume this install path _PACKAGE_LIBDIR/cmake/tsnative-std/this_file
get_filename_component(_PACKAGE_LIBDIR "${CMAKE_CURRENT_LIST_FILE}" PATH)
get_filename_component(_PACKAGE_LIBDIR "${_PACKAGE_LIBDIR}" PATH)
get_filename_component(_PACKAGE_LIBDIR "${_PACKAGE_LIBDIR}" PATH)

find_library(tsnative-std_LIBRARY
    NAMES tsnative-std
    PATHS ${_PACKAGE_LIBDIR}
    NO_DEFAULT_PATH
    NO_CMAKE_FIND_ROOT_PATH
)

# Cleanup
set(_PACKAGE_LIBDIR )

if (NOT DEFINED tsnative-std_LIBRARY)
    message(FATAL_ERROR "Cannot find tsnative-std library")
else()
    message(STATUS "Found tsnative-std library at ${tsnative-std_LIBRARY}")
    # Some projects depends on these variables
    list(PREPEND tsnative-std_LIBS ${tsnative-std_LIBRARY})
    list(PREPEND tsnative-std_LIBRARIES ${tsnative-std_LIBRARY})
endif()

