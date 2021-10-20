import { SQSHandler } from "aws-lambda"
import { S3 } from 'aws-sdk'
import { SQS }  from 'aws-sdk'
import fetch from 'node-fetch'

export const handler: SQSHandler = async(event) => {

    console.log(event)

    const Bucket = process.env.BUCKET ?? ''
    const QueueUrl = process.env.QUEUE ?? ''

    if (!QueueUrl) {
        throw new Error('queue url must be defined')
    }

    if (!Bucket) {
        throw new Error('bucket must be defined')
    }

    const sqs = new SQS()
    const s3 = new S3()

    const urls = event.Records
        .map(r => r.body)

    while (urls.length > 0) {
        const url = urls.pop() ?? ''

        const html = await fetch(url)
            .then(r => r.text())

        if (url?.length > 0) {

            const Key = encodeURIComponent(url)

            await s3.putObject({
                Bucket,
                Key,
                Body: html
            }).promise()

            /*
                Send bucket and key to sqs queue
            */
            await sqs.sendMessage({
                QueueUrl,
                MessageBody: JSON.stringify({
                    Bucket,
                    Key
                })
            }).promise()

        }
    }

}
