from conans import ConanFile
from conan.tools.cmake import CMakeDeps
from conans.tools import load, save

import os, shutil, subprocess

def pkg_suffix(self):
    if self._conan_user and self._conan_channel:
        return "%s@%s/%s" % (self.version, self.user, self.channel)
    else:
        return  "%s" % self.version

class TSNativeTestsConan(ConanFile):
    name = "tsnative-tests"
    settings = "os", "compiler", "build_type", "arch", "target_abi"
    generators = "cmake_find_package", "cmake_paths", "CMakeDeps"

    options = {
        "run_mode": ["compile" , "runtime", "declarator", "all"]
    }

    default_options = {
        "run_mode": "all"
    }

    def requirements(self):
        self.requires("tsnative-std/%s" % pkg_suffix(self))

    def build_requirements(self):
        self.build_requires("tsnative-declarator/%s" % pkg_suffix(self))
        self.build_requires("tsnative-compiler/%s" % pkg_suffix(self))

    def export_sources(self):
        self.copy("*")

    def generate(self):
        cmake = CMakeDeps(self)
        cmake.build_context_activated = ["tsnative-declarator"]
        cmake.generate()

    def imports(self):
        self.keep_imports = True # keep copied declarations in build folder
        self.copy("*.ts", ignore_case=True)

    def setup_npm(self):
        self.init_npm_env()
        self.run('npm install')

    def build(self):
        if self.settings.target_abi is None:
            self.output.error("Target ABI is not specified. Please provide settings.target_abi value")
        else:
            self.output.info("Target ABI is %s" % self.settings.target_abi)

        if self.options.run_mode == "runtime" or self.options.run_mode == "all":
            self.setup_npm()
            self.output.info("======== RUNTIME TESTS ========")
            self.run("npx ts-node runtime_test.ts")

        if self.options.run_mode == "declarator" or self.options.run_mode == "all":
            self.setup_npm()
            self.output.info("======== DECLARATOR TESTS ========")
            if self.settings.os == "Windows":
                ps = subprocess.Popen(('gcc', '--version'), stdout=subprocess.PIPE)
                ps = subprocess.Popen(('grep', '-Eo','[0-9]*\\.[0-9]*\\.[0-9]*'), stdin=ps.stdout, stdout=subprocess.PIPE)
                ver = subprocess.check_output(('tail', '-n1'), stdin=ps.stdout).decode('ascii').strip()
                ps.wait()
                os.environ["GCC_VERSION"]=ver
            os.environ["COMPILER_ABI"]=str(self.settings.target_abi)
            os.environ["INCLUDES_STD"]=''.join(self.dependencies["tsnative-std"].cpp_info.includedirs)
            # TODO: why tf declarator cannot be referenced through key like std?!
            for require, dependency in self.dependencies.items():
                if "tsnative-declarator" in dependency.ref:
                    os.environ["INCLUDES_DECLARATOR"]=''.join(dependency.cpp_info.includedirs)
                    os.environ["DECLARATOR_BIN"]=os.path.join(''.join(dependency.cpp_info.bindirs), "tsnative-declarator")

            self.run("npx ts-node declarator_test.ts")

        if self.options.run_mode == "compile" or self.options.run_mode == "all":
            self.output.info("======== COMPILED TESTS ========")
            args = ""
            if "ARGS" in os.environ:
                args = os.environ["ARGS"]
            self.run("./testrunner.sh %s" % args)

    def package(self):
        if self.options.run_mode == "all":
            ctestfile = load("out/CTestTestfile.cmake")
            raw_lines = [ l for l in ctestfile.splitlines() if "add_test(" in l ]
            pkg_bin_dir = os.path.join(self.folders.base_package, "bin")
            ctestfile_out = ""
            os.makedirs(pkg_bin_dir)
            for l in raw_lines:
                tokens = l.split("\"")
                self.output.info("Install test file: %s" % tokens[1])
                shutil.copy2(tokens[1], pkg_bin_dir)
                ctestfile_out += "add_test(%s \"%s\")%s" % (os.path.basename(tokens[1]), os.path.join("bin", os.path.basename(tokens[1])), os.linesep)

            save(os.path.join(self.folders.base_package, "CTestTestfile.cmake"), ctestfile_out)
        else:
            self.output.warn("Files packed only when run_mode=all, but current mode is %s" % self.options.run_mode)

    # TODO: common python lib required - use python_requires?
    # keep in sync with compiler/conanfile.py
    def init_npm_env(self):
        if "CI" in os.environ and os.environ["CI"].lower() == "true":
            self.output.info("== CI mode detected. Applying patches...")
            if not "WORKSPACE" in os.environ:
                self.output.error("CI=true but missing WORKSPACE variable")

            self.output.info("== patch: NPM_CONFIG_CACHE=$\{WORKSPACE\}")
            os.environ["NPM_CONFIG_CACHE"]=os.environ["WORKSPACE"] + "/.npm"

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