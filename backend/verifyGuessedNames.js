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
  const { guessId, guessName, guessNameType, guessStatus, userId, gameId } =
    JSON.parse(event.body);

  if (guessStatus === false) {
    await sendToAll(gameId, {
      origin: "verifyGuessedNames",
      guessId,
      guessStatus,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Guess verified" }),
    };
  } else {
    const userparams = {
      TableName: "users",
      Key: {
        id: userId,
      },
      UpdateExpression: "SET score = score + :increment",
      ExpressionAttributeValues: {
        ":increment": 15,
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const res = await dynamodb.update(userparams).promise();
      const user = res.Attributes;
      await sendToAll(gameId, {
        origin: "verifyGuessedNames",
        guessNameType,
        guessId,
        guessName,
        guessStatus,
        message: `${user.name} guessed ${guessName} correct!`,
        winnerUser: user,
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Guess verified" }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error verifying guess" }),
      };
    }
  }
};
