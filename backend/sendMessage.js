const AWS = require("aws-sdk");
const secretName = "MyWebSocketApi";
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { Translate } = require("@google-cloud/translate").v2;
const secretsManager = new AWS.SecretsManager();
const projectId = "serverless-project-392613";
const credentials = {
  type: "service_account",
  project_id: "serverless-project-392613",
  private_key_id: "01d0adf62c6678a96e824a94a6ea68b2c2a9a025",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQClIMct1g7pTzjO\nlo+N9VLrHwSe5O2YhT23e6MEvvP1GfCryjtHAd3bi/yVGfqNnVf4tJ6v1n2riXJP\n+P2f5k6GhgELhWaOt1R0PabozqIyGQ14AAHSPNtCZolkh7gTZ2DDR8dcy1n5fmdJ\nBOi/vN7zx1xMu5dXQSW+3vsoTOu4Z/mtboP1zmA+FfRJVzHTH6HO3JAslKRqQ/DN\njQreiPIMN1KNanr7afNxBpLuJNhe11BlRRb8t8Q0c+yXFtDROaRWa0xMdxxE1Ckk\n0NA1q653DLx+69AXpSTV9j3Zc5RUJRHt/u947EjTV0ZT0u83t0fDATliAkPrIIcr\nZ2YdndWBAgMBAAECggEAPGkJdVNikShSeAHM8vpVI39tiVPnOG1GbuHkedACICEl\nUzPhC9E7AR7tgP7IExcFIA+0HlAyGZdnIqrM3rq676wGpdhf9MZNN1l2vqUZ4YoY\ny1X1VJy++kPY79ZXGYIwfEC+Rsx+VjBQSP5qx/qo9jZxJgFbFKjYzkN1TwEVG5kX\nfg6DKYg4WPwffVBGKHHQMobISUE+k7e3H7GOnqGfaQVNkqMbdYl+hDJQW+tdOFgb\nxC3EGWDAtMB82eKiHVxS8sSZDiDfdfx52VQ2r4oMvpuBFjES6acd3fggGA1I15IF\nKuIujvSU5GW8WveKXLJTid+cL0iPWyqteIpw4XDbIQKBgQDdU5V8U7mHAsxk043A\n2hpO4rOQfi1dRkv3IOFVEJMbnJ9nvzm0rgU8n9XoT006+YLeYianbp/dCL+dR+Tz\nu575EdCnDdYyGM/9T8svLn/Ft5hFeC22RXWrQV7kDNqMTo6+4EhEacEo97jvWVF6\nVRqATceietqVLYjy9WWecF8XQwKBgQC+/1NAQ+nywklibdhwHGJsapc+jI+uyS/P\nDo2pKRl6aWSYdl9u/1prrF2iLtGJtbzIft/SIy7F4lEfG5t74L8jt9a9TbojleS9\nJyFN9f6XbBVlqxCwYptdKsdgdcFBB5tQRI8weKCIvd1e6jwKJuW5Z4Y7FvBYg2Z0\n0/J5kANp6wKBgQDFOHkJW5YEH9NAuV8kjXVJ/CtkQ3trFXwV0B/a7DUaMru8+CKU\nxUj3V7qGEzxPpA0g2zd0lVgw313X6juzkOm9KknSwrqu03trT1JQTdAfwFUY+llJ\nhaWwIEVNU8LfqhT7M+JRzCcKuYv7BI1dRD6kPCr7txvWOMhDL7cIszuY/wKBgQCN\nZey2GRErnVZCvluLtBfRd5/8uIbuuRbhzT5my3yHOVs12/yO6hCAwhyXot2Re7AF\nJpiAs3c/HGs+Amw7a4lV4hXiE5cIHUI4Hq3zT3hplaTJnbk/O+EVOkRcTxEBGaaL\n6BWxprwCP72RNQu54E4V0mR3fmX0wWKqfvZ1tH4yfQKBgCuQjLNc19/IfRljNJVx\nvh1hVUJ1437Uq7UT3a9g3ptrEznjkoTRiZSvY7dUVRUAVPSvq8/HlWnXnfL3G6uC\nWXGb4ABJw0lPaNxPi21Qce/xQ0O1tzzqcMmEJt9W7zSeCjlTNiiZcAA4tk/0qMR4\nJT6m4i1DQNycnBrTEcZo2SOG\n-----END PRIVATE KEY-----\n",
  client_email: "serverless-project-392613@appspot.gserviceaccount.com",
  client_id: "116249229907374514211",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/serverless-project-392613%40appspot.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const translate = new Translate({ projectId, credentials });
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
  const nanoid = await import("nanoid");
  const { connectionId } = event.requestContext;
  const { gameId, name, chat, time } = JSON.parse(event.body);
  const generatedId = nanoid.customAlphabet(
    "1234567890abcdefghijklmnopqrstuvwxyz",
    6
  );
  try {
    const [[chaten], [chatfr], [chatru], [chathi], [chattr]] =
      await Promise.all([
        translate.translate(chat, "en"),
        translate.translate(chat, "fr"),
        translate.translate(chat, "ru"),
        translate.translate(chat, "hi"),
        translate.translate(chat, "tr"),
      ]);
    await sendToAll(gameId, {
      origin: "sendMessage",
      gameId: gameId,
      name: name,
      chat: chat,
      chaten: chaten,
      chatfr: chatfr,
      chatru: chatru,
      chathi: chathi,
      chattr: chattr,
      time: time,
      id: generatedId(),
      senderId: connectionId,
      message: `A new message by ${name}`,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Guessed send to lobby successfully" }),
    };
  } catch (e) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }
};
