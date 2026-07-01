pipeline {
    agent any

    parameters {

        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'prod'],
            description: 'Deployment Environment'
        )

        string(
            name: 'IMAGE_TAG',
            defaultValue: 'v1',
            description: 'Docker Image Tag'
        )
    }

    environment {
        IMAGE_NAME = "cynayd/one-frontend"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                dir('frontend') {
                    withSonarQubeEnv('sonarqube') {
                        sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=one-frontend \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.login=$SONAR_AUTH_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('frontend') {
                    sh """
                    docker buildx build \
                    --platform linux/amd64 \
                    -t ${IMAGE_NAME}:${params.IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh """
                /opt/local/bin/trivy image \
                --timeout 15m \
                --scanners vuln \
                --severity HIGH,CRITICAL \
                --no-progress \
                ${IMAGE_NAME}:${params.IMAGE_TAG}
                """
            }
        }

        stage('DockerHub Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                    echo $DOCKER_PASS | docker login \
                    -u $DOCKER_USER \
                    --password-stdin
                    '''
                }
            }
        }

        stage('Push DockerHub Image') {
            steps {
                sh """
                docker push ${IMAGE_NAME}:${params.IMAGE_TAG}
                """
            }
        }
    }

    post {

        success {
            echo 'Pipeline completed successfully'
        }

        failure {
            echo 'Pipeline failed'
        }

        always {
            cleanWs()
        }
    }
}
