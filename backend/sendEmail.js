const AWS = require("aws-sdk");
const secretName = "MyWebSocketApi";
const secretsManager = new AWS.SecretsManager();
const sns = new AWS.SNS({ region: "us-east-1" });

const sendToOne = async (id, body) => {
  try {
    const secretData = await secretsManager
      .getSecretValue({ SecretId: secretName })
      .promise();
    const secretValue = JSON.parse(secretData.SecretString);
    const ENDPOINT =
      secretValue.ApiId + ".execute-api.us-east-1.amazonaws.com/production/";
    const client = new AWS.ApiGatewayManagementApi({ endpoint: ENDPOINT });
    await client
      .postToConnection({
        ConnectionId: id,
        Data: Buffer.from(JSON.stringify(body)),
      })
      .promise();
  } catch (err) {
    console.error(err);
  }
};

exports.handler = async (event, context) => {
  const { connectionId } = event.requestContext;
  const { gameId, body, email } = JSON.parse(event.body);

  const topicArn = "arn:aws:sns:us-east-1:858458372151:tTimeCF";

  try {
    const isExisting = await checkSubscription(email);
    if (!isExisting) {
      const attributes = {
        email: [email],
      };
      const subscriptionResponse = await sns
        .subscribe({
          TopicArn: topicArn,
          Protocol: "email",
          Endpoint: email,
          Attributes: {
            FilterPolicy: JSON.stringify(attributes), // Convert the attributes to a JSON string
          },
        })
        .promise();
      await sendToOne(connectionId, {
        origin: "sendEmail",
        message: "Please verify your email to get the results",
      });
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Please verify your email to get the results",
        }),
      };
    }

    const messageAttributes = {
      email: {
        DataType: "String",
        StringValue: email,
      },
    };

    await sns.publish(
      {
        TopicArn: topicArn,
        Message: body,
        Subject: "Results for game " + gameId,
        MessageAttributes: messageAttributes,
      },
      (err, data) => {
        if (err) {
        } else {
          console.log("Message published:", data);
        }
      }
    );
    await sendToOne(connectionId, {
      origin: "sendEmail",
      message: "Results sent to " + email + " successfully",
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Email not sent" }),
    };
  }
};

async function checkSubscription(email) {
  try {
    const topicArn = "arn:aws:sns:us-east-1:858458372151:tTimeCF";

    // List all subscriptions for the specified SNS topic
    const response = await sns
      .listSubscriptionsByTopic({ TopicArn: topicArn })
      .promise();

    // Check if the email is already subscribed to the topic
    const isSubscribed = response.Subscriptions.some(
      (subscription) =>
        subscription.Protocol === "email" && subscription.Endpoint === email
    );
    return isSubscribed;
  } catch (error) {
    throw error;
  }
}
