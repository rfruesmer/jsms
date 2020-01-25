import { JsmsService } from "./jsms-service";

export class JsmsServiceLocator {
    /**
     *  The findService() function begins the process of searching for the
     *  JSMS service instance. The function takes in a parameter that
     *  represents the current window. The function is built to search in a
     *  specific order through openers and parents and stop when the service
     *  instance is found.
     */
    public static findService(window: any): JsmsService {
        if (window.messageService) {
            return window.messageService;
        }

        if (window.opener) {
            return JsmsServiceLocator.findService(window.opener);
        }

        if (window !== window.parent) {
            return JsmsServiceLocator.findService(window.parent);
        }

        throw new Error("message service instance not found");
    }
}

