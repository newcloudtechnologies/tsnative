from conans import ConanFile, CMake, tools
from conan.tools.scm import Git
import os

required_conan_version = ">=1.45.0"


class GraphVizLibConan(ConanFile):
    name = "graphvizlib"
    description = "A C++ Library to work with GraphViz graphs"
    topics = ("conan", "graph")
    url = "https://gitea.devos.club/antiq/conan_deploy"
    homepage = "https://github.com/Skazzi00/GraphVizLib"
    license = "MIT"
    no_copy_source = True
    version="1.0.0"
    settings = "os", "compiler", "build_type", "arch"
    generators = "cmake", "cmake_find_package"

    @property
    def _source_subfolder(self):
        return "source_subfolder"

    def source(self):
        git = Git(self)
        clone_args = [self._source_subfolder, '--depth', '1']
        git.clone(url="https://github.com/Skazzi00/GraphVizLib.git", args=clone_args)
        self._patch_sources()

    def export_sources(self):
        self.copy("CMakeLists.txt")
        for patch in self.conan_data.get("patches", {}).get(self.version, []):
            self.copy(patch["patch_file"])

    def package(self):
        self.copy(pattern="*", dst="include", src=os.path.join(self._source_subfolder, "include"))

    def _patch_sources(self):
        dir = os.getcwd()
        print(" Cur dir: ", dir)
        subfolder_dir = os.path.join(dir, self._source_subfolder)

        # tools.patch cannot create and move files to folders for some reason
        # here is a hack simulating patch 0001
        os.mkdir(os.path.join(subfolder_dir, "include"))
        os.mkdir(os.path.join(subfolder_dir, "src"))
        os.mkdir(os.path.join(subfolder_dir, "example"))

        os.replace(os.path.join(subfolder_dir, "gvl.h"), os.path.join(subfolder_dir, "include", "gvl.h"))
        os.replace(os.path.join(subfolder_dir, "gvl.cpp"), os.path.join(subfolder_dir, "src", "gvl.cpp"))
        os.replace(os.path.join(subfolder_dir, "example.cpp"), os.path.join(subfolder_dir, "example", "example.cpp"))

        print("====== Applying patches ====")
        for patch in self.conan_data.get('patches', {}).get(self.version, []):
            print("====== Applying patch ")
            tools.patch(**patch)

    def build(self):
        cmake = CMake(self)
        cmake.configure(source_folder=self._source_subfolder)
        cmake.build()

    def package(self):
        cmake = CMake(self)
        cmake.install()

    def package_info(self):
        self.cpp_info.names["cmake_find_package"] = "graphvizlib"
        self.cpp_info.names["cmake_find_package_multi"] = "graphvizlib"

        self.cpp_info.set_property("cmake_target_name", "graphvizlib")
        self.cpp_info.set_property("cmake_target_aliases", ["graphvizlib::graphvizlib"])

        self.cpp_info.includedirs = ["include"]
        self.cpp_info.libs = ["graphvizlib"]