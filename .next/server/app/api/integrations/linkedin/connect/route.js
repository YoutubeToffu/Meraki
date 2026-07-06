"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/integrations/linkedin/connect/route";
exports.ids = ["app/api/integrations/linkedin/connect/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&page=%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute.ts&appDir=C%3A%5CArnav_Projects%5CMeraki%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CArnav_Projects%5CMeraki&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&page=%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute.ts&appDir=C%3A%5CArnav_Projects%5CMeraki%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CArnav_Projects%5CMeraki&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Arnav_Projects_Meraki_src_app_api_integrations_linkedin_connect_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/integrations/linkedin/connect/route.ts */ \"(rsc)/./src/app/api/integrations/linkedin/connect/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/integrations/linkedin/connect/route\",\n        pathname: \"/api/integrations/linkedin/connect\",\n        filename: \"route\",\n        bundlePath: \"app/api/integrations/linkedin/connect/route\"\n    },\n    resolvedPagePath: \"C:\\\\Arnav_Projects\\\\Meraki\\\\src\\\\app\\\\api\\\\integrations\\\\linkedin\\\\connect\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Arnav_Projects_Meraki_src_app_api_integrations_linkedin_connect_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/integrations/linkedin/connect/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZpbnRlZ3JhdGlvbnMlMkZsaW5rZWRpbiUyRmNvbm5lY3QlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmludGVncmF0aW9ucyUyRmxpbmtlZGluJTJGY29ubmVjdCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmludGVncmF0aW9ucyUyRmxpbmtlZGluJTJGY29ubmVjdCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDQXJuYXZfUHJvamVjdHMlNUNNZXJha2klNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNBcm5hdl9Qcm9qZWN0cyU1Q01lcmFraSZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDb0M7QUFDakg7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tZXJha2kvPzk2NTYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcQXJuYXZfUHJvamVjdHNcXFxcTWVyYWtpXFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGludGVncmF0aW9uc1xcXFxsaW5rZWRpblxcXFxjb25uZWN0XFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9pbnRlZ3JhdGlvbnMvbGlua2VkaW4vY29ubmVjdC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2ludGVncmF0aW9ucy9saW5rZWRpbi9jb25uZWN0XCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9pbnRlZ3JhdGlvbnMvbGlua2VkaW4vY29ubmVjdC9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXEFybmF2X1Byb2plY3RzXFxcXE1lcmFraVxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxpbnRlZ3JhdGlvbnNcXFxcbGlua2VkaW5cXFxcY29ubmVjdFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvaW50ZWdyYXRpb25zL2xpbmtlZGluL2Nvbm5lY3Qvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&page=%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute.ts&appDir=C%3A%5CArnav_Projects%5CMeraki%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CArnav_Projects%5CMeraki&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/integrations/linkedin/connect/route.ts":
/*!************************************************************!*\
  !*** ./src/app/api/integrations/linkedin/connect/route.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_auth_helpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth-helpers */ \"(rsc)/./src/lib/auth-helpers.ts\");\n\n\nconst LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID ?? \"\";\nconst REDIRECT_URI = `${\"http://localhost:3000\"}/api/integrations/linkedin/callback`;\n// GET /api/integrations/linkedin/connect — Initiate LinkedIn OAuth\nasync function GET(_request) {\n    try {\n        await (0,_lib_auth_helpers__WEBPACK_IMPORTED_MODULE_1__.getRequiredSession)();\n        if (!LINKEDIN_CLIENT_ID) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"LinkedIn OAuth is not configured. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to your environment variables.\"\n            }, {\n                status: 503\n            });\n        }\n        // LinkedIn OAuth 2.0 scopes\n        // r_liteprofile: basic profile, r_emailaddress: email\n        // w_member_social: posting (optional)\n        const scopes = [\n            \"r_liteprofile\",\n            \"r_emailaddress\",\n            \"w_member_social\"\n        ].join(\" \");\n        const state = Buffer.from(JSON.stringify({\n            ts: Date.now()\n        })).toString(\"base64\");\n        const authUrl = new URL(\"https://www.linkedin.com/oauth/v2/authorization\");\n        authUrl.searchParams.set(\"response_type\", \"code\");\n        authUrl.searchParams.set(\"client_id\", LINKEDIN_CLIENT_ID);\n        authUrl.searchParams.set(\"redirect_uri\", REDIRECT_URI);\n        authUrl.searchParams.set(\"scope\", scopes);\n        authUrl.searchParams.set(\"state\", state);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(authUrl.toString());\n    } catch (error) {\n        try {\n            return (0,_lib_auth_helpers__WEBPACK_IMPORTED_MODULE_1__.handleAuthError)(error);\n        } catch  {}\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Auth required\"\n        }, {\n            status: 401\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9pbnRlZ3JhdGlvbnMvbGlua2VkaW4vY29ubmVjdC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBMEM7QUFDOEI7QUFFeEUsTUFBTUcscUJBQXFCQyxRQUFRQyxHQUFHLENBQUNGLGtCQUFrQixJQUFJO0FBQzdELE1BQU1HLGVBQWUsQ0FBQyxFQUFFRix1QkFBK0IsQ0FBQyxtQ0FBbUMsQ0FBQztBQUU1RixtRUFBbUU7QUFDNUQsZUFBZUksSUFBSUMsUUFBaUI7SUFDekMsSUFBSTtRQUNGLE1BQU1SLHFFQUFrQkE7UUFFeEIsSUFBSSxDQUFDRSxvQkFBb0I7WUFDdkIsT0FBT0gscURBQVlBLENBQUNVLElBQUksQ0FDdEI7Z0JBQUVDLE9BQU87WUFBcUgsR0FDOUg7Z0JBQUVDLFFBQVE7WUFBSTtRQUVsQjtRQUVBLDRCQUE0QjtRQUM1QixzREFBc0Q7UUFDdEQsc0NBQXNDO1FBQ3RDLE1BQU1DLFNBQVM7WUFBQztZQUFpQjtZQUFrQjtTQUFrQixDQUFDQyxJQUFJLENBQUM7UUFDM0UsTUFBTUMsUUFBUUMsT0FBT0MsSUFBSSxDQUFDQyxLQUFLQyxTQUFTLENBQUM7WUFBRUMsSUFBSUMsS0FBS0MsR0FBRztRQUFHLElBQUlDLFFBQVEsQ0FBQztRQUV2RSxNQUFNQyxVQUFVLElBQUlDLElBQUk7UUFDeEJELFFBQVFFLFlBQVksQ0FBQ0MsR0FBRyxDQUFDLGlCQUFpQjtRQUMxQ0gsUUFBUUUsWUFBWSxDQUFDQyxHQUFHLENBQUMsYUFBYXhCO1FBQ3RDcUIsUUFBUUUsWUFBWSxDQUFDQyxHQUFHLENBQUMsZ0JBQWdCckI7UUFDekNrQixRQUFRRSxZQUFZLENBQUNDLEdBQUcsQ0FBQyxTQUFTZDtRQUNsQ1csUUFBUUUsWUFBWSxDQUFDQyxHQUFHLENBQUMsU0FBU1o7UUFFbEMsT0FBT2YscURBQVlBLENBQUM0QixRQUFRLENBQUNKLFFBQVFELFFBQVE7SUFDL0MsRUFBRSxPQUFPWixPQUFPO1FBQ2QsSUFBSTtZQUFFLE9BQU9ULGtFQUFlQSxDQUFDUztRQUFPLEVBQUUsT0FBTSxDQUFDO1FBQzdDLE9BQU9YLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFnQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNyRTtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWVyYWtpLy4vc3JjL2FwcC9hcGkvaW50ZWdyYXRpb25zL2xpbmtlZGluL2Nvbm5lY3Qvcm91dGUudHM/YzE2YyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcidcclxuaW1wb3J0IHsgZ2V0UmVxdWlyZWRTZXNzaW9uLCBoYW5kbGVBdXRoRXJyb3IgfSBmcm9tICdAL2xpYi9hdXRoLWhlbHBlcnMnXHJcblxyXG5jb25zdCBMSU5LRURJTl9DTElFTlRfSUQgPSBwcm9jZXNzLmVudi5MSU5LRURJTl9DTElFTlRfSUQgPz8gJydcclxuY29uc3QgUkVESVJFQ1RfVVJJID0gYCR7cHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfQVBQX1VSTH0vYXBpL2ludGVncmF0aW9ucy9saW5rZWRpbi9jYWxsYmFja2BcclxuXHJcbi8vIEdFVCAvYXBpL2ludGVncmF0aW9ucy9saW5rZWRpbi9jb25uZWN0IOKAlCBJbml0aWF0ZSBMaW5rZWRJbiBPQXV0aFxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKF9yZXF1ZXN0OiBSZXF1ZXN0KSB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGdldFJlcXVpcmVkU2Vzc2lvbigpXHJcblxyXG4gICAgaWYgKCFMSU5LRURJTl9DTElFTlRfSUQpIHtcclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxyXG4gICAgICAgIHsgZXJyb3I6ICdMaW5rZWRJbiBPQXV0aCBpcyBub3QgY29uZmlndXJlZC4gQWRkIExJTktFRElOX0NMSUVOVF9JRCBhbmQgTElOS0VESU5fQ0xJRU5UX1NFQ1JFVCB0byB5b3VyIGVudmlyb25tZW50IHZhcmlhYmxlcy4nIH0sXHJcbiAgICAgICAgeyBzdGF0dXM6IDUwMyB9XHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvLyBMaW5rZWRJbiBPQXV0aCAyLjAgc2NvcGVzXHJcbiAgICAvLyByX2xpdGVwcm9maWxlOiBiYXNpYyBwcm9maWxlLCByX2VtYWlsYWRkcmVzczogZW1haWxcclxuICAgIC8vIHdfbWVtYmVyX3NvY2lhbDogcG9zdGluZyAob3B0aW9uYWwpXHJcbiAgICBjb25zdCBzY29wZXMgPSBbJ3JfbGl0ZXByb2ZpbGUnLCAncl9lbWFpbGFkZHJlc3MnLCAnd19tZW1iZXJfc29jaWFsJ10uam9pbignICcpXHJcbiAgICBjb25zdCBzdGF0ZSA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHsgdHM6IERhdGUubm93KCkgfSkpLnRvU3RyaW5nKCdiYXNlNjQnKVxyXG5cclxuICAgIGNvbnN0IGF1dGhVcmwgPSBuZXcgVVJMKCdodHRwczovL3d3dy5saW5rZWRpbi5jb20vb2F1dGgvdjIvYXV0aG9yaXphdGlvbicpXHJcbiAgICBhdXRoVXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3Jlc3BvbnNlX3R5cGUnLCAnY29kZScpXHJcbiAgICBhdXRoVXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2NsaWVudF9pZCcsIExJTktFRElOX0NMSUVOVF9JRClcclxuICAgIGF1dGhVcmwuc2VhcmNoUGFyYW1zLnNldCgncmVkaXJlY3RfdXJpJywgUkVESVJFQ1RfVVJJKVxyXG4gICAgYXV0aFVybC5zZWFyY2hQYXJhbXMuc2V0KCdzY29wZScsIHNjb3BlcylcclxuICAgIGF1dGhVcmwuc2VhcmNoUGFyYW1zLnNldCgnc3RhdGUnLCBzdGF0ZSlcclxuXHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLnJlZGlyZWN0KGF1dGhVcmwudG9TdHJpbmcoKSlcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdHJ5IHsgcmV0dXJuIGhhbmRsZUF1dGhFcnJvcihlcnJvcikgfSBjYXRjaCB7fVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdBdXRoIHJlcXVpcmVkJyB9LCB7IHN0YXR1czogNDAxIH0pXHJcbiAgfVxyXG59XHJcbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJnZXRSZXF1aXJlZFNlc3Npb24iLCJoYW5kbGVBdXRoRXJyb3IiLCJMSU5LRURJTl9DTElFTlRfSUQiLCJwcm9jZXNzIiwiZW52IiwiUkVESVJFQ1RfVVJJIiwiTkVYVF9QVUJMSUNfQVBQX1VSTCIsIkdFVCIsIl9yZXF1ZXN0IiwianNvbiIsImVycm9yIiwic3RhdHVzIiwic2NvcGVzIiwiam9pbiIsInN0YXRlIiwiQnVmZmVyIiwiZnJvbSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0cyIsIkRhdGUiLCJub3ciLCJ0b1N0cmluZyIsImF1dGhVcmwiLCJVUkwiLCJzZWFyY2hQYXJhbXMiLCJzZXQiLCJyZWRpcmVjdCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/integrations/linkedin/connect/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth-helpers.ts":
/*!*********************************!*\
  !*** ./src/lib/auth-helpers.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthError: () => (/* binding */ AuthError),\n/* harmony export */   getRequiredSession: () => (/* binding */ getRequiredSession),\n/* harmony export */   getSession: () => (/* binding */ getSession),\n/* harmony export */   handleAuthError: () => (/* binding */ handleAuthError)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n\n\nasync function getSession() {\n    return await (0,next_auth__WEBPACK_IMPORTED_MODULE_0__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_1__.authOptions);\n}\nasync function getRequiredSession() {\n    const session = await getSession();\n    if (!session?.user) {\n        throw new AuthError(\"Unauthorized\");\n    }\n    return session;\n}\nclass AuthError extends Error {\n    constructor(message){\n        super(message);\n        this.name = \"AuthError\";\n    }\n}\nfunction handleAuthError(error) {\n    if (error instanceof AuthError) {\n        return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    throw error;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGgtaGVscGVycy50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUE0QztBQUNKO0FBQ0U7QUFFbkMsZUFBZUc7SUFDcEIsT0FBTyxNQUFNSCwyREFBZ0JBLENBQUNDLGtEQUFXQTtBQUMzQztBQUVPLGVBQWVHO0lBQ3BCLE1BQU1DLFVBQVUsTUFBTUY7SUFDdEIsSUFBSSxDQUFDRSxTQUFTQyxNQUFNO1FBQ2xCLE1BQU0sSUFBSUMsVUFBVTtJQUN0QjtJQUNBLE9BQU9GO0FBQ1Q7QUFFTyxNQUFNRSxrQkFBa0JDO0lBQzdCQyxZQUFZQyxPQUFlLENBQUU7UUFDM0IsS0FBSyxDQUFDQTtRQUNOLElBQUksQ0FBQ0MsSUFBSSxHQUFHO0lBQ2Q7QUFDRjtBQUVPLFNBQVNDLGdCQUFnQkMsS0FBYztJQUM1QyxJQUFJQSxpQkFBaUJOLFdBQVc7UUFDOUIsT0FBT0wscURBQVlBLENBQUNZLElBQUksQ0FBQztZQUFFRCxPQUFPO1FBQWUsR0FBRztZQUFFRSxRQUFRO1FBQUk7SUFDcEU7SUFDQSxNQUFNRjtBQUNSIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWVyYWtpLy4vc3JjL2xpYi9hdXRoLWhlbHBlcnMudHM/YTYzMCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRTZXJ2ZXJTZXNzaW9uIH0gZnJvbSAnbmV4dC1hdXRoJ1xyXG5pbXBvcnQgeyBhdXRoT3B0aW9ucyB9IGZyb20gJ0AvbGliL2F1dGgnXHJcbmltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJ1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNlc3Npb24oKSB7XHJcbiAgcmV0dXJuIGF3YWl0IGdldFNlcnZlclNlc3Npb24oYXV0aE9wdGlvbnMpXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRSZXF1aXJlZFNlc3Npb24oKSB7XHJcbiAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IGdldFNlc3Npb24oKVxyXG4gIGlmICghc2Vzc2lvbj8udXNlcikge1xyXG4gICAgdGhyb3cgbmV3IEF1dGhFcnJvcignVW5hdXRob3JpemVkJylcclxuICB9XHJcbiAgcmV0dXJuIHNlc3Npb25cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEF1dGhFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKG1lc3NhZ2UpXHJcbiAgICB0aGlzLm5hbWUgPSAnQXV0aEVycm9yJ1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUF1dGhFcnJvcihlcnJvcjogdW5rbm93bikge1xyXG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEF1dGhFcnJvcikge1xyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSlcclxuICB9XHJcbiAgdGhyb3cgZXJyb3JcclxufVxyXG4iXSwibmFtZXMiOlsiZ2V0U2VydmVyU2Vzc2lvbiIsImF1dGhPcHRpb25zIiwiTmV4dFJlc3BvbnNlIiwiZ2V0U2Vzc2lvbiIsImdldFJlcXVpcmVkU2Vzc2lvbiIsInNlc3Npb24iLCJ1c2VyIiwiQXV0aEVycm9yIiwiRXJyb3IiLCJjb25zdHJ1Y3RvciIsIm1lc3NhZ2UiLCJuYW1lIiwiaGFuZGxlQXV0aEVycm9yIiwiZXJyb3IiLCJqc29uIiwic3RhdHVzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth-helpers.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    throw new Error(\"Email and password are required\");\n                }\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__[\"default\"].user.findUnique({\n                    where: {\n                        email: credentials.email\n                    },\n                    include: {\n                        organization: true\n                    }\n                });\n                if (!user || !user.password) {\n                    throw new Error(\"Invalid email or password\");\n                }\n                const isValid = await bcryptjs__WEBPACK_IMPORTED_MODULE_1__[\"default\"].compare(credentials.password, user.password);\n                if (!isValid) {\n                    throw new Error(\"Invalid email or password\");\n                }\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name,\n                    role: user.role,\n                    organizationId: user.organizationId,\n                    organizationName: user.organization.name\n                };\n            }\n        })\n    ],\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    },\n    callbacks: {\n        async jwt ({ token, user, trigger, session }) {\n            if (user) {\n                token.role = user.role;\n                token.organizationId = user.organizationId;\n                token.organizationName = user.organizationName;\n            }\n            if (trigger === \"update\" && session) {\n                if (session.name) {\n                    token.name = session.name;\n                }\n                if (session.email) {\n                    token.email = session.email;\n                }\n                if (session.organizationName) {\n                    token.organizationName = session.organizationName;\n                }\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.sub;\n                session.user.name = token.name;\n                session.user.email = token.email;\n                session.user.role = token.role;\n                session.user.organizationId = token.organizationId;\n                session.user.organizationName = token.organizationName;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/auth/login\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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T0FBTztRQUNMQyxRQUFRO0lBQ1Y7QUFDRixFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWVyYWtpLy4vc3JjL2xpYi9hdXRoLnRzPzY2OTIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dEF1dGhPcHRpb25zIH0gZnJvbSAnbmV4dC1hdXRoJ1xyXG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tICduZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzJ1xyXG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdGpzJ1xyXG5pbXBvcnQgcHJpc21hIGZyb20gJ0AvbGliL3ByaXNtYSdcclxuXHJcbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogTmV4dEF1dGhPcHRpb25zID0ge1xyXG4gIHByb3ZpZGVyczogW1xyXG4gICAgQ3JlZGVudGlhbHNQcm92aWRlcih7XHJcbiAgICAgIG5hbWU6ICdjcmVkZW50aWFscycsXHJcbiAgICAgIGNyZWRlbnRpYWxzOiB7XHJcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6ICdFbWFpbCcsIHR5cGU6ICdlbWFpbCcgfSxcclxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogJ1Bhc3N3b3JkJywgdHlwZTogJ3Bhc3N3b3JkJyB9LFxyXG4gICAgICB9LFxyXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcclxuICAgICAgICBpZiAoIWNyZWRlbnRpYWxzPy5lbWFpbCB8fCAhY3JlZGVudGlhbHM/LnBhc3N3b3JkKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VtYWlsIGFuZCBwYXNzd29yZCBhcmUgcmVxdWlyZWQnKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xyXG4gICAgICAgICAgd2hlcmU6IHsgZW1haWw6IGNyZWRlbnRpYWxzLmVtYWlsIH0sXHJcbiAgICAgICAgICBpbmNsdWRlOiB7IG9yZ2FuaXphdGlvbjogdHJ1ZSB9LFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICghdXNlciB8fCAhdXNlci5wYXNzd29yZCkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGVtYWlsIG9yIHBhc3N3b3JkJylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGlzVmFsaWQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShjcmVkZW50aWFscy5wYXNzd29yZCwgdXNlci5wYXNzd29yZClcclxuICAgICAgICBpZiAoIWlzVmFsaWQpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaWQ6IHVzZXIuaWQsXHJcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcclxuICAgICAgICAgIG5hbWU6IHVzZXIubmFtZSxcclxuICAgICAgICAgIHJvbGU6IHVzZXIucm9sZSxcclxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiB1c2VyLm9yZ2FuaXphdGlvbklkLFxyXG4gICAgICAgICAgb3JnYW5pemF0aW9uTmFtZTogdXNlci5vcmdhbml6YXRpb24ubmFtZSxcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIHNlc3Npb246IHtcclxuICAgIHN0cmF0ZWd5OiAnand0JyxcclxuICAgIG1heEFnZTogMzAgKiAyNCAqIDYwICogNjAsIC8vIDMwIGRheXNcclxuICB9LFxyXG4gIGNhbGxiYWNrczoge1xyXG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIsIHRyaWdnZXIsIHNlc3Npb24gfSkge1xyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIHRva2VuLnJvbGUgPSAodXNlciBhcyBhbnkpLnJvbGVcclxuICAgICAgICB0b2tlbi5vcmdhbml6YXRpb25JZCA9ICh1c2VyIGFzIGFueSkub3JnYW5pemF0aW9uSWRcclxuICAgICAgICB0b2tlbi5vcmdhbml6YXRpb25OYW1lID0gKHVzZXIgYXMgYW55KS5vcmdhbml6YXRpb25OYW1lXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0cmlnZ2VyID09PSAndXBkYXRlJyAmJiBzZXNzaW9uKSB7XHJcbiAgICAgICAgaWYgKChzZXNzaW9uIGFzIGFueSkubmFtZSkge1xyXG4gICAgICAgICAgdG9rZW4ubmFtZSA9IChzZXNzaW9uIGFzIGFueSkubmFtZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKHNlc3Npb24gYXMgYW55KS5lbWFpbCkge1xyXG4gICAgICAgICAgdG9rZW4uZW1haWwgPSAoc2Vzc2lvbiBhcyBhbnkpLmVtYWlsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoc2Vzc2lvbiBhcyBhbnkpLm9yZ2FuaXphdGlvbk5hbWUpIHtcclxuICAgICAgICAgIHRva2VuLm9yZ2FuaXphdGlvbk5hbWUgPSAoc2Vzc2lvbiBhcyBhbnkpLm9yZ2FuaXphdGlvbk5hbWVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0b2tlblxyXG4gICAgfSxcclxuICAgIGFzeW5jIHNlc3Npb24oeyBzZXNzaW9uLCB0b2tlbiB9KSB7XHJcbiAgICAgIGlmIChzZXNzaW9uLnVzZXIpIHtcclxuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuaWQgPSB0b2tlbi5zdWJcclxuICAgICAgICBzZXNzaW9uLnVzZXIubmFtZSA9IHRva2VuLm5hbWVcclxuICAgICAgICBzZXNzaW9uLnVzZXIuZW1haWwgPSB0b2tlbi5lbWFpbCBhcyBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkXHJcbiAgICAgICAgOyhzZXNzaW9uLnVzZXIgYXMgYW55KS5yb2xlID0gdG9rZW4ucm9sZVxyXG4gICAgICAgIDsoc2Vzc2lvbi51c2VyIGFzIGFueSkub3JnYW5pemF0aW9uSWQgPSB0b2tlbi5vcmdhbml6YXRpb25JZFxyXG4gICAgICAgIDsoc2Vzc2lvbi51c2VyIGFzIGFueSkub3JnYW5pemF0aW9uTmFtZSA9IHRva2VuLm9yZ2FuaXphdGlvbk5hbWVcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc2Vzc2lvblxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBhZ2VzOiB7XHJcbiAgICBzaWduSW46ICcvYXV0aC9sb2dpbicsXHJcbiAgfSxcclxufVxyXG4iXSwibmFtZXMiOlsiQ3JlZGVudGlhbHNQcm92aWRlciIsImJjcnlwdCIsInByaXNtYSIsImF1dGhPcHRpb25zIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsIkVycm9yIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImluY2x1ZGUiLCJvcmdhbml6YXRpb24iLCJpc1ZhbGlkIiwiY29tcGFyZSIsImlkIiwicm9sZSIsIm9yZ2FuaXphdGlvbklkIiwib3JnYW5pemF0aW9uTmFtZSIsInNlc3Npb24iLCJzdHJhdGVneSIsIm1heEFnZSIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwidHJpZ2dlciIsInN1YiIsInBhZ2VzIiwic2lnbkluIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) globalForPrisma.prisma = prisma;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQTZDO0FBRTdDLE1BQU1DLGtCQUFrQkM7QUFJakIsTUFBTUMsU0FBU0YsZ0JBQWdCRSxNQUFNLElBQUksSUFBSUgsd0RBQVlBLEdBQUU7QUFFbEUsSUFBSUksSUFBeUIsRUFBY0gsZ0JBQWdCRSxNQUFNLEdBQUdBO0FBRXBFLGlFQUFlQSxNQUFNQSxFQUFBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWVyYWtpLy4vc3JjL2xpYi9wcmlzbWEudHM/MDFkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcclxuXHJcbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7XHJcbiAgcHJpc21hOiBQcmlzbWFDbGllbnQgfCB1bmRlZmluZWRcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHByaXNtYSA9IGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPz8gbmV3IFByaXNtYUNsaWVudCgpXHJcblxyXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJpc21hXHJcbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/preact-render-to-string","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&page=%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fintegrations%2Flinkedin%2Fconnect%2Froute.ts&appDir=C%3A%5CArnav_Projects%5CMeraki%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CArnav_Projects%5CMeraki&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();