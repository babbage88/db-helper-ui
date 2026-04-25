import { OpenAPI } from "@/lib/api";

OpenAPI.BASE = import.meta.env.VITE_API_WEB_INFRA_URL;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";
OpenAPI.TOKEN = undefined;
