import cdk = require('@aws-cdk/core')
import lambda = require('@aws-cdk/aws-lambda')
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import { Bucket } from '@aws-cdk/aws-s3'
import { Queue } from '@aws-cdk/aws-sqs'
import { join } from 'path'
import * as eventsources from '@aws-cdk/aws-lambda-event-sources'
import events = require('@aws-cdk/aws-events')
import eventTargets = require('@aws-cdk/aws-events-targets')
import { ManagedPolicy, PolicyDocument, PolicyStatement } from '@aws-cdk/aws-iam'

export class SearchEngineStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const indexTable = new dynamodb.Table(this, 'index-table', {
            partitionKey: {
                name: 'keyword',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'document',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        const feedTable = new dynamodb.Table(this, 'feed-table', {
            partitionKey: {
                name: 'feedname',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        const pageBucket = new Bucket(this, 'page-bucket')

        const urlQueue = new Queue(this, 'url-queue', {
            visibilityTimeout: cdk.Duration.minutes(5)
        })

        const filenameQueue = new Queue(this, 'filename-queue', {
            visibilityTimeout: cdk.Duration.minutes(5)
        })

        const fetchUrls = new lambda.Function(this, 'fetch-urls-lambda', {
            description: 'Fetch URLs from a given rss feed and push to queue',
            timeout: cdk.Duration.seconds(20),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/fetch-urls.handler',
            environment: {
                TABLE: feedTable.tableName,
                QUEUE: urlQueue.queueUrl
            }
        });

        feedTable.grantReadData(fetchUrls)
        urlQueue.grantSendMessages(fetchUrls)

        // schedule fetch-urls to run once per day
        new events.Rule(this, 'schedule-rule', {
            description: 'Schedule rule to fetch update the search index',
            targets: [new eventTargets.LambdaFunction(fetchUrls)],
            schedule: events.Schedule.rate(cdk.Duration.days(1))
        });

        const fetchPage = new lambda.Function(this, 'fetch-page-lambda', {
            description: 'Fetches a page from a given url and stores its text content in s3',
            timeout: cdk.Duration.minutes(5),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/fetch-page.handler',
            environment: {
                BUCKET: pageBucket.bucketName,
                QUEUE: filenameQueue.queueUrl
            }
        });

        // sqs subscription to the lambda
        fetchPage.addEventSource(new eventsources.SqsEventSource(urlQueue, {
            batchSize: 10
        }));

        filenameQueue.grantSendMessages(fetchPage)
        urlQueue.grantConsumeMessages(fetchPage)
        pageBucket.grantWrite(fetchPage)

        const createIndex = new lambda.Function(this, 'create-index', {
            description: 'Count words in the downloaded pages and store index in DB',
            timeout: cdk.Duration.minutes(5),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/create-index.handler',
            environment: {
                TABLE: indexTable.tableName,
                QUEUE: filenameQueue.queueUrl
            }
        });

        filenameQueue.grantConsumeMessages(createIndex)
        pageBucket.grantRead(createIndex)
        indexTable.grantReadWriteData(createIndex)

        // sqs subscription to the lambda
        createIndex.addEventSource(new eventsources.SqsEventSource(filenameQueue, {
            batchSize: 10
        }));

        const search = new lambda.Function(this, 'search', {
            functionName: 'search-engine_search',
            description: 'Search the database for keywords and return ranked rersults',
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/search.handler',
            environment: {
                TABLE: indexTable.tableName
            }
        });

        indexTable.grantReadData(search)

        const addFeed = new lambda.Function(this, 'add-feed', {
            functionName: 'search-engine_add-feed',
            description: 'Add given feed url to the feed table for later processing',
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(join(__dirname, '../src')),
            handler: 'handlers/add-feed.handler',
            environment: {
                TABLE: feedTable.tableName
            }
        });

        feedTable.grantWriteData(addFeed)

        // create a policies that can be attached to the client role
        new ManagedPolicy(this, 'client-policy', {
            managedPolicyName: 'search-engine_client-policy',
            document: new PolicyDocument({
                assignSids: true,
                statements: [
                    new PolicyStatement({
                        actions: [
                            'lambda:InvokeFunction'
                        ],
                        resources: [
                            search.functionArn,
                            addFeed.functionArn
                        ]
                    })
                ]
            })
        })

    }
}
