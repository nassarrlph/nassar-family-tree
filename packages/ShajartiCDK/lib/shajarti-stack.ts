import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class ShajartiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // VPC for Backend
    // ========================================
    const vpc = new ec2.Vpc(this, 'ShajartiVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ========================================
    // ECR Repository for Backend API
    // ========================================
    const apiRepository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: 'shajarti-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true,
    });

    // ========================================
    // ECS Cluster
    // ========================================
    const cluster = new ecs.Cluster(this, 'ShajartiCluster', {
      vpc,
      clusterName: 'shajarti-cluster',
      containerInsights: true,
    });

    // ========================================
    // Application Load Balancer
    // ========================================
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApiLoadBalancer', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'shajarti-alb',
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // ========================================
    // ECS Task Definition
    // ========================================
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/ecs/shajarti-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const container = taskDefinition.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromEcrRepository(apiRepository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      portMappings: [
        {
          containerPort: 3001,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // ========================================
    // ECS Fargate Service
    // ========================================
    const service = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      serviceName: 'shajarti-api-service',
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // ========================================
    // Target Group and Listener Rule
    // ========================================
    const targetGroup = listener.addTargets('ApiTargetGroup', {
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/api/tree',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ========================================
    // S3 Bucket for Frontend
    // ========================================
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `shajarti-frontend-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ========================================
    // CloudFront Origin Access Identity
    // ========================================
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: 'OAI for Shajarti website',
      }
    );

    websiteBucket.grantRead(originAccessIdentity);

    // ========================================
    // CloudFront Distribution
    // ========================================
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // ========================================
    // Deploy Frontend to S3
    // ========================================
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../app/dist'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: apiRepository.repositoryUri,
      description: 'ECR Repository URI for API',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 Bucket for Frontend',
    });
  }
}
