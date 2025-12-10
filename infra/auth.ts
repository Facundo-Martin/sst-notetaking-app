import { api } from "./api";
import { bucket } from "./storage";

const region = aws.getRegionOutput().name;

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  // We want our users to login with their email
  usernames: ["email"],
});

// Create a client for our User Pool.
// Since we only have a frontend we only need one. You can later add another if you add a mobile app for example.
export const userPoolClient = userPool.addClient("UserPoolClient");

export const identityPool = new sst.aws.CognitoIdentityPool("IdentityPool", {
  userPools: [
    {
      userPool: userPool.id,
      client: userPoolClient.id,
    },
  ],
  permissions: {
    authenticated: [
      {
        actions: ["s3:*"],
        resources: [
          $concat(
            bucket.arn,
            // A user has access to only their folder within the bucket.
            // This allows us to separate access to our user’s file uploads within the same S3 bucket.
            "/private/${cognito-identity.amazonaws.com:sub}/*"
          ),
        ],
      },
      {
        actions: ["execute-api:*"],
        resources: [
          $concat(
            "arn:aws:execute-api:",
            region,
            ":",
            aws.getCallerIdentityOutput({}).accountId,
            ":",
            api.nodes.api.id,
            "/*/*/*"
          ),
        ],
      },
    ],
  },
});
