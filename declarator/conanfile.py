#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

from conans import ConanFile, CMake

import os, shutil

class TSNativeDeclaratorConan(ConanFile):
    name = "tsnative-declarator"

    # compiler and build_type settings are ignored when generating package id
    settings = "os", "arch", "compiler", "build_type"
    generators = "cmake_paths", "cmake_find_package"
    exports_sources = "*"

    def requirements(self):
        # Mark llvm as a private dependency
        self.requires("llvm/11.1.0#0", private=True)

    def build(self):
        cmake = CMake(self)
        cmake.definitions["CMAKE_TOOLCHAIN_FILE"] = 'conan_paths.cmake'
        if self.settings.os == "Linux":
            # Add current binary dir ($ORIGIN) to rpath so that declarator
            # can find libclang from the same folder without `LD_LIBRARY_PATH=.`
            cmake.definitions["CMAKE_INSTALL_RPATH"] = "\$ORIGIN"
        cmake.configure()
        cmake.build()
        cmake.install()

    def package(self):
        # the rest is installed on cmake.install() stage
        self.copy("*", dst="cmake", src="cmake")

        # Since llvm is a private dependency its components will not be added to PATH, but declarator
        # still needs libclang shared library to work. Embed it here and ship inside tsnative-declarator
        # package.
        if self.settings.os == "Macos":
            libclang_path = os.path.join(self.dependencies["llvm"].cpp_info.libdirs[0], "libclang.dylib")
        elif self.settings.os == "Windows":
            libclang_path = os.path.join(self.dependencies["llvm"].cpp_info.bindirs[0], "libclang.dll")
        else:
            libclang_path = os.path.join(self.dependencies["llvm"].cpp_info.libdirs[0], "libclang.so.11.1")

        shutil.copy2(libclang_path, os.path.join(self.package_folder, "bin"))
        shutil.copy2("scripts/tsnative-indexer.py", os.path.join(self.package_folder, "bin"))

    def package_id(self):
        # Ignore compiler and build_type settings when generatings package id
        # because we dont really care what compiler was used to build the binary
        del self.info.settings.compiler

    def package_info(self):
        self.cpp_info.name = self.name
        self.cpp_info.bindirs = ['bin']
        self.cpp_info.includedirs = ['include']
        # self.cpp_info.defines = ['TS']
        self.cpp_info.builddirs = ['cmake'] # can be used to locate predefined FindXXX.cmake
        # override default cmake target name to be tsnative-declarator instead of tsnative-declarator::tsnative-declarator
        self.cpp_info.set_property("cmake_target_name", self.name)
        self.env_info.path.append(os.path.join(self.package_folder, "bin"))
