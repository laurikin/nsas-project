import { SQSHandler } from "aws-lambda"
import { S3 } from 'aws-sdk'
import fetch from 'node-fetch'
import { load } from 'cheerio'

export const handler: SQSHandler = async(event) => {

    console.log(event)

    const Bucket = process.env.BUCKET ?? ''

    if (!Bucket) {
        throw new Error('bucket must be defined')
    }

    const s3 = new S3()

    const urls = event.Records
        .map(r => r.body)

    while (urls.length > 0) {
        const url = urls.pop() ?? ''

        const html = await fetch(url)
            .then(r => r.text())

        const $ = load(html)
        const content = $('body').text()

        if (url?.length > 0) {

            await s3.putObject({
                Bucket,
                Key: encodeURIComponent(url),
                Body: content
            }).promise()

        }
    }

}
