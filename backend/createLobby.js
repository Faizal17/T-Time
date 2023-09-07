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
exports.handler = async (event, context) => {
  const nanoid = await import("nanoid");
  const { connectionId } = event.requestContext;
  const { totalRound, name } = JSON.parse(event.body);
  const generatedId = nanoid.customAlphabet(
    "1234567890abcdefghijklmnopqrstuvwxyz",
    6
  );
  const gameparams = {
    TableName: "games",
    Item: {
      id: generatedId(),
      creatorId: connectionId,
      selectorId: "",
      currentRound: 0,
      totalRound: totalRound,
      movieName: "",
      actorName: "",
      actressName: "",
      hasStarted: false,
      createdAt: Date.now(),
    },
  };

  const userparams = {
    TableName: "users",
    Item: {
      id: connectionId,
      name,
      score: 0,
      currentRound: 1,
      gameId: gameparams.Item.id,
    },
  };

  try {
    await dynamodb.put(userparams).promise();
    await dynamodb.put(gameparams).promise();
    await sendToOne(connectionId, {
      origin: "connect",
      message: `${userparams.Item.name} has joined the lobby`,
      newPlayer: userparams.Item,
      totalPlayers: [userparams.Item],
      gameDetails: gameparams.Item,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Entry created successfully" }),
    };
  } catch (error) {
    console.error("Error creating entry:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error creating entry" }),
    };
  }
};
