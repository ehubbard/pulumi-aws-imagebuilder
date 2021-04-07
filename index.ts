import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

// load in build config JSON
const buildConfig = require("./build-config.json");

// Create build component
const testBuildComponent = new aws.imagebuilder.Component(
    "testTrivialBuildComponent",
    {
        platform: "Windows",
        version: "0.1.0",
        data: JSON.stringify(buildConfig)
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

// Create an infrastructure configuration. The only required attribute is the name of an AWS IAM role
const testInfrastructureConfiguration = new aws.imagebuilder.InfrastructureConfiguration(
    "testInfrastructureConfiguration",
    {
        instanceProfileName: "test-user"
    }
)

// Create image pipeline using above image recipe and separately created infrastructure config
const testImagePipeline = new aws.imagebuilder.ImagePipeline(
    "testImagePipeline",
    {
        imageRecipeArn: testImageRecipe.arn,
        infrastructureConfigurationArn: testInfrastructureConfiguration.arn
    }
);

// Export image pipeline arn
export const imagePipelineArn = testImagePipeline.arn;

// Generate a UUID to use as client token for image pipeline execution request
const pipelineExecClientToken = new random.RandomString("pipelineExecClientToken", {
    length: 32,
    special: false
});

// Trigger pipeline execution once the pipeline exists and client token has been generated. Use pulumi.all().apply() to enable async operation
pulumi
    .all([testImagePipeline.arn, pipelineExecClientToken.result])
    .apply(([imagePipelineArn, clientToken]) => {
        (new aws.sdk.Imagebuilder())
        .startImagePipelineExecution(
            {
                imagePipelineArn,
                clientToken
            },
            err => console.log(err)
        );
        console.log("imagePipelineArn:", imagePipelineArn);
        console.log("clientToken:", clientToken);
    });
