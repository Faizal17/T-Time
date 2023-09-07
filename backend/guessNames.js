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
  const nanoid = await import("nanoid");
  const { connectionId } = event.requestContext;
  const { gameId, actorName, actressName, movieName, roundId } = JSON.parse(
    event.body
  );
  const userparams = {
    TableName: "users",
    Key: {
      id: connectionId,
    },
  };

  const gameparams = {
    TableName: "games",
    Key: {
      id: gameId,
    },
  };

  try {
    let gameres = await dynamodb.get(gameparams).promise();
    const result = await dynamodb.get(userparams).promise();
    const user = result.Item;
    const generatedId = nanoid.customAlphabet(
      "1234567890abcdefghijklmnopqrstuvwxyz",
      8
    );
    if (user) {
      if (actorName !== undefined) {
        await sendToAll(gameId, {
          origin: "guessNames",
          type: "actorName",
          message: `guessed by ${user.name}`,
          roundId: roundId,
          userId: user.id,
          guessName: actorName,
          guessId: generatedId(),
          selectorId: gameres.Item.selectorId,
        });
      }

      if (actressName !== undefined) {
        await sendToAll(gameId, {
          origin: "guessNames",
          type: "actressName",
          message: `guessed by ${user.name}`,
          roundId: roundId,
          userId: user.id,
          guessName: actressName,
          guessId: generatedId(),
          selectorId: gameres.Item.selectorId,
        });
      }

      if (movieName !== undefined) {
        await sendToAll(gameId, {
          origin: "guessNames",
          type: "movieName",
          message: `guessed by ${user.name}`,
          roundId: roundId,
          userId: user.id,
          guessName: movieName,
          guessId: generatedId(),
          selectorId: gameres.Item.selectorId,
        });
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Guessed send to lobby successfully" }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error getting item" }),
    };
  }
};
