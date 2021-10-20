import { Handler } from "aws-lambda"
import { DynamoDB } from 'aws-sdk'

interface AddPageInput {
    feedUrl: string
}

export const handler: Handler<AddPageInput> = async({ feedUrl }) => {

    const dynamodb = new DynamoDB()
    const TableName = process.env.TABLE ?? ''

    if (!TableName) {
        throw new Error('table must be defined')
    }

    if (!feedUrl) {
        throw new Error('feedUrl must be defined')
    }

    await dynamodb.updateItem({
        TableName,
        Key: {
            feedname: {
                S: feedUrl
            }
        },
        AttributeUpdates: {
            feedUrl: {
                Action: 'PUT',
                Value: {
                    S: feedUrl
                }
            }
        }
    }).promise()

}
