gitea_creds = 'jenkins_gitea'

// NPM private repository
NPM_PRIVATE_REPO_ALL_URL = 'https://nexus.devos.club/repository/antiq_npm'
NPM_PRIVATE_REPO_PUBLIC_URL = 'https://nexus.devos.club/repository/antiq_npm_local'
NPM_PRIVATE_REPO_AUTH_STR = '//nexus.devos.club/repository/'
NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID = 'nexus_npm_user_antiq_NpmToken'

// Vars for control skip build in CI
SKIP_CI = false

// Vars for fix auto increment version
INCREMENT_VERSION = false

pipeline {
    agent none
    parameters {
        booleanParam(name: 'PublishWithoutIncrement', defaultValue: false, description: 'Whether we need to publish artifact to npm registry (without version increment')
    }
    stages {
        // WARNING! Need add message for commit Auto increment 'patch' version package with '[skip ci]'
        // this is a protection against recursive run tasks in Jenkins by 'push' in Gitea and webhook
        stage('Skip CI') {
            agent { label 'linux64'}

            steps{
                script {
                    // view current branch
                    echo "Use GIT branch is " + get_source_branch()

                    // check for [skip ci] or [ci skip] in latest commit message
                    if ( git_skip_ci_in_last_commit() ) {
                        // view output of SKIP CI
                        echo "In latest commit found [skip ci] or [ci skip]"
                        echo "Aborted task!"

                        // выставляем флаг на остановку сборки
                        SKIP_CI = true
                    }
                }
            }

            post {
                always {
                    cleanWs()
                }
            }
        }

        stage('Increment version on master') {
            when {
                allOf {
                    expression { (get_source_branch() == 'master') }
                    not { expression { SKIP_CI } }
                }
                beforeAgent true
            }

            agent {
                docker {
                    // use official Node LTS image
                    image "node:lts"
                }
            }

            environment {
                // Override HOME to WORKSPACE for NPM
                HOME = "${WORKSPACE}"
                // or override default cache directory (~/.npm)
                NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                // CI enable
                CI = 'true'
            }

            steps {
                script {
                    // check version
                    sh "npm -v"
                    sh "node -v"

                    // view current version
                    env.CURRENT_PROJECT_VERSION =
                            sh script: 'yarn version | grep "^info Current version:" | cut -d " " -f 4 | tr -d "\\n"',
                                returnStdout: true
                    echo "Current project version is ${env.CURRENT_PROJECT_VERSION}"

                    // Work with GIT
                    withCredentials([gitUsernamePassword(credentialsId: 'jenkins_gitea_http', gitToolName: 'git-tool')]) {
                        // test work with GIT
                        sh 'git fetch --all'

                        // config user for commit
                        sh 'git config --global user.email "devops_emb00x@collabio.team"'
                        sh 'git config --global user.name "jenkins"'

                        // Auto increment 'patch' version package with commit to GIT
                        // WARNING! Need add message for commit with '[skip ci]'
                        // this is a protection against recursive run tasks in Jenkins by 'push' in Gitea and webhook
                        sh 'npm version patch -m "[skip ci] Auto increment version by npm"'

                        // push with tag in Gitea
                        sh 'git push origin HEAD:' + get_source_branch() + ' --tags'

                        // view current version
                        env.NEW_PROJECT_VERSION =
                                sh script: 'yarn version | grep "^info Current version:" | cut -d " " -f 4 | tr -d "\\n"',
                                        returnStdout: true
                        // view version
                        echo "New project version is ${env.NEW_PROJECT_VERSION}"
                    }

                    // fix work with auto increment version
                    INCREMENT_VERSION = true
                }
            }

            post {
                always {
                    cleanWs()
                }
            }
        }

        stage('Build and test') {
            when {
                not { expression { SKIP_CI } }
                beforeAgent true
            }

            parallel {
                stage('Linux x86_64') {
                    agent {
                        docker {
                            image "docreg.devos.club/typescript-environment:1.7"
                            args "--user root"
                            registryUrl 'https://docreg.devos.club'
                            registryCredentialsId 'docker_kos'
                            alwaysPull true
                        }
                    }

                    environment {
                        CI = 'true'
                    }

                    // need for pull changes from remote repo for autoincrement version
                    stages {
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT
                                    withCredentials([gitUsernamePassword(credentialsId: 'jenkins_gitea_http', gitToolName: 'git-tool')]) {
                                        // Update repo
                                        sh 'git fetch --all'
                                        sh 'git pull'
                                    }
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        init_ssh(SSH_KEY, 'id_rsa', 'unix')

                                        npm_clean_config()

                                        // enable unsafe-perm since running as a root for install npm-prebuilt-dependencies
                                        // work from root for all script execute
                                        sh "npm config set unsafe-perm true"
                                        // npm 7 is flawed a lot
                                        sh "npm install -g npm@8"

                                        npm_install_deps()
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                npm_build()
                            }
                        }

                        stage("Tests") {
                            steps {
                                npm_test()
                            }
                        }

                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement || (get_source_branch() == 'master') }
                            }
                            steps {
                                npm_publish()
                            }
                        }
                    }

                    post {
                        cleanup {
                            // custom clean workdir from bug cleanWs()
                            sh 'rm -rf ./* ~/.ssh'
                        }

                        always {
                            // disable unsafe-perm since running as a root for install npm-prebuilt-dependencies
                            sh "npm config set unsafe-perm false"
                            // always logout
                            npm_logout()
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }

                stage('Windows x86_64') {
                    agent {
                        label 'winsrv19'
                    }

                    environment {
                        // CI enable for NodeJS
                        // https://www.jenkins.io/doc/tutorials/build-a-node-js-and-react-app-with-npm/#add-a-final-deliver-stage-to-your-pipeline
                        CI = 'true'
                        // Force using GIT from MSYS
                        PATH = "/usr/bin:${env.PATH}"
                    }

                    stages {
                        stage("Fix CRLF on Windows") {
                            steps {
                                script {
                                    echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                    // on Windows in GIT config use core.autocrlf = true
                                    // when checkout repository on Windows all files change end line from LF to CRLF
                                    // this view how non-add files to GIT on local copy
                                    // need delete this changes
                                    sh 'git status'
                                    sh 'git restore :/'
                                    sh 'git status'
                                }
                            }
                        }

                        // need for pull changes from remote repo for autoincrement version
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT
                                    withCredentials([gitUsernamePassword(credentialsId: 'jenkins_gitea_http', gitToolName: 'git-tool')]) {
                                        // Update repo
                                        sh 'git fetch --all'
                                        sh 'git pull'
                                    }
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"
                                        
                                        init_ssh(SSH_KEY, 'id_rsa', 'windows')

                                        npm_clean_config()

                                        // hack: explicitly set python path on windows
                                        sh "npm config set python \"C:\\Python39\\python\""
                                        sh "npm config list"
                                        // npm 7 is flawed a lot
                                        sh "npm install -g npm@8"
                                        npm_install_deps()
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                npm_build()
                            }
                        }

                        stage("Tests") {
                            steps {
                                npm_test()
                            }
                        }

                        stage("Publish") {
                            when {
                                expression { params.PublishWithoutIncrement || (get_source_branch() == 'master') }
                            }
                            steps {
                                npm_publish()
                            }
                        }
                    }

                    post {
                        cleanup {
                            // custom clean work dir from bug cleanWs()
                            sh 'rm -rf ./* ~/.ssh'
                        }

                        always {
                            // always logout
                            npm_logout()
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }

                stage('macOS arm64') {
                    agent {
                        label 'antiq_mac'
                    }

                    environment {
                        CI = 'true'
                    }

                    stages {
                        // need for pull changes from remote repo for autoincrement version
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT
                                    withCredentials([gitUsernamePassword(credentialsId: 'jenkins_gitea_http', gitToolName: 'git-tool')]) {
                                        // Update repo
                                        sh 'git fetch --all'
                                        sh 'git pull'
                                    }
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        init_ssh(SSH_KEY, 'id_rsa', 'unix')

                                        npm_clean_config()

                                        npm_install_deps()
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                npm_build()
                            }
                        }

                        stage("Tests") {
                            steps {
                                npm_test()
                            }
                        }

                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement || (get_source_branch() == 'master') }
                            }
                            steps {
                                npm_publish()
                            }
                        }
                    }

                    post {
                        cleanup {
                            // custom clean workdir from bug cleanWs()
                            sh 'rm -rf ./* ~/.ssh'
                        }

                        always {
                            // always logout
                            npm_logout()
                            // always clean work dir
                            deleteDir()
                            dir("${workspace}@tmp") {
                                deleteDir()
                            }
                        }
                    }
                }

                stage('macOS x86_64') {
                    agent {
                        label 'antiq_mac_x86_64'
                    }

                    environment {
                        CI = 'true'
                    }

                    stages {
                        // need for pull changes from remote repo for autoincrement version
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT
                                    withCredentials([gitUsernamePassword(credentialsId: 'jenkins_gitea_http', gitToolName: 'git-tool')]) {
                                        // Update repo
                                        sh 'git fetch --all'
                                        sh 'git pull'
                                    }
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        init_ssh(SSH_KEY, 'id_rsa', 'unix')

                                        npm_clean_config()

                                        npm_install_deps()
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                npm_build()
                            }
                        }

                        stage("Tests") {
                            steps {
                                npm_test()
                            }
                        }

                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement || (get_source_branch() == 'master') }
                            }
                            steps {
                                npm_publish()
                            }
                        }
                    }

                    post {
                        cleanup {
                            // custom clean workdir from bug cleanWs()
                            sh 'rm -rf ./* ~/.ssh'
                        }

                        always {
                            // always logout
                            npm_logout()
                            // always clean work dir
                            deleteDir()
                            dir("${workspace}@tmp") {
                                deleteDir()
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // skip build on CI
                // ABORTED task and description of this
                if (SKIP_CI == true) {
                    currentBuild.result = 'ABORTED'
                    currentBuild.description = 'SKIP CI'
                }

                // email
                emailext (
                    subject: "Pipeline status of ${currentBuild.fullDisplayName}: ${currentBuild.currentResult}",
                    body: "<p>Check console output at <a href='${env.BUILD_URL}display/redirect'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a></p>",
                    recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'RequesterRecipientProvider']],
                    attachLog: true
                )
            }
        }
    }
}

