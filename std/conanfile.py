from conan import ConanFile

from conan.tools.cmake import CMake
from conan.tools.cmake import CMakeDeps
from conan.tools.cmake import CMakeToolchain
from conans.client.tools.env import environment_append

import os

required_conan_version = "==1.50"

class TSNativeStdConan(ConanFile):
    name = "tsnative-std"
    description = "Typescript standard library implementation"
    settings = "os", "compiler", "build_type", "arch", "target_abi"
    exports_sources = "*"

    options = {
        "build_tests": [True, False],
        "enable_logs": ["all", "gc", "none"],
        "run_tests_with_memcheck": [True, False],
        "fail_test_on_mem_leak": [True, False],
    }

    default_options = {
        "build_tests": False,
        "enable_logs": "none",
        "run_tests_with_memcheck": False,
        "fail_test_on_mem_leak": False,
    }

    def requirements(self):
        self.requires("abseil/20211102.0#0")
        self.requires("gtest/1.11.0#0")
        self.requires("libuv/1.43.0#0")
        self.requires("graphvizlib/1.0.0")

    def build_requirements(self):
        # 'if self.user and self.channel:' ends up in exception when no user and channel values are provided
        if self._conan_user and self._conan_channel:
            self.build_requires("tsnative-declarator/%s@%s/%s" %
                                (self.version, self.user, self.channel))
        else:
            self.build_requires("tsnative-declarator/%s" % self.version)

    def generate(self):
        tc = CMakeToolchain(self)
        if self.settings.target_abi is None:
            self.output.error(
                "Target ABI is not specified. Please provide settings.target_abi value")
        else:
            self.output.info("Target ABI is %s" % self.settings.target_abi)
            tc.variables["CMAKE_CXX_COMPILER_TARGET"] = self.settings.target_abi

        tc.variables["GENERATE_DECLARATIONS"] = True
        tc.variables["BUILD_TEST"] = self.options.build_tests
        tc.variables["ENABLE_LOGS"] = self.options.enable_logs
        tc.variables["FAIL_TESTS_ON_MEM_LEAK"] = self.options.fail_test_on_mem_leak
        # tc.variables["CMAKE_VERBOSE_MAKEFILE"]="ON"

        print("TOOLCHAIN VARIABLES:\n\t" +
              "\n\t".join(f"{k}={v}" for k, v in tc.variables.items()))

        tc.generate()

        cmake = CMakeDeps(self)
        cmake.build_context_activated = ["tsnative-declarator"]
        cmake.generate()

    def build(self):
        cmake = CMake(self)

        cmake.configure()
        cmake.build()
        cmake.install()

        if self.options.build_tests and self.settings.os != "Android":
            with environment_append({'CTEST_OUTPUT_ON_FAILURE': '1'}):
                if self.options.run_tests_with_memcheck:
                    tests_with_memcheck_target = "test_memcheck";
                    cmake.build(target=tests_with_memcheck_target);
                else:
                    cmake.test()

    def package(self):
        self.copy("constants.*", "declarations/tsnative/std")

    def package_id(self):
        del self.info.options.build_tests
        del self.info.options.enable_logs
        del self.info.options.run_tests_with_memcheck
        del self.info.options.fail_test_on_mem_leak

    @property
    def base_cmake_module_path(self: ConanFile):
        return os.path.join(self.package_folder, "lib", "cmake")

    def package_info(self):
        pkg_name = self.name

        self.cpp_info.name = pkg_name
        self.cpp_info.defines = ['USE_STD_ARRAY_BACKEND']

        # CMakeDeps

        build_dir = self.package_folder
        cmake_config = os.path.join(self.base_cmake_module_path, pkg_name, pkg_name + "Config.cmake")

        self.cpp_info.set_property("cmake_file_name", pkg_name)
        self.cpp_info.set_property("cmake_target_name", pkg_name)
        self.cpp_info.set_property("cmake_build_modules", [cmake_config])

        if build_dir not in self.cpp_info.builddirs:
            self.cpp_info.builddirs.append(build_dir)
        self.cpp_info.builddirs.append(os.path.join(self.base_cmake_module_path))

        # cmake_find_package

        self.cpp_info.libs = [pkg_name]
        self.cpp_info.names["cmake_find_package"] = pkg_name
        self.cpp_info.names["cmake_find_package_multi"] = pkg_name

        # self.cpp_info.libs property does the job for old generators but this should work too. Not tested.
        # self.cpp_info.build_modules["cmake_find_package"].append(cmake_config)
        # self.cpp_info.build_modules["cmake_find_package_multi"].append(cmake_config)

        self.user_info.NODE_PATH = os.path.join(
            self.package_folder, "declarations/tsnative")
