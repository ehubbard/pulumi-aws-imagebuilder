import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Upload a YAML build config as an S3 resource
const yamlBuildBucket = new aws.s3.Bucket("build-config");
const buildBucketName = "testBuildConfig";
const bucketObject = new aws.s3.BucketObject(
    buildBucketName,
    {
        acl: "public-read",
        bucket: yamlBuildBucket,
        contentType: "text/x-yaml",
        source: new pulumi.asset.FileAsset("build-config.yaml")
    }
);

// Export bucket uri
export const buildBucketUri = pulumi.interpolate`s3://${yamlBuildBucket.id}/${buildBucketName}`;

// Create build component
const testBuildComponent = new aws.imagebuilder.Component(
    "testBuildComponent",
    {
        platform: "Windows",
        version: "0.1.0",
        // can specify exactly one out of data and uri attributes. data should be in YAML format; uri should be an S3 uri to a component containing YAML spec)
        uri: buildBucketUri
    }
);

// Create an image recipe using above build component
const testImageRecipe = new aws.imagebuilder.ImageRecipe(
    "testImageRecipe",
    {
        components: [{
            componentArn: testBuildComponent.arn
        }],
        parentImage: "arn:aws:imagebuilder:us-east-1:aws:image/windows-server-2019-english-full-base-x86/x.x.x",
        version: "0.1.0"
    }
)

// Create image pipeline using above image recipe and separately created infrastructure config
const testImagePipeline = new aws.imagebuilder.ImagePipeline(
    "testPulumiImagePipeline",
    {
        imageRecipeArn: testImageRecipe.arn,
        infrastructureConfigurationArn: "arn:aws:imagebuilder:us-east-1:271428618339:infrastructure-configuration/first-infra-config",
        schedule: {
            scheduleExpression: "cron(0 0 ? * 7 *)"
        }
    }
);

// Export image pipeline arn
export const imageRecipeArn = testImagePipeline.arn;