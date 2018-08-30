const {
  Request,
  Annotation
} = require("zipkin");
const initalizeZipkin = require("./src/initalizeZipkin");
const _ = require("lodash");
export default (zipkinUrl, _remoteServiceName, _serviceName) =>
  req => {
    if (!zipkinUrl || zipkinUrl.length > 0 && zipkinUrl.trim() === "") {
      throw new Error("zipkin destination url should be valid");
    }
    let zipkinInstance = initalizeZipkin.default;
    let {
      tracer,
      serviceName = (_serviceName) ? _serviceName : "unknwown",
      remoteServiceName
    } = zipkinInstance(zipkinUrl, _remoteServiceName);
    let traceId = null;
    tracer.scoped(function() {
      tracer.setId(tracer.createChildId());
      traceId = tracer.id;
      const wrappedOptions = Request.addZipkinHeaders(req, traceId);
      let method = wrappedOptions.method || "GET";
      if (!_serviceName) {
        let modifiedServiceName = req.url;
        if (req.url) {
          let tempUrl = req.url;
          let splitUrls = _.split(tempUrl, "/");
          if (splitUrls.length > 0) {
            let lastVal = splitUrls[splitUrls.length - 1];
            let host = splitUrls.length >= 3 ? splitUrls[2] : tempUrl;
            splitUrls[splitUrls.length - 1] = _.split(lastVal, "?")[0];
            let callName = splitUrls.length >= 3 ? _.join(_.drop(splitUrls, 3), "/") : tempUrl;
            modifiedServiceName = `host: ${host} - call: ${callName}`;
          }
          serviceName = modifiedServiceName;
        }
      }
      tracer.recordServiceName(serviceName);
      tracer.recordRpc(method.toUpperCase());
      tracer.recordBinary("http.url", wrappedOptions.uri || wrappedOptions.url);
      tracer.recordAnnotation(new Annotation.ClientSend());
      //tracer.recordAnnotation(new Annotation.LocalAddr());
      if (remoteServiceName) {
        tracer.recordAnnotation(new Annotation.ServerAddr({
          serviceName: remoteServiceName
        }));
      }
      _.assign(req.header, wrappedOptions.headers);
    });
    req.on("end", () => {
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordBinary("http.status_code", req.xhr.status.toString());
        tracer.recordAnnotation(new Annotation.ClientRecv());
      });
    });
    req.on("error", (err) => {
      const timeoutStatus = 314;
      if (err.status === timeoutStatus) {
        try {
          location.href = `${window.baseRequestURLRZR}/rapi/logout`;
        } catch (newLocationErr) {
          console.error("error in finding new location");
          //location.href = window.location.origin;
        }
        throw new Error("Session timed out");
      } else if (err.originalError && err.originalError.status === timeoutStatus) {
        try {
          location.href = `${window.baseRequestURLRZR}/rapi/logout`;
        } catch (newLocationErr) {
          console.error("error in finding new location");
          //location.href = window.location.origin;
        }
        throw new Error("Session timed out");
      } else {
        console.info("Error in middleware API", err);
        throw err;
      }
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordBinary("request.error", err);
        tracer.recordAnnotation(new Annotation.ClientRecv());
      });
    });
  };