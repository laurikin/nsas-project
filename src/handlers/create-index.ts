import { S3Handler } from 'aws-lambda'
import { S3, DynamoDB } from 'aws-sdk'
import { load } from 'cheerio'

const dynamodb = new DynamoDB({
    apiVersion: '2012-08-10',
    region: 'eu-west-1'
});

export const handler: S3Handler = async(event): Promise<any> => {

    const TableName = process.env.TABLE ?? ''

    if (!TableName) {
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
                const content = $('body')
                    .remove('script')
                    .text()

                const tokenMap = tokenize(content)

                const tokens = Object.keys(tokenMap)

                while(tokens.length > 0) {
                    const token = tokens.pop() ?? ''

                    await dynamodb.putItem({
                        TableName,
                        Item: {
                            token: {
                                S: token,
                            },
                            source: {
                                S: Key,
                            },
                            count: {
                                N: tokens[token] ?? 0
                            },
                            // locations: {
                            //     NS: ['2','3','29']
                            // }
                        }
                    }).promise()
                }


            }
        }
    }

}

/*
  remove extra whitespace and return a list of tokens
*/
const tokenize = (content: string): { [token: string]: number } => {
    const obj = {}
    
    const tokens = content
        .replace(/[^\S]+/, ' ')
        .split(' ')
        .map(t => t.trim())

    tokens.forEach(t => {
        obj[t] = obj[t] ?? 0
        obj[t] = obj[t] + 1
    })

    return obj
}
