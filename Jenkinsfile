gitea_creds = 'jenkins_gitea'

// NPM private repository
NPM_PRIVATE_REPO_ALL_URL = 'https://nexus.devos.club/repository/antiq_npm'
NPM_PRIVATE_REPO_PUBLIC_URL = 'https://nexus.devos.club/repository/antiq_npm_local'
NPM_PRIVATE_REPO_AUTH_STR = '//nexus.devos.club/repository/'
NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID = 'nexus_npm_user_antiq_NpmToken'

def get_source_branch() {
    if (env.BRANCH_NAME.startsWith('PR')) {
        return "${env.CHANGE_BRANCH}"
    } else {
        return "${env.BRANCH_NAME}"
    }
}

pipeline {
    agent none
    parameters {
        booleanParam(name: 'PublishWithoutIncrement', defaultValue: false, description: 'Whether we need to publish artifact to npm registry (without version increment')
    }
    stages {    
        stage('Build and test') {
            parallel {
                stage('Linux x86_64') {
                    agent {
                        docker {
                            image "docreg.devos.club/typescript-environment:1.6"
                            args "--user root"
                            registryUrl 'https://docreg.devos.club'
                            registryCredentialsId 'docker_kos'
                            alwaysPull true
                        }
                    }
                    environment {
                        CI = 'true'
                    }
                    stages {
                        stage("Setup Env") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        useradd()
                                        ssh_config()
                                        ssh_user(SSH_KEY, "jenkins", "/home/jenkins")
                                        ssh_user(SSH_KEY, "root", "/root")

                                        // clear NPM config user and in clone repo for local build
                                        sh "rm -f \$(npm config get userconfig)"
                                        sh "rm -f .npmrc"

                                        // enable unsafe-perm since running as a root for install npm-prebuilt-dependencies
                                        // work from root for all script execute
                                        sh "npm config set unsafe-perm true"

                                        // login private repo
                                        npm_login_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                        // stick to version 6 since 7 one is flawed a lot
                                        sh "npm install -g npm@6"

                                        // check version
                                        sh "npm -v"
                                        sh "node -v"

                                        // clean cache
                                        sh "npm cache clean -f"

                                        // install deps
                                        sh "npm install"

                                        // logout private repo
                                        npm_logout_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                                    }
                                }
                            }
                        }
                        stage("Build") {
                            steps {
                                script {
                                    sh "npm run build"
                                }
                            }
                        }
                        stage("Run Linter") {
                            steps {
                                sh "npm run lint"
                            }
                        }
                        stage("Run Tests") {
                            steps {
                                // FIXME: enable parallel build once KDM-836 is fixed
                                sh "npm run test"
                            }
                        }
                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement || (get_source_branch() == "master") }
                            }
                            steps {
                                // login to private registry
                                npm_login_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                sh "npm run publishToLocalRegistry"

                                // logout to private registry
                                npm_logout_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
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
                            sh "npm config set unsafe-perm true"
                            // always logout
                            npm_logout_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            npm_logout_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
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
                        CI = 'true'
                        PATH = "/usr/bin:${env.PATH}"
                    }
                    stages {
                        stage("Setup Env") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"
                                        
                                        sh """
                                            mkdir -p \$HOME/.ssh
                                            cat \${SSH_KEY} > \$HOME/.ssh/id_rsa
                                            chmod 600 \$HOME/.ssh/id_rsa
                                            echo "Host *" > \$HOME/.ssh/config
                                            echo "    StrictHostKeyChecking no" >>  ~/.ssh/config
                                        """

                                        // clear NPM config user and in clone repo for local build
                                        sh "rm -f \$(npm config get userconfig)"
                                        sh "rm -f .npmrc"

                                        // login in registry private repo
                                        npm_login_registry("https://nexus.devos.club/repository/antiq_npm",  "//nexus.devos.club/repository/", "nexus_npm_user_antiq_NpmToken")

                                        // hack: explicitly set python path on windows
                                        sh "npm config set python \"C:\\Python39\\python\""
                                        sh "npm config list"

                                        // stick to version 6 since 7 one is flawed a lot
                                        sh "npm install -g npm@6"

                                        // check version
                                        sh "npm -v"
                                        sh "node -v"

                                        // clean cache
                                        sh "npm cache clean -f"

                                        // install deps
                                        sh "npm install"

                                        // logout from registry private repo
                                        npm_logout_registry("https://nexus.devos.club/repository/antiq_npm",  "//nexus.devos.club/repository/", "nexus_npm_user_antiq_NpmToken")
                                    }
                                }
                            }
                        }
                        stage("Build") {
                            steps {
                                script {
                                    sh "npm run build"
                                }
                            }
                        }
                        stage("Run Linter") {
                            steps {
                                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                                    sh "npm run lint"
                                }
                            }
                        }
                        stage("Run Tests") {
                            steps {
                                sh "JOBS=-j8 npm test"
                            }
                        }
                        stage("Publish") {
                            when {
                                expression { params.PublishWithoutIncrement || (get_source_branch() == "master") }
                            }
                            steps {
                                // login to private registry
                                npm_login_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                sh "npm run publishToLocalRegistry"

                                // logout to private registry
                                npm_logout_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
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
                            npm_logout_registry(NPM_PRIVATE_REPO_ALL_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            npm_logout_registry_for_publish(NPM_PRIVATE_REPO_PUBLIC_URL, NPM_PRIVATE_REPO_AUTH_STR, NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }
            }
        }
    }
    post {
        always {
            script {
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

void useradd()
{
    sh 'useradd -u $(stat -c "%u" .gitignore) jenkins'
}

void ssh_config()
{
    sh '''
        echo "Host *" >> /etc/ssh/ssh_config
        echo "    StrictHostKeyChecking no" >> /etc/ssh/ssh_config
        echo "    UserKnownHostsFile=/dev/null" >> /etc/ssh/ssh_config
    '''
}

void ssh_user(String ssh_key, String user_name, String home_dir)
{
    echo "Configure ssh"
    sh """
        mkdir -p ${home_dir}/.ssh
        cat ${ssh_key} > ${home_dir}/.ssh/id_rsa
        chmod 600 ${home_dir}/.ssh/id_rsa
        chown -R ${user_name} ${home_dir}
    """
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