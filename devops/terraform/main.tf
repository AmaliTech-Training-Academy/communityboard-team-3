terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_security_group" "communityboard" {
  name        = "communityboard-sg"
  description = "Security group for CommunityBoard app"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "communityboard-sg"
  }
}

resource "aws_instance" "communityboard" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = "communityboard-deploy"

  vpc_security_group_ids = [aws_security_group.communityboard.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose-v2 git
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu
              
              # Clone and run app
              cd /home/ubuntu
              git clone https://github.com/AmaliTech-Training-Academy/communityboard-team-3.git
              cd communityboard-team-3
              
              # Create .env file
              cat > .env << 'ENVFILE'
              POSTGRES_DB=communityboard
              POSTGRES_USER=postgres
              DB_PASSWORD=postgres
              JWT_SECRET=communityboard-secret-key-amalitech-2024
              ETL_KMS_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
              ENVFILE
              
              # Start app
              docker compose up -d --build
              EOF

  tags = {
    Name = "communityboard-app"
  }
}

output "app_url" {
  value = "http://${aws_instance.communityboard.public_ip}:3000"
}

output "api_url" {
  value = "http://${aws_instance.communityboard.public_ip}:8080"
}

output "ssh_command" {
  value = "ssh ubuntu@${aws_instance.communityboard.public_ip}"
}
