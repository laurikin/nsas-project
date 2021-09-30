#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { SearchEngineStack } from '../lib/search-engine-stack';

const app = new cdk.App();

new SearchEngineStack(app, 'search-engine', {
    env: {
        region: 'eu-west-1',
        account: '979823966345'
    }
});

