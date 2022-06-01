message(STATUS "Found tsnative-std")

include(CMakeFindDependencyMacro)
find_dependency(absl REQUIRED)

include ("${CMAKE_CURRENT_LIST_DIR}/tsnative-std-targets.cmake")