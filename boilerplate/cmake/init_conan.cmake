include(cmake/utils.cmake)

set_build_type()
set_tsnative_version()
set_print_ir()
set_trace_import()
set_opt_level()
set_enable_optimization()

prepare_conan_profiles()

include(cmake/conan_dependencies.cmake)
