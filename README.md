# Steps to deploy the project

1. Make sure your AWS user has the sufficient permissions to create the resources defined in lib/search-engine-stack
2. Install dependencies by running `npm install`
3. Build the project by running `npm run build`
4. Deploy the project to your AWS account `npm run cdk deploy search-engine`

# Using the system

## Adding feeds

npm run add-feed [feed-url]

## Searching

npm run search '[list of keywords]'
