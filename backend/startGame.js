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
  const { gameId } = JSON.parse(event.body);
  const userparams = {
    TableName: "users",
    FilterExpression: "gameId = :gameId AND currentRound = :currentRound",
    ExpressionAttributeValues: {
      ":gameId": gameId,
      ":currentRound": 1,
    },
    ProjectionExpression: "id",
  };
  let result = [];
  try {
    result = await dynamodb.scan(userparams).promise();
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error starting game" }),
    };
  }

  let items = result.Items;

  // atleast two persons required for this game
  if (items.length > 1) {
    const selectorObj = items[Math.floor(Math.random() * items.length)];
    const selectorId = selectorObj.id;

    const userparams = {
      TableName: "users",
      Key: {
        id: selectorId,
      },
      UpdateExpression: "SET currentRound = currentRound + :increment",
      ExpressionAttributeValues: {
        ":increment": 1,
      },
      ReturnValues: "ALL_NEW",
    };

    const gameparams = {
      TableName: "games",
      Key: {
        id: gameId,
      },
      UpdateExpression:
        "SET selectorId = :selectorId, hasStarted = :hasStarted, currentRound = :currentRound",
      ExpressionAttributeValues: {
        ":selectorId": selectorId,
        ":hasStarted": true,
        ":currentRound": 1,
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const res = await dynamodb.update(userparams).promise();
      const user = res.Attributes;
      const gameres = await dynamodb.update(gameparams).promise();
      const game = gameres.Attributes;
      await sendToAll(gameId, {
        origin: "startGame",
        message: `${user.name} is the new selector`,
        selector: user,
        gameDetails: game,
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Game started successfully" }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error starting game" }),
      };
    }
  } else {
    await sendToOne(connectionId, {
      origin: "error",
      message: "Atleast two players are required to start the game!",
    });
    return {
      statusCode: 500,
      body: JSON.stringify("This game atleast needs two player to begin"),
    };
  }
};
