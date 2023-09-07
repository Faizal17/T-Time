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

const sendToAll = async (gameId, user, connectionId, gameDetails, body) => {
  const userparams = {
    TableName: "users",
    FilterExpression: "gameId = :gameId",
    ExpressionAttributeValues: {
      ":gameId": gameId,
    },
  };
  const result = await dynamodb.scan(userparams).promise();
  let items = result.Items;
  await sendToOne(connectionId, {
    origin: "connect",
    message: `${user.Item.name} has joined the lobby`,
    newPlayer: user.Item,
    totalPlayers: items,
    gameDetails: gameDetails,
  });
  const all = items.map((i) => sendToOne(i.id, body));
  return Promise.all(all);
};

exports.handler = async (event, context) => {
  const { connectionId } = event.requestContext;
  const { gameId, name } = JSON.parse(event.body);

  const gameparams = {
    TableName: "games",
    Key: {
      id: gameId,
    },
    FilterExpression: "hasStarted = :hasStarted",
    ExpressionAttributeValues: {
      ":hasStarted": false,
    },
  };

  const userparams = {
    TableName: "users",
    Item: {
      id: connectionId,
      name,
      score: 0,
      currentRound: 1,
      gameId,
    },
  };

  try {
    let res = await dynamodb.get(gameparams).promise();
    if (!res.Item) {
      await sendToOne(connectionId, {
        message: `${gameId} group doesn't exists or the game has already started`,
        origin: "error",
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "No such group exists" }),
      };
    }
    await dynamodb.put(userparams).promise();
    await sendToAll(gameId, userparams, connectionId, res.Item, {
      message: `${userparams.Item.name} has joined the lobby`,
      newPlayer: userparams.Item,
      origin: "newPlayerConnect",
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User joined the lobby successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error creating entry" }),
    };
  }
};
