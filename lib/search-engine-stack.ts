import cdk = require('@aws-cdk/core')
// import route53 = require('@aws-cdk/aws-route53');
import lambda = require('@aws-cdk/aws-lambda')
// import apigateway = require('@aws-cdk/aws-apigateway');
import dynamodb from '@aws-cdk/aws-dynamodb'
import { Bucket, EventType } from '@aws-cdk/aws-s3'
// import { AccountPrincipal, PolicyStatement } from '@aws-cdk/aws-iam';
import { Queue } from '@aws-cdk/aws-sqs'
import { join } from 'path'
import * as eventsources from '@aws-cdk/aws-lambda-event-sources';

export class SearchEngineStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props) {
        super(scope, id, props);

        const indexTable = new dynamodb.Table(this, 'search-index-table', {
            partitionKey: {
                name: 'token',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        const pageBucket = new Bucket(this, 'page-bucket')

        const urlQueue = new Queue(this, 'url-queue')

        const fetchUrls = new lambda.Function(this, 'fetch-urls-lambda', {
            description: 'Fetch URLs from a given rss feed and push to queue',
            timeout: cdk.Duration.seconds(20),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/fetch-urls.handler',
            environment: {
                QUEUE: urlQueue.queueUrl
            }
        });

        urlQueue.grantSendMessages(fetchUrls)

        const fetchPage = new lambda.Function(this, 'fetch-page-lambda', {
            description: 'Fetches a page from a given url and stores its text content in s3',
            timeout: cdk.Duration.seconds(20),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/fetch-page.handler',
            environment: {
                BUCKET: pageBucket.bucketName
            }
        });

        // sqs subscription to the lambda
        fetchPage.addEventSource(new eventsources.SqsEventSource(urlQueue));

        urlQueue.grantConsumeMessages(fetchPage)
        pageBucket.grantWrite(fetchPage)

        const createIndex = new lambda.Function(this, 'create-index', {
            description: 'Count words in the downloaded pages and store index in DB',
            timeout: cdk.Duration.seconds(20),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/create-index.handler',
            environment: {
                TABLE: indexTable.tableName
            }
        });
        pageBucket.grantRead(createIndex)

        createIndex.addEventSource(new eventsources.S3EventSource(pageBucket, {
            events: [
                EventType.OBJECT_CREATED,
                EventType.OBJECT_CREATED_PUT
            ]
        }))

        // const redirect = new lambda.Function(this, 'redirect-lambda', {
        //     timeout: cdk.Duration.seconds(5),
        //     memorySize: 256,
        //     runtime: lambda.Runtime.NODEJS_14_X,
        //     code: lambda.Code.asset('src'),
        //     handler: 'handlers/redirect.handler',
        //     environment: {
        //         SITE_ID_TABLE: table.tableName
        //     }
        // });

        // table.grantReadData(redirect);

        // const api = new apigateway.RestApi(this, 'exit-proxy-api', {
        //     deployOptions: stageConfig.deployOptions
        // });

        // const exitToRetailer = api.root.addResource('exitToRetailer');
        // const lambdaIntegration = new apigateway.LambdaIntegration(redirect);
        // exitToRetailer.addMethod('GET', lambdaIntegration)

        // const apiDomain = `exit.${stageConfig.domain}`;

        // const domain = new apigateway.CfnDomainName(this, 'domain-name', {
        //     domainName: apiDomain,
        //     certificateArn: stageConfig.sslCertificate
        // });

        // new apigateway.CfnBasePathMapping(this, 'base-path-mapping', {
        //     domainName: apiDomain,
        //     restApiId: api.restApiId,
        //     stage: api.deploymentStage ?
        //         api.deploymentStage.stageName : 'prod'
        // });

        // new route53.CfnRecordSet(this, 'record-set', {
        //     name: apiDomain,
        //     type: 'A',
        //     hostedZoneId: `${stageConfig.hostedZoneId}`,
        //     aliasTarget: {
        //         dnsName: domain.attrDistributionDomainName,
        //         hostedZoneId: domain.attrDistributionHostedZoneId
        //     }
        // });

    }
}
