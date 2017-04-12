import {Tracer, ExplicitContext} from "zipkin";
import record from "./recorder";
let zipkinTracer = null;
export default function initalizeZipkin(zipkinUrl, remoteServiceName) {
  if (!zipkinTracer) {
    const ctxImpl = new ExplicitContext();
    const recorder = record(zipkinUrl);
    const tracer = new Tracer({ctxImpl, recorder}); // configure your tracer properly here
    zipkinTracer = {tracer, remoteServiceName: remoteServiceName};
  }
  return zipkinTracer;
}
