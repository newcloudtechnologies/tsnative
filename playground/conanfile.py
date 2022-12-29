#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

from conans import ConanFile
from conan.tools.cmake import CMake
from conan.tools.cmake import CMakeToolchain
from conan.tools.cmake import CMakeDeps
from conan.tools.files import copy

import os

def pkg_suffix(self):
    if self._conan_user and self._conan_channel:
        return "%s@%s/%s" % (self.version, self.user, self.channel)
    else:
        return "%s" % self.version

class TSNativePlayground(ConanFile):
    name = "tsnative-playground"
    settings = "os", "compiler", "build_type", "arch", "target_abi"
    generators = "cmake_find_package", "cmake_paths", "CMakeDeps"

    def requirements(self):
        self.requires("tsnative-std/%s" % pkg_suffix(self))

    def build_requirements(self):
        self.build_requires("tsnative-declarator/%s" % pkg_suffix(self))
        self.build_requires("tsnative-compiler/%s" % pkg_suffix(self))

    def export_sources(self):
        self.copy("*.ts")

    def import_ts(self):
        ts_std_dep = self.dependencies["tsnative-std"]
        copy(self, "*.ts", ts_std_dep.cpp_info.builddirs[0], os.path.join(self.build_folder, "imports"))

    def generate(self):
        self.import_ts()

        # TODO: check if os.path.as_posix() works
        to_unix = lambda path: path.replace("\\", "/") #tools.unix_path(path, path_flavor="MSYS2")

        # By default, the generator is 'MinGW Makefiles' on windows but it breaks some paths
        tc = CMakeToolchain(self, generator="Unix Makefiles")
        tc.variables["CMAKE_CXX_COMPILER_TARGET"] = str(self.settings.target_abi)
        tc.variables["CMAKE_VERBOSE_MAKEFILE"]="ON"

        # Variables for compiled tests
        tc.variables["PROJECT_BASE_URL"] = to_unix(os.path.join(self.build_folder, "imports/declarations"))
        tc.variables["IS_TEST"] = True
        tc.variables["RUN_EVENT_LOOP"] = "oneshot"
        tc.variables["PRINT_IR"] = True
        tc.variables["TRACE_IMPORT"] = False

        if self.settings.get_safe("build_type") == "Debug":
            tc.variables["TS_DEBUG"] = True

        tc.generate()

        cmake = CMakeDeps(self)
        cmake.build_context_activated = ["tsnative-declarator"]
        cmake.generate()

    def build(self):
        os.environ["NODE_PATH"] = self.deps_user_info["tsnative-std"].NODE_PATH
        for require, dependency in self.dependencies.items():
            if "tsnative-compiler" in dependency.ref:
                compiler_pkg_dir = dependency.package_folder
                break

        cmake = CMake(self)
        cmake.configure(
            variables={
                "PROJECT_ENTRY_NAME": os.path.join(self.build_folder, "playground.ts"),
                "TS_CONFIG" : os.path.join(compiler_pkg_dir, "tsconfig.json")
            },
            build_script_folder=compiler_pkg_dir)
        cmake.build()

