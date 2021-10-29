pipeline { 
    agent {
      label 'master'
    }
    options {
        skipStagesAfterUnstable()
        timestamps()
    }
    stages {
        stage('build create-bucket service') {
            steps {
                dir('services/create-bucket') {
                  sh 'docker build -t node2.local/create-bucket:0.1 .'
                }
            }
        }
        stage('build delete-key service') {
            steps {
                dir('services/delete-key') {
                  sh 'docker build -t node2.local/delete-key:0.1 .'
                }
            }
        }
        stage('build get-bucket-acl service') {
            steps {
                dir('services/get-bucket-acl') {
                  sh 'docker build -t node2.local/get-bucket-acl:0.1 .'
                }
            }
        }
        stage('build get-bucket-meta service') {
            steps {
                dir('services/get-bucket-meta') {
                  sh 'docker build -t node2.local/get-bucket-meta:0.1 .'
                }
            }
        }
        stage('build get-list-buckets service') {
            steps {
                dir('services/get-list-buckets') {
                  sh 'docker build -t node2.local/get-list-buckets:0.1 .'
                }
            }
        }
        stage('build get-list-objects service') {
            steps {
                dir('services/get-list-objects') {
                  sh 'docker build -t node2.local/get-list-objects:0.1 .'
                }
            }
        }
        stage('build get-object service') {
            steps {
                dir('services/get-object') {
                  sh 'docker build -t node2.local/get-object:0.1 .'
                }
            }
        }
        stage('build get-object-acl service') {
            steps {
                dir('services/get-object-acl') {
                  sh 'docker build -t node2.local/get-object-acl:0.1 .'
                }
            }
        }
        stage('build get-object-meta service') {
            steps {
                dir('services/get-object-meta') {
                  sh 'docker build -t node2.local/get-object-meta:0.1 .'
                }
            }
        }
        stage('build put-bucket-acl service') {
            steps {
                dir('services/put-bucket-acl') {
                  sh 'docker build -t node2.local/put-bucket-acl:0.1 .'
                }
            }
        }
        stage('build put-object service') {
            steps {
                dir('services/put-object') {
                  sh 'docker build -t node2.local/put-object:0.1 .'
                }
            }
        }
        stage('build put-object-acl service') {
            steps {
                dir('services/put-object-acl') {
                  sh 'docker build -t node2.local/put-object-acl:0.1 .'
                }
            }
        }
    }
}
