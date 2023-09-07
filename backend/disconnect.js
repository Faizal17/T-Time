const AWS = require("aws-sdk");
const secretName = "MyWebSocketApi";
const secretsManager = new AWS.SecretsManager();
const dynamodb = new AWS.DynamoDB.DocumentClient();

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

const sendToAll = async (gameId, body) => {
  const userparams = {
    TableName: "users",
    FilterExpression: "gameId = :gameId",
    ExpressionAttributeValues: {
      ":gameId": gameId,
    },
    ProjectionExpression: "id",
  };
  const result = await dynamodb.scan(userparams).promise();
  let items = result.Items;
  const all = items.map((i) => sendToOne(i.id, body));
  return Promise.all(all);
};

exports.handler = async (event, context) => {
  const { connectionId } = event.requestContext;

  try {
    const userparams = {
      TableName: "users",
      Key: {
        id: connectionId,
      },
    };
    const result = await dynamodb.get(userparams).promise();
    const item = result.Item;
    if (item) {
      await dynamodb.delete(userparams).promise();
      await sendToAll(item.gameId, {
        origin: "disconnect",
        message: `${item.name} has left the lobby`,
        removedUser: item,
      });
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Entry deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting entry:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error deleting entry" }),
    };
  }
};
