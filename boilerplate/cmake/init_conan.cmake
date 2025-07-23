#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

include(cmake/utils.cmake)

set_build_type()
set_tsnative_version()
set_print_ir()
set_trace_import()
set_opt_level()
set_enable_optimization()

prepare_conan_profiles()

include(cmake/conan_dependencies.cmake)
