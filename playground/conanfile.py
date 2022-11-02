#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

from conans import ConanFile, tools
from conan.tools.cmake import CMakeDeps

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

    def generate(self):
        cmake = CMakeDeps(self)
        cmake.build_context_activated = ["tsnative-declarator"]
        cmake.generate()

    def imports(self):
        self.keep_imports = True  # keep copied declarations in build folder
        self.copy("*.ts", ignore_case=True)

    def build(self):
        os.environ["NODE_PATH"] = self.deps_user_info["tsnative-std"].NODE_PATH

        source_folder = self.source_folder
        build_folder = self.build_folder
        install_folder = self.install_folder
        win_bash = False

        # TODO: AN-932 - it's possible to generate declarations only on linux for now
        if self.settings.os == "Windows":
            source_folder = tools.unix_path(self.source_folder)
            build_folder = tools.unix_path(self.build_folder)
            install_folder = tools.unix_path(self.install_folder)
            win_bash = True

        # TODO: control cmake directly here without tsnative.sh
        self.run("tsnative.sh \
                    --project_root {src} \
                    --source {src}/playground.ts \
                    --output {build}/playground \
                    --build {build} \
                    --conan_install {install} \
                    --baseUrl {install}/declarations \
                    --target_abi {abi} \
                    --print_ir"
                 .format(src=source_folder, build=build_folder, install=install_folder, abi=self.settings.target_abi),
                 win_bash=win_bash)
        # --extension {src}/extensions \
        # --trace")
