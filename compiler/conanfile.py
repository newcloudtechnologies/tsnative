from conans import ConanFile
from conans.model.version import Version
from distutils.dir_util import copy_tree
import os, shutil

class TSNativeCompilerConan(ConanFile):
    name = "tsnative-compiler"

    settings = "os", "arch", "build_type"

    description = "Typescript compiler"

    debug_build_type = "Debug"

    def requirements(self):
        self.requires("llvm-node/3.0.7", private=True)
        self.requires("llvm/11.1.0#0", private=True)

    def export_sources(self):
        self.copy("package.json")
        self.copy("tsconfig.json")
        self.copy("src*")
        self.copy("scripts*")
        self.copy("seed*")
        self.copy(".npm*")

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
        ln = self.dependencies["llvm-node"]
        copy_tree(ln.package_folder, os.path.join("node_modules","llvm-node"))

        if (self.settings.build_type == self.debug_build_type):
            # Generate source maps for the code. Paths are relative to build directory.
            self.run("tsc -p ./tsconfig.json --sourceMap --outDir ./sourceMaps")
            # Rename tsnative-compiler-debug to tsnative-compiler
            self.run("mv scripts/tsnative-compiler-debug scripts/tsnative-compiler")
            return

        # transpile
        self.run('npx tsc --outDir compiler')
        # prepare and pack compiler binary
        shutil.copy2("package.json", "compiler/")
        # TODO: add more control: explicit targets, no prebuilt node.js
        self.run("npx pkg compiler/ -t host -o bin/tsnative-compiler")

    def package(self):
        self.copy("*", src="bin")
        self.copy("*", src="seed", dst="seed")
        self.copy("*", src="scripts", excludes="tsnative-compiler*")
        self.copy("tsconfig.json")

        binext = ""
        if self.settings.os == "Windows":
            binext = ".exe"

        llvm_path = self.dependencies["llvm"].cpp_info.bindirs[0]
        llc_path = os.path.join(llvm_path, "llc%s" % binext)
        shutil.copy2(llc_path, os.path.join(self.package_folder, "tsnative-llc%s" % binext))

        if (self.settings.build_type == self.debug_build_type):
            self.copy("package.json")
            
            self.copy("*", src="src", dst="src")

            # Copy ready-to-use node_modules
            # Avoid calling npm install call and problems with llvm.node
            self.copy("*", src="node_modules", dst="node_modules")

            # Copy tsnative-compiler script which is used by tsnative.sh
            self.copy("tsnative-compiler", src="scripts")

            # Copy source maps for the code. 
            # It is important to give a name of folder exactly equal to a name in the tsconfig.json.
            self.copy("*", src="sourceMaps", dst="sourceMaps")

    def package_info(self):
        self.env_info.path.append(self.package_folder)

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
