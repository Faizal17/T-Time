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

//Todo list:

exports.handler = async (event, context) => {
  const { connectionId } = event.requestContext;
  const { gameId, actorName, actressName, movieName } = JSON.parse(event.body);
  const gameparams = {
    TableName: "games",
    Key: {
      id: gameId,
    },
    UpdateExpression:
      "SET actorName = :actorName, actressName = :actressName, movieName = :movieName",
    ExpressionAttributeValues: {
      ":actressName": actressName,
      ":actorName": actorName,
      ":movieName": movieName,
      ":selectorId": connectionId,
    },
    ConditionExpression: "attribute_exists(id) AND selectorId = :selectorId",
    ReturnValues: "ALL_NEW",
  };

  console.log(gameparams);
  try {
    const res = await dynamodb.update(gameparams).promise();
    let game = res.Attributes;
    game.actressName = game.actressName.substr(0, 1);
    game.actorName = game.actorName.substr(0, 1);
    game.movieName = game.movieName.substr(0, 1);
    await sendToAll(gameId, {
      origin: "addNames",
      message: `Words are selected`,
      gameDetails: game,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Game started successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error adding names" }),
    };
  }
};
