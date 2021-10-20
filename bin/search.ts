import { Lambda } from 'aws-sdk';

const lambda = new Lambda({
    apiVersion: '2015-03-31',
    region: 'eu-west-1'
});

const text = process.argv[2]

if (!text) {
    console.error('Please include some keywords');
    process.exit(1)
}

lambda.invoke({
    FunctionName: 'search-engine_search',
    Payload: JSON.stringify({
        text
    })
})
    .promise()
    .then((resp) => {
        if (resp.FunctionError) {
            console.error(resp.FunctionError)
            console.error(resp.StatusCode)
            console.error(resp.Payload);
            process.exit(1)
        } else {
            const results = resp?.Payload?.toString('utf-8')
            if (results) {
                const feeds: any[] = JSON.parse(results)
                feeds.forEach((feed) => {
                    const s = feed.doc
                    console.log(s)
                })
            }
            process.exit(0);
        }
    })
    .catch((e) => {
        console.error(e.message);
        process.exit(1);
    });

