import {BatchRecorder} from "zipkin";
import {HttpLogger} from "zipkin-transport-http";
export default (zipkinUrl) => {
  if (!zipkinUrl || zipkinUrl.length > 0 && zipkinUrl.trim() === "") {
    throw new Error("zipkin destination url should be valid");
  }
  return new BatchRecorder({
    logger: new HttpLogger({
      endpoint: `${zipkinUrl}/api/v1/spans`
    })
  });
};