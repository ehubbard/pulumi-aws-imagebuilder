import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";

// Upload a YAML build config as an S3 resource
const yamlBuildBucket = new aws.s3.Bucket("build-config");
const buildBucketName = "testBuildConfig";
const bucketObject = new aws.s3.BucketObject(
    buildBucketName,
    {
        acl: "public-read",
        bucket: yamlBuildBucket,
        content: fs.readFileSync("build-config.yaml").toString(),
        contentType: "text/x-yaml"
    }
);

// Export bucket uri
export const buildBucketUri = pulumi.interpolate`s3://${yamlBuildBucket.id}/${buildBucketName}`;
// the Pulumi bucket object doesn't have an s3 uri attribute. the format is above. desired result: "s3://build-config-029b0ff/testBuildConfig"
// export const buildBucketUri = pulumi.interpolate`s3://${yamlBuildBucket.id}/${yamlBuildBucket.bucket}`; // this one should work but .bucket is returning the same is .id :S shouldn't. should return the name I set.

// Create build component
const testBuildComponent = new aws.imagebuilder.Component(
    "testBuildComponent",
    {
        platform: "Windows",
        version: "0.1.0",
        // for build steps, can either specify exactly one out of data (YAML format) or uri to the YAML file (S3 component)
        uri: buildBucketUri
    }
);

// create an image recipe using this build component
// TODO

// Create image pipeline using existing image recipe and infrastructure config
const testImagePipeline = new aws.imagebuilder.ImagePipeline(
    "testPulumiImagePipeline",
    {
        imageRecipeArn: "arn:aws:imagebuilder:us-east-1:271428618339:image-recipe/first-recipe/0.1.0",
        infrastructureConfigurationArn: "arn:aws:imagebuilder:us-east-1:271428618339:infrastructure-configuration/first-infra-config",
        schedule: {
            scheduleExpression: "cron(0 0 ? * 7 *)"
        }
    }
);



// Export image pipeline name
export const imagePipelineName = testImagePipeline.id;