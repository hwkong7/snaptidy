import path from "node:path";
import { pathToFileURL } from "node:url";
import { net, protocol } from "electron";
import { isImage } from "./lib/images";

// 로컬 이미지 전용 프로토콜: snaptidy://local/<encodeURIComponent(절대경로)>
// file:// 를 직접 열지 않고 이미지 파일만 읽게 해서 webSecurity 를 켜 둘 수 있다.
const SCHEME = "snaptidy";

/** app ready 전에 호출해야 한다 */
export function registerSchemePrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
}

/** app ready 후에 호출 */
export function registerImageProtocol(): void {
  protocol.handle(SCHEME, (request) => {
    try {
      const { pathname } = new URL(request.url);
      const filePath = decodeURIComponent(pathname.slice(1));
      if (!path.isAbsolute(filePath) || !isImage(filePath)) {
        return new Response("Forbidden", { status: 403 });
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
  });
}