// TODO: move to shared lib
void init_ssh(String ssh_key, String id_rsa_name, String host = 'unix')
{
    echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"
    echo "Configuring ssh..."
    if (host == 'unix') {
        sh """
            mkdir -p ~/.ssh
            chmod 700 ~/.ssh
            cat ${ssh_key} > ~/.ssh/${id_rsa_name}
            chmod 600 ~/.ssh/${id_rsa_name}
            echo "Host *" > ~/.ssh/config
            echo "    StrictHostKeyChecking no" >>  ~/.ssh/config
        """
    }
    else if (host == 'windows') {
        sh """
            mkdir -p \$HOME/.ssh
            cat \${SSH_KEY} > \$HOME/.ssh/id_rsa
            chmod 600 \$HOME/.ssh/id_rsa
            echo "Host *" > \$HOME/.ssh/config
            echo "    StrictHostKeyChecking no" >>  ~/.ssh/config
        """
    }
    else {
        echo "Unknown host platform: ${host}"
    }
}

void npm_clean_config()
{
    // clear NPM config user and in clone repo for local build
    sh "rm -f \$(npm config get userconfig)"
    sh "rm -f .npmrc"
}

void npm_install_deps()
{
    // login private repo
    npm_login_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

    // check version
    sh "npm -v"
    sh "node -v"

    // clean cache
    sh "npm cache clean -f"

    // install deps
    sh "npm install"

    // debug
    sh "npm version"

    // logout private repo
    npm_logout_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
}

