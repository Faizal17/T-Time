exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  return {
    statusCode: 200,
    body: JSON.stringify({ connectionId, message: "Connected successfully!" }),
  };
};
