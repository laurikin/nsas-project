import apigateway = require('@aws-cdk/aws-apigateway');

export interface StageConfig {
    vpcId: string;
    domain: string;
    sslCertificate: string;
    hostedZoneId: string;
    deployOptions: {
        cacheClusterEnabled: boolean;
        cacheClusterSize?: string;
        cacheTtlSeconds?: number;
        dataTraceEnabled: boolean;
        metricsEnabled: boolean;
        loggingLevel: apigateway.MethodLoggingLevel
        throttlingBurstLimit: number;
        throttlingRateLimit: number;
    }
}

export interface Config {
    prod: StageConfig;
    dev: StageConfig;
}

export const config: Config = {
    prod: {
        vpcId: 'vpc-0175fd6f25f3f8d1e',
        domain: 'dotter.me',
        hostedZoneId: 'ZJTFOAONAB55L',
        sslCertificate: 'arn:aws:acm:us-east-1:313649724274:certificate/0338aaac-4e25-4313-81e1-a801df00e2cc',
        deployOptions: {
            cacheClusterEnabled: false,
            dataTraceEnabled: false,
            // cacheClusterSize: '0.5',
            // cacheTtlSeconds: 3600,
            metricsEnabled: true,
            loggingLevel: apigateway.MethodLoggingLevel.INFO,
            throttlingBurstLimit: 50,
            throttlingRateLimit: 100
        }
    },
    dev: {
        vpcId: 'vpc-0f0c615eae5d2aded',
        domain: 'dotter-dev.me',
        hostedZoneId: 'Z3O3Q2CPUGBU7F',
        sslCertificate: 'arn:aws:acm:us-east-1:928536309678:certificate/bd8fb946-f396-415e-bf9a-abe3a7a45d31',
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.INFO,
            dataTraceEnabled: false,
            cacheClusterEnabled: false,
            metricsEnabled: false,
            throttlingBurstLimit: 5,
            throttlingRateLimit: 10
        }
    }
}
