import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

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

export const imagePipelineName = testImagePipeline.id;