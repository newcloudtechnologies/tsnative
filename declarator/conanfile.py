from conans import ConanFile, CMake

import os

class TSNativeDeclaratorConan(ConanFile):
    name = "tsnative-declarator"

    # compiler and build_type settings are ignored when generating package id
    settings = "os", "arch", "compiler", "build_type"
    generators = "cmake"
    exports_sources = "*"

    def build(self):
        cmake = CMake(self)
        cmake.configure()
        cmake.build()
        cmake.install()

    def package(self):
        # the rest is installed on cmake.install() stage
        self.copy("*", dst="cmake", src="cmake")

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


