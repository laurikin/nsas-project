import { Lambda } from 'aws-sdk';

const lambda = new Lambda({
    apiVersion: '2015-03-31',
    region: 'eu-west-1'
});

const feedUrl = process.argv[2];

if (!feedUrl) {
    console.error('You must pass in a feed url');
    process.exit(400);
}

lambda.invoke({
    FunctionName: 'search-engine_add-feed',
    Payload: JSON.stringify({
        feedUrl
    })
})
    .promise()
    .then((resp) => {
        if (resp.FunctionError) {
            console.error(resp.FunctionError);
            console.error(resp.StatusCode);
            console.error(resp.Payload);
            process.exit(1);
        } else {
            process.exit(0);
        }
    })
    .catch((e) => {
        console.error(e.message);
        process.exit(500);
    });
