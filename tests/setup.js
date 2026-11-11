import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearQueryCache } from "../src/services/queryCache.js";

// Кэш запросов живёт в памяти модуля — между тестами его надо очищать.
beforeEach(clearQueryCache);
afterEach(cleanup);
