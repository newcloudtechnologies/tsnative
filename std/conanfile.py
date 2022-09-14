import os
from conan.tools.cmake import CMakeDeps
from conans import ConanFile, CMake


# required_conan_version = ">=1.33.0"


class TSNativeStdConan(ConanFile):
    name = "tsnative-std"
    testSuffix = "_GTEST"

    description = "Typescript standard library implementation"
    settings = "os", "compiler", "build_type", "arch", "target_abi"

    generators = "cmake", "CMakeDeps", "cmake_find_package"

    exports_sources = "*"

    options = {
        "build_tests": [True, False],
        "enable_logs": [True, False]
    }

    default_options = {
        "build_tests": False,
        "enable_logs": False
    }

    def requirements(self):
        self.requires("abseil/20211102.0")
        self.requires("gtest/1.11.0")
        self.requires("libuv/1.43.0")

    def build_requirements(self):
        # 'if self.user and seld.channel:' ends up in exception when no user and channel values are provided
        if self._conan_user and self._conan_channel:
            self.build_requires("tsnative-declarator/%s@%s/%s" %
                                (self.version, self.user, self.channel))
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
            self.output.error(
                "Target ABI is not specified. Please provide settings.target_abi value")
        else:
            self.output.info("Target ABI is %s" % self.settings.target_abi)
            cmake.definitions["CMAKE_CXX_COMPILER_TARGET"] = self.settings.target_abi
            cmake.definitions["GENERATE_DECLARATIONS"] = 'ON'

        cmake.definitions["BUILD_TEST"] = 'ON' if self.options.build_tests else 'OFF'
        cmake.definitions["ENABLE_LOGS"] = 'ON' if self.options.enable_logs else 'OFF'

        cmake.configure()
        cmake.build()
        cmake.install()
        cmake.test(output_on_failure=True)

    def package(self):
        self.copy("constants.*", "declarations/tsnative/std")

    def package_id(self):
        del self.info.options.build_tests
        del self.info.options.enable_logs

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
