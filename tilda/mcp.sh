#!/bin/bash
# usage: echo '<json-rpc body>' | TILDA_MCP_KEY=... mcp.sh — вызывает MCP-сервер Тильды. Ключ — только из переменной окружения.
D=$(dirname "$0")/work; mkdir -p $D; T=${TILDA_MCP_KEY:?TILDA_MCP_KEY не задан}; SID=$(cat $D/.sid 2>/dev/null)
curl -sS -m 120 -D $D/.hdr https://tilda.cc/api/mcp/ -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H 'MCP-Protocol-Version: 2025-06-18' ${SID:+-H "Mcp-Session-Id: $SID"} --data-binary @-
s=$(grep -i '^mcp-session-id:' $D/.hdr | tr -d '\r' | cut -d' ' -f2); [ -n "$s" ] && echo -n "$s" > $D/.sid; true
