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

  let gameparams = {
    TableName: "games",
    Key: {
      id: gameId,
    },
  };

  try {
    let res = await dynamodb.get(gameparams).promise();
    let game = res.Item;

    let userparams = {
      TableName: "users",
      FilterExpression: "gameId = :gameId AND currentRound = :currentRound",
      ExpressionAttributeValues: {
        ":gameId": gameId,
        ":currentRound": game.currentRound,
      },
      ProjectionExpression: "id",
    };
    let result = await dynamodb.scan(userparams).promise();
    let items = result.Items;

    if (items.length == 0 && game.currentRound == game.totalRound) {
      await sendToAll(gameId, {
        origin: "endGame",
        hasCompleted: true,
        message: "Game has finished",
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Game has finished" }),
      };
    }

    if (items.length == 0) {
      let gameparams = {
        TableName: "games",
        Key: {
          id: gameId,
        },
        UpdateExpression: "SET currentRound = currentRound + :increment",
        ExpressionAttributeValues: {
          ":increment": 1,
        },
        ReturnValues: "ALL_NEW",
      };
      res = await dynamodb.update(gameparams).promise();
      game = res.Item;

      userparams = {
        TableName: "users",
        FilterExpression: "gameId = :gameId AND currentRound = :currentRound",
        ExpressionAttributeValues: {
          ":gameId": gameId,
          ":currentRound": game.currentRound,
        },
        ProjectionExpression: "id",
      };
      result = await dynamodb.scan(userparams).promise();
      items = result.Items;
    }

    const selectorObj = items[Math.floor(Math.random() * items.length)];
    const selectorId = selectorObj.id;

    userparams = {
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

    gameparams = {
      TableName: "games",
      Key: {
        id: gameId,
      },
      UpdateExpression: "SET selectorId = :selectorId",
      ExpressionAttributeValues: {
        ":selectorId": selectorId,
      },
      ProjectionExpression: "id",
    };
    await dynamodb.update(gameparams).promise();
    const gameres = await dynamodb.update(userparams).promise();
    const user = gameres.Attributes;
    await sendToAll(gameId, {
      origin: "nextRound",
      hasCompleted: false,
      message: `${user.name} is the new selector`,
      selector: user,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Game started successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error starting next round" }),
    };
  }
};