void npm_build()
{
    sh "npm run lint"
    sh "npm run build"
}

void npm_test()
{
    // FIXME: enable parallel build once KDM-836 (???) is fixed
    sh 'npm test'
    sh 'npm run runtime_test'
}

void npm_publish()
{
    // login to private registry
    npm_login_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

    // debug
    sh "npm version"

    sh "npm run publishToLocalRegistry"

    // logout to private registry
    npm_logout_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
}

void npm_logout()
{
    npm_logout_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
    npm_logout_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
}

// авторизуемся в репозитории для получения зависимостей
void npm_login_registry(String registry_url, String registry_auth_str, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_AUTH_STR=${registry_auth_str}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config set always-auth true'
             sh "npm config set registry ${registry_url}"
             sh 'npm config set $LOCAL_REGISTRY_AUTH_STR:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config list"
        }
   }
}

void npm_logout_registry(String registry_url, String registry_auth_str, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_AUTH_STR=${registry_auth_str}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config delete $LOCAL_REGISTRY_AUTH_STR:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config delete registry ${registry_url}"
             sh 'npm config delete always-auth true'
             sh "npm config list"
        }
   }
}

// авторизуемся в репозитории для публикации артефакта
void npm_login_registry_for_publish(String registry_url, String registry_auth_str, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_AUTH_STR=${registry_auth_str}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config set private true'
             sh 'npm config set always-auth true'
             sh "npm config set registry ${registry_url}"
             sh "npm config set publishConfig.registry ${registry_url}"
             sh 'npm config set $LOCAL_REGISTRY_AUTH_STR:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config list"
        }
   }
}

void npm_logout_registry_for_publish(String registry_url, String registry_auth_str, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_AUTH_STR=${registry_auth_str}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config delete $LOCAL_REGISTRY_AUTH_STR:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config delete publishConfig.registry ${registry_url}"
             sh "npm config delete registry ${registry_url}"
             sh 'npm config delete always-auth true'
             sh 'npm config delete private true'
             sh "npm config list"
        }
   }
}

String get_source_branch() {
    if (env.BRANCH_NAME.startsWith('PR')) {
        return "${env.CHANGE_BRANCH}".toString()
    } else {
        return "${env.BRANCH_NAME}".toString()
    }
}

boolean git_skip_ci_in_last_commit() {
    if (sh (script: "git --no-pager show -s --format=\'%B\' -1 | grep '.*\\[skip ci\\].*\\|.*\\[ci skip\\].*'", returnStatus: true) == 0) {
        return true
    } else {
        return false
    }
}
