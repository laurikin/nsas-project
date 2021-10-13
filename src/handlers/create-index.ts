import { S3Handler } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { load } from 'cheerio'
import { DynamoDB } from 'aws-sdk'
import { tokenize } from '../tokenize'
import { tf } from '../tf'

export const handler: S3Handler = async(event) => {

    console.log(JSON.stringify(event, null, 2))

    const dynamodb = new DynamoDB()
    const TableName = process.env.TABLE ?? ''

    if (!TableName) {
        throw new Error('table must be defined')
    }

    const obj = event.Records.map(r => ({
        Key: decodeURIComponent(r.s3.object.key),
        Bucket: r.s3.bucket.name
    }))[0]

    const s3 = new S3()


    const { Bucket, Key } = obj

    console.log('Key', Key)

    const resp = await s3.getObject({
        Bucket,
        Key
    }).promise()
    const html = resp.Body?.toString('utf-8')

    const $ = load(html ?? '')
    $('script').remove()
    const body = $('body')
    const content = body.text()

    console.log('content', content)

    const tokenArr = tokenize(content)
    const tfs = tf(tokenArr)

    const tokens = Array.from(tfs.keys())

    while (tokens.length > 0) {
        const token = tokens.pop() ?? ''
        console.log('token', token)
        console.log('count', tfs.get(token))

        try {
            await dynamodb.updateItem({
                TableName,
                Key: {
                    token: {
                        S: token
                    },
                    source: {
                        S: Key
                    }
                },
                AttributeUpdates: {
                    count: {
                        Action: 'PUT',
                        Value: {
                            N: tfs.get(token)?.toString() ?? '0'
                        }
                    }
                }
            }).promise()
        } catch (e) {
            console.error(e)
            throw (e)
        }
    }



}

