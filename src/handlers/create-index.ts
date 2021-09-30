import { S3Handler } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { load } from 'cheerio'

export const handler: S3Handler = async(event) => {

    const table = process.env.TABLE ?? ''

    if (!table) {
        throw new Error('table must be defined')
    }

    const objects = event.Records.map(r => ({
        Key: r.s3.object.key,
        Bucket: r.s3.bucket.name
    }))

    const s3 = new S3()

    while(objects.length > 0) {
        const obj = objects.pop()


        if (obj !== undefined) {
            const { Bucket, Key } = obj

            const resp = await s3.getObject({
                Bucket,
                Key
            }).promise()
            const html = resp.Body?.toString()
            
            if (html) {
                const $ = load(html)
                const content = $('body').text()
            }
        }
    }

}
