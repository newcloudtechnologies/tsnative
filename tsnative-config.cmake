# get_filename_component(mgt_ui_CMAKE_DIR "${CMAKE_CURRENT_LIST_FILE}" PATH)

# All those libraries are referenced from public headers,
#  therefore they are linked as PUBLIC; that's why we should
#  depend on them here.
include(CMakeFindDependencyMacro)
find_dependency(StdLib REQUIRED)
find_dependency(TsCompiler REQUIRED)
find_dependency(TsVerifier REQUIRED)
find_dependency(TsDeclarator REQUIRED)
