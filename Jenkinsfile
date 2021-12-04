def image
def branch_name = "${env.BRANCH_NAME}" as String
def build_number = "${env.BUILD_NUMBER}" as String
def commit_hash

def tag_name = 'jb_' + branch_name + "_" + build_number

def name = 'cghh-smarthome-ct-integration'
def img_name = 'cghh/' + name;
def image_name = img_name + ":" + tag_name

pipeline {
    agent any

    options {
        ansiColor('xterm')
    }

    stages {
        stage('Preamble') {
            steps {
                script {
                    echo 'Updating status'
                    updateStatus("pending")
                }
                script {
                    commit_hash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()

                    echo 'Control Variables'
                    echo '-------------------'
                    echo "COMMIT HASH: ${commit_hash}"
                    echo "BRANCH NAME: ${branch_name}"
                    echo "BUILD NUMBER: ${build_number}"
                }
            }
        }


        stage('Build Docker image') {
            steps {
                script {
                    image = docker.build(image_name)
                }
            }
        }

        stage('Publish to registry - main') {
            when {
                expression {
                    return branch_name =~ "main"
                }
            }
            steps {
                script {
                    docker.withRegistry('http://localhost:34015') {
                        image.push('latest')
                    }
                }
            }
        }

        stage('Start container') {
            steps {
                script {
                    docker.withRegistry('http://localhost:34015') {
                        try {
                            sh "docker rm ${name} -f"
                        } catch (err) {
                            echo "cant remove container - it does not exist"
                        }
                        sh '''docker run --name ${name} \
                                -v cghh-smarthome-ct-integration/.env:/usr/src/app/.env \
                                -v cghh-smarthome-ct-integration/config:/usr/src/app/config \
                                -v cghh-smarthome-ct-integration/persistent:/usr/src/app/persistent \
                                --network=cghh-smarthome \
                                -d  ${image_name}
                            '''
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                updateStatus("success")

                try {
                    sh 'docker image prune --filter label=stage=intermediate -f --volumes'
                } catch (err) {
                    echo err.getMessage()
                }
            }
        }

        failure {
            script {
                updateStatus("failure")
            }
        }

        aborted {
            script {
                updateStatus("error")
            }
        }
    }
}

void updateStatus(String value) {
    sh 'curl -s "https://api.github.com/repos/sebamomann/cghh-smarthome-ct-integration/statuses/$GIT_COMMIT" \\\n' +
            '  -H "Content-Type: application/json" \\\n' +
            '  -H "Authorization: token $GITHUB_STATUS_ACCESS_TOKEN_SEBAMOMANN" \\\n' +
            '  -X POST \\\n' +
            '  -d "{\\"state\\": \\"' + value + '\\", \\"description\\": \\"Jenkins\\", \\"context\\": \\"continuous-integration/jenkins\\", \\"target_url\\": \\"https://jenkins.dankoe.de/job/cghh-smarthome-ct-integration/job/$BRANCH_NAME/$BUILD_NUMBER/console\\"}" \\\n' +
            '  '
}