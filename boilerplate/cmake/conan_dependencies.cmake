list(APPEND CMAKE_MODULE_PATH ${CMAKE_BINARY_DIR})
list(APPEND CMAKE_PREFIX_PATH ${CMAKE_BINARY_DIR})

include(cmake/conan.io.cmake)
include(cmake/utils.cmake)


conan_cmake_configure(
  REQUIRES
    tsnative-std/${TSNATIVE_VERSION}
  BUILD_REQUIRES
    tsnative-declarator/${TSNATIVE_VERSION}
    tsnative-compiler/${TSNATIVE_VERSION}
  GENERATORS
    CMakeDeps
    CMakeToolchain
  IMPORTS
    "., *.ts -> ."
)

conan_cmake_install(
  PATH_OR_REFERENCE
    ${CMAKE_BINARY_DIR}
  PROFILE_HOST
    ${CONAN_PROFILE_HOST}
  PROFILE_BUILD
    ${CONAN_PROFILE_BUILD}
  SETTINGS_HOST
    tsnative-std:build_type=${CMAKE_BUILD_TYPE}
  BUILD
    missing
)

include(conan_toolchain)
