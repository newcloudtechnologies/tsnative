from conans import ConanFile, tools
from conan.tools.scm import Git
from conan.tools.files import copy
from os.path import join
import os

class TSNativeStdConan(ConanFile):
    name = "llvm-node"
    settings = "os", "compiler", "build_type", "arch"
    generators = "cmake_paths"
    exports_sources = "*"

    @property
    def _source_subfolder(self):
        return 'source_subfolder'

    def _patch_sources(self):
        for patch in self.conan_data.get('patches', {}).get(self.version, []):
            tools.patch(**patch)

    def requirements(self):
        # Mark llvm as a private dependency
        self.requires("llvm/11.1.0", private=True)

    def source(self):
        git = Git(self)
        clone_args = ['--depth', '1', '--branch', 'v3.0.0', self._source_subfolder]
        git.clone(url="https://github.com/MichaReiser/llvm-node.git", args=clone_args)
        
    def build(self):
        self._patch_sources()
        self.init_npm_env()
        self.run("npm --prefix {}/ install".format(self._source_subfolder))
        self.run("npm --prefix {}/  run build -- --CDCMAKE_TOOLCHAIN_FILE=\"../conan_paths.cmake\"".format(self._source_subfolder))

    def package(self):
        self.copy("*llvm-node.node", src=self._source_subfolder, dst=self.package_folder)
        self.copy("*.ts", src=self._source_subfolder, dst=self.package_folder)
        self.copy("*.json", src=self._source_subfolder, dst=self.package_folder)
        self.copy("*index.js", src=self._source_subfolder, dst=self.package_folder)
        self.copy("*bindings.js", src=self._source_subfolder, dst=self.package_folder)

    def package_id(self):
        del self.info.settings.compiler

    # TODO: common python lib required - use python_requires?
    # keep in sync with tsnative/compiler/conanfile.py
    def init_npm_env(self):
        if "CI" in os.environ and os.environ["CI"].lower() == "true":
            self.output.info("== CI mode detected. Applying patches...")
            if not "WORKSPACE" in os.environ:
                self.output.error("CI=true but missing WORKSPACE variable")

            self.output.info("== patch: NPM_CONFIG_CACHE=$\{WORKSPACE\}")
            os.environ["NPM_CONFIG_CACHE"]=os.environ["WORKSPACE"] + os.pathsep + ".npm"

            # hack for docker containers with root user
            if self.settings.os == "Linux":
                os.environ["HOME"] = os.environ["WORKSPACE"]
                self.run('npm install -g npm@6')
                self.run('npm config set unsafe-perm true')

            
            # hack for docker containers with root user
            if self.settings.os == "Linux":
                self.output.info("== patch: HOME=$\{WORKSPACE\}")
                os.environ["HOME"] = os.environ["WORKSPACE"]
                self.output.info("== patch: unsafe-perm=true")
                self.run('npm config set unsafe-perm true')
                self.output.info("== patch: install npm@6")
                self.run('npm install -g npm@6')