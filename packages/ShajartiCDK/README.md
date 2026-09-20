# Shajarti Infrastructure

AWS CDK infrastructure for the Family Tree application.

## Architecture

- **Frontend**: React app hosted on S3 + CloudFront
- **Backend**: Express.js API running on ECS Fargate
- **Networking**: VPC with public/private subnets, Application Load Balancer
- **Container Registry**: ECR for Docker images

## Prerequisites

1. AWS CLI configured with credentials
2. Node.js and npm installed
3. AWS CDK CLI installed: `npm install -g aws-cdk`

## Setup

```bash
cd packages/infra
npm install
```

## Deployment Steps

### 1. Build the Frontend

```bash
cd packages/app
npm run build
```

### 2. Build and Push Backend Docker Image

First, create a Dockerfile for the API:

```bash
cd packages/api
```

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

Then build and push:

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 602151477304.dkr.ecr.us-east-1.amazonaws.com

# Build the image
docker build -t shajarti-api .

# Tag the image
docker tag shajarti-api:latest 602151477304.dkr.ecr.us-east-1.amazonaws.com/shajarti-api:latest

# Push to ECR (after CDK creates the repository)
docker push 602151477304.dkr.ecr.us-east-1.amazonaws.com/shajarti-api:latest
```

### 3. Bootstrap CDK (First Time Only)

```bash
cd packages/infra
cdk bootstrap aws://602151477304/us-east-1
```

### 4. Deploy the Stack

```bash
cdk deploy
```

### 5. Update Backend Image

After the initial deployment, you need to push the Docker image:

```bash
# The ECR repository URI will be in the CDK output
# Follow step 2 above to build and push
```

Then update the ECS service to use the new image (it will auto-deploy).

## Useful Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `cdk deploy` - Deploy this stack to your AWS account
- `cdk diff` - Compare deployed stack with current state
- `cdk synth` - Emit the synthesized CloudFormation template
- `cdk destroy` - Remove the stack from your AWS account

## Outputs

After deployment, you'll get:

- **CloudFrontURL**: The public URL for your application
- **LoadBalancerDNS**: The ALB endpoint (for debugging)
- **ECRRepositoryUri**: Where to push your Docker images
- **WebsiteBucketName**: S3 bucket hosting the frontend

## Cost Optimization

- NAT Gateway: ~$32/month (consider removing for dev environments)
- ECS Fargate: ~$15/month for 1 task (0.25 vCPU, 0.5 GB)
- ALB: ~$16/month
- CloudFront: Pay per use
- S3: Minimal cost

Total estimated cost: ~$65-75/month

## Notes

- The stack uses `us-east-1` region by default
- Frontend is deployed automatically from `packages/app/dist`
- Backend requires manual Docker build and push to ECR
- Data persistence: Consider adding EFS or RDS for production use
