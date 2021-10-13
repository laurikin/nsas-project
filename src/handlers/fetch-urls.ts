import { Handler } from "aws-lambda"
import Parser from 'rss-parser'
import { SQS }  from 'aws-sdk'

export const handler: Handler = async({ feedUrl }: { feedUrl: string }) => {

    const QueueUrl = process.env.QUEUE ?? ''

    if (!QueueUrl) {
        throw new Error('queue url must be defined')
    }

    const sqs = new SQS()
    
    const parser = new Parser();

    const feed = await parser.parseURL(feedUrl);

    const urls = feed.items
        .filter(item => (item?.link?.length ?? 0) > 0)
        .map(item => item.link as string)

    console.log(urls)

    while (urls.length > 0) {

        // this is the largest batch size sqs supports
        const maxBatchSize = 10
        const batch = urls.splice(0, maxBatchSize)

        /*
          Send urls in batches of ten to the sqs queue
          for futher processing
        */
        await sqs.sendMessageBatch({
            QueueUrl,
            Entries: batch.map((b, i) => ({
                Id: i.toString(),
                MessageBody: b
            }))
        }).promise()
    }

}
