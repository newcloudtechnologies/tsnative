from conans import ConanFile, CMake, tools
from conan.tools.cmake import CMakeToolchain, CMakeDeps

import os

# required_conan_version = ">=1.33.0"

class TSNativeStdConan(ConanFile):
    name = "tsnative-std"
    testSuffix = "_GTEST"

    description = "Typescript standard library implementation"
    settings = "os", "compiler", "build_type", "arch", "target_abi"
    
    generators = "cmake", "CMakeDeps", "cmake_find_package"

    exports_sources = "*"

    options = {
        "build_tests": [True, False]
    }

    default_options = {
        "build_tests": False
    }

    def requirements(self):
        self.requires("abseil/20211102.0")
        self.requires("gtest/1.11.0")

    def build_requirements(self):
        # 'if self.user and seld.channel:' ends up in exception when no user and channel values are provided
        if self._conan_user and self._conan_channel:
            self.build_requires("tsnative-declarator/%s@%s/%s" % (self.version, self.user, self.channel))
        else:
            self.build_requires("tsnative-declarator/%s" % self.version)

    def generate(self):
        cmake = CMakeDeps(self)
        # forces cmake scripts generation for "tools"
        cmake.build_context_activated = ["tsnative-declarator"]
        cmake.generate()

    def build(self):
        cmake = CMake(self)
        if self.settings.target_abi is None:
            self.output.error("Target ABI is not specified. Please provide settings.target_abi value")
        else:
            self.output.info("Target ABI is %s" % self.settings.target_abi)
            cmake.definitions["CMAKE_CXX_COMPILER_TARGET"] = self.settings.target_abi
        
        # TODO: it's possible to generate std declaration only on linux for now
        if (self.settings.os == "Linux"):
            cmake.definitions["GENERATE_DECLARATIONS"] = 'ON'
        else:
            self.output.warn("Declarations generation is disabled for OS %s" % str(self.settings.os))
            cmake.definitions["GENERATE_DECLARATIONS"] = 'OFF'

        cmake.definitions["BUILD_TEST"] = 'ON' if self.options.build_tests else 'OFF'

        cmake.configure()
        cmake.build()
        cmake.install()
        cmake.test(output_on_failure=True)

    def package(self):
        self.copy("constants.*", "declarations/tsnative/std")

    def package_id(self):
        del self.info.options.build_tests

    def package_info(self):
        self.cpp_info.name = self.name
        self.cpp_info.libs = ["tsnative-std"]
        self.cpp_info.libdirs = ['lib']
        self.cpp_info.includedirs = ['include']
        self.cpp_info.defines = ['USE_STD_ARRAY_BACKEND']
        self.cpp_info.set_property("cmake_target_name", self.name)
        self.user_info.NODE_PATH = os.path.join(self.package_folder, "declarations/tsnative")


