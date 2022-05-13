from conans import ConanFile
from conans.model.version import Version

import os, shutil

class TSNativeCompilerConan(ConanFile):
    name = "tsnative-compiler"

    settings = "os", "arch", "compiler", "build_type"

    description = "Typescript compiler"

    def requirements(self):
        self.requires("llvm-node/3.6.0")

    def imports(self):
        self.keep_imports = True # keep copied files in build folder
        self.copy("*", os.path.join("deps","llvm-node"))

    def export_sources(self):
        self.copy("package.json")
        self.copy("tsconfig.json")
        self.copy("src*")
        self.copy("scripts*")
        self.copy(".npm*")
        # TODO: for now compiler embeds std definitions making it imposible to be used
        # as a target-agnostic build context tool. We need to break this dependency 
        # and pass paths to std definitions at runtime and avoid embedding.
        self.copy("constants*", src="../std", dst="std")
        self.copy("*", src="../std/definitions", dst="std/definitions")

    def build(self):
        # prepare env
        self.init_npm_env()
        # basic configuration steps
        self.run('node -v')
        self.run('npm -v')
        self.run('npm cache clean -f')
        self.run('npm config list')
        # write version to package.json so it can be read when running `tsnative-compiler --version``
        v = Version(str(self.version))
        self.output.info("== Compiler version to be built: %s" % v.patch())
        self.run('npm version %s' % v.patch())
        # install npm dependencies
        self.run('npm install')
        # copy conan dependencies to node_modules
        self.copytree("deps/*", "node_modules")
        # transpile
        self.run('npx tsc --outDir compiler/')
        # prepare and pack compiler binary
        shutil.copy2("package.json", "compiler/")
        self.copytree("std/*", os.path.join("compiler","std"))
        # TODO: add more control: explicit targets, no prebuilt node.js
        self.run("npx pkg compiler/ -t host -o bin/tsnative-compiler")

    def package(self):
        self.copy("*", src="bin")
        self.copy("*", src="scripts")
        self.copy("tsconfig.json")

    def package_info(self):
        self.env_info.path.append(self.package_folder)

    def package_id(self):
        # Ignore compiler and build_type settings when generatings package id
        # because we dont really care what compiler was used to build the binary
        del self.info.settings.compiler
        del self.info.settings.build_type

    # TODO: common python lib required - use python_requires?
    # keep in sync with test/conanfile.py
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
                self.output.info("== patch: HOME=$\{WORKSPACE\}")
                os.environ["HOME"] = os.environ["WORKSPACE"]
                self.output.info("== patch: unsafe-perm=true")
                self.run('npm config set unsafe-perm true')
                self.output.info("== patch: install npm@6")
                self.run('npm install -g npm@6')

    def copytree(self, src, dst, symlinks=False, ignore=None):
        # Conan generates a really long paths that easily exceed default 260 chars limit on Windows.
        # Even though it's possible to ask Windows to extend this limit, python seems to unable to
        # to take advantage of this tweak and keeps failing when we try to use shutils.copytree to
        # copy files to destinations with long paths.
        self.run("cp -rf %s %s" % (src, dst))
